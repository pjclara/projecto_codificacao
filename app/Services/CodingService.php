<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Adapters\OpenAIAdapter;

class CodingService
{
    protected $openAI;
    protected static $cmsKeywordsCache = null;
    protected static $pcsKeywordsCache = null;

    public function __construct(OpenAIAdapter $openAI = null)
    {
        $this->openAI = $openAI;
    }

    /**
     * Get CMS keywords with caching
     */
    protected function getCMSKeywords(): array
    {
        if (self::$cmsKeywordsCache === null) {
            self::$cmsKeywordsCache = $this->buildCMSKeywords();
        }
        return self::$cmsKeywordsCache;
    }

    /**
     * Get PCS keywords with caching
     */
    protected function getPCSKeywords(): array
    {
        if (self::$pcsKeywordsCache === null) {
            self::$pcsKeywordsCache = $this->buildPCSKeywords();
        }
        return self::$pcsKeywordsCache;
    }

    /**
     * Analyze clinical text: local matching + optional AI.
     * Returns array with principal_candidate, secondary_candidates, procedure_candidates, flags
     */
    public function analyze(string $clinicalText, bool $useAi = false): array
    {
        $normalized = $this->normalizeText($clinicalText);

        // 1) Extract tokens/keywords
        $tokens = $this->extractTokens($normalized);

        // 2) Local ICD matching (PCS and CMS)
        $localMatches = $this->localMatch($tokens, $normalized);

        // 3) Procedure extraction (naive: look for keywords like 'ectomy', 'repair', etc.)
        $procedureCandidates = $this->extractProcedures($normalized);

        // 4) Detect red flags
        $flags = $this->detectFlags($normalized);

        $aiResults = null;
        if ($useAi && $this->openAI) {
            try {
                $aiResults = $this->openAI->analyzeCoding($clinicalText, $localMatches);
            } catch (\Exception $e) {
                // swallow AI errors; return local results with a note
                $aiResults = ['error' => $e->getMessage()];
            }
        }

        // Merge AI results with local matches if available
        $merged = $this->mergeResults($localMatches, $aiResults);

        // Build structured response
        return [
            'principal_candidate' => $merged['principal'] ?? null,
            'secondary_candidates' => $merged['secondary'] ?? [],
            'procedure_candidates' => $procedureCandidates,
            'flags' => $flags,
            'ai' => $aiResults,
        ];
    }

    protected function normalizeText(string $text): string
    {
        $text = mb_strtolower($text, 'UTF-8');
        // remove accents
        $text = iconv('UTF-8', 'ASCII//TRANSLIT', $text) ?: $text;
        // collapse whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }

    protected function extractTokens(string $text): array
    {
        // very simple tokenizer: words > 3 chars, exclude common stopwords
        $stop = ['the', 'and', 'with', 'from', 'that', 'this', 'for', 'was', 'were', 'are', 'is', 'a', 'an', 'of', 'in', 'on', 'to'];
        $words = preg_split('/[^a-z0-9]+/i', $text);
        $tokens = [];
        foreach ($words as $w) {
            $w = trim($w);
            if (strlen($w) < 4) continue;
            if (in_array($w, $stop)) continue;
            $tokens[] = $w;
        }
        return array_values(array_unique($tokens));
    }

    /**
     * Combina matching PCS + CMS
     */
    protected function localMatch(array $tokens, string $text): array
    {
        // Matching de DIAGNÓSTICOS (CMS)
        $cms = $this->localMatchCMS($tokens, $text);

        // Matching de PROCEDIMENTOS (PCS)
        $pcs = $this->localMatchPCS($tokens, $text);

        // Regras:
        // - Diagnóstico principal (CMS) tem prioridade sobre PCS
        // - PCS não pode ser principal (exceto nota cirúrgica isolada)
        // - Secundários: mistura dos dois

        $principal = $cms['principal'] ?? $pcs['principal'] ?? null;

        $secondary = array_merge(
            $cms['secondary'] ?? [],
            $pcs['secondary'] ?? []
        );

        return [
            'principal' => $principal,
            'secondary' => $secondary,
        ];
    }

    /**
     * Matching ICD-10-PCS com scoring clínico realista + keywords automáticos
     */
    protected function localMatchPCS(array $tokens, string $text): array
    {
        if (empty($tokens)) {
            return ['principal' => null, 'secondary' => []];
        }

        // Obter keywords automáticos (com cache)
        $autoKeywords = $this->getPCSKeywords();

        // Pesos clínicos para procedimentos vasculares, GI, ortopédicos etc.
        $manualWeights = [
            'bypass' => 10,
            'femoro' => 8,
            'femoral' => 8,
            'tibial' => 8,
            'arteria' => 7,
            'arterial' => 7,
            'vascular' => 5,

            'colectomia' => 10,
            'laparotomia' => 8,
            'apendice' => 6,
            'gastrectomia' => 9,
            'colostomia' => 9,
            'hemicolectomia' => 10,

            'ortho' => 2,
            'articulacao' => 2,
        ];

        // Combinar weights manuais com automáticos (priorizando manuais)
        $weights = $manualWeights;
        foreach ($autoKeywords as $keyword => $freq) {
            if (!isset($weights[$keyword])) {
                // Peso baseado em frequência: quanto mais raro, mais específico
                // Invertemos a lógica: keywords raros = mais peso
                $weight = max(1, min(10, 100 / ($freq + 1)));
                $weights[$keyword] = $weight;
            }
        }

        // Penalizações de procedimentos irrelevantes ao texto
        $penalties = [
            'ventriculo' => -10,
            'cerebral' => -10,
            'craniano' => -10,
            'sistema nervoso' => -10,
        ];

        $rows = DB::table('icd10pcs')
            ->select('id', 'codigo', 'descricao_longa', 'descricao_curta')
            ->get();

        $candidates = [];

        foreach ($rows as $r) {
            $desc = strtolower($r->descricao_longa ?: $r->descricao_curta);
            $score = 0;

            // scoring com weights combinados
            foreach ($weights as $word => $w) {
                if (str_contains($text, $word) && str_contains($desc, $word)) {
                    $score += $w;
                }
            }

            // penalizar
            foreach ($penalties as $bad => $p) {
                if (str_contains($desc, $bad)) {
                    $score += $p;
                }
            }

            if ($score <= 0) continue;

            $candidates[] = [
                'id' => $r->id,
                'codigo' => $r->codigo,
                'descricao' => $desc,
                'type' => 'pcs',
                'score' => $score,
            ];
        }

        usort($candidates, fn($a, $b) => $b['score'] <=> $a['score']);

        return [
            'principal' => $candidates[0] ?? null,
            'secondary' => array_slice($candidates, 1, 10),
        ];
    }

    /**
     * Matching ICD-10-CM (diagnósticos) com heurísticas clínicas reais + keywords automáticos
     */
    protected function localMatchCMS(array $tokens, string $text): array
    {
        // Obter keywords automáticos (com cache)
        $autoKeywords = $this->getCMSKeywords();

        // Pesos clínicos manuais (prioritários)
        $manualWeights = [
            // críticos
            'sepsis' => 10,
            'septicemia' => 10,
            'choque septico' => 10,
            'pneumonia' => 9,
            'insuficiencia respiratoria' => 9,
            'insuficiencia renal aguda' => 9,
            'aki' => 9,
            'choque' => 10,
            'enfarte' => 10,
            'infarto' => 10,

            // agudos comuns
            'apendicite' => 8,
            'colecistite' => 8,
            'diverticulite' => 8,
            'pancreatite' => 8,
            'avc' => 8,
            'stroke' => 8,
            'dpoc' => 8,

            // crónicos relevantes
            'diabetes' => 3,
            'hipertensao' => 3,
            'irc' => 3,
            'insuficiencia renal cronica' => 3,
            'fibrilacao auricular' => 3,

            // outros
            'anemia' => 2,
            'hipotiroidismo' => 1,
        ];

        // Combinar weights manuais com automáticos
        $weights = $manualWeights;
        foreach ($autoKeywords as $keyword => $freq) {
            if (!isset($weights[$keyword])) {
                // Peso baseado em raridade (keywords raros = mais específicos)
                $weight = max(1, min(8, 80 / ($freq + 1)));
                $weights[$keyword] = $weight;
            }
        }

        // Sinónimos
        $synonyms = [
            'sepsis' => ['sepsis', 'septicemia', 'septic', 'choque septico'],
            'aki' => ['aki', 'insuficiencia renal aguda', 'acute kidney injury', 'acute renal failure'],
            'pneumonia' => ['pneumonia', 'pneumonia viral', 'pneumonia bacteriana'],
            'uti' => ['uti', 'urinary tract infection', 'infeccao urinaria', 'pielonefrite'],
            'dpoc' => ['dpoc', 'copd', 'exacerbacao dpoc'],
            'stroke' => ['avc', 'stroke', 'acidente vascular'],
        ];

        // Penalizações
        $penalties = [
            'obstetrico' => -8,
            'gravidez' => -8,
            'congenito' => -8,
            'neonatal' => -8,
            'tumor' => -4,
        ];

        $rows = DB::table('icd10cms')
            ->select('id', 'codigo', 'descricao_longa', 'descricao_curta')
            ->get();

        $candidates = [];

        foreach ($rows as $r) {
            $desc = strtolower($r->descricao_longa ?: $r->descricao_curta);
            $score = 0;

            // Pesos diretos (agora com keywords combinados)
            foreach ($weights as $word => $w) {
                if (str_contains($text, $word) && str_contains($desc, $word)) {
                    $score += $w;
                }
            }

            // Sinónimos
            foreach ($synonyms as $group => $syns) {
                foreach ($syns as $s) {
                    if (str_contains($text, $s) && str_contains($desc, $s)) {
                        $score += $weights[$group] ?? 3;
                    }
                }
            }

            // Penalizações
            foreach ($penalties as $bad => $p) {
                if (str_contains($desc, $bad) && !str_contains($text, $bad)) {
                    $score += $p;
                }
            }

            if ($score <= 0) continue;

            $candidates[] = [
                'id' => $r->id,
                'codigo' => $r->codigo,
                'descricao' => $desc,
                'type' => 'cms',
                'score' => $score,
            ];
        }

        usort($candidates, fn($a, $b) => $b['score'] <=> $a['score']);

        return [
            'principal' => $candidates[0] ?? null,
            'secondary' => array_slice($candidates, 1, 10),
        ];
    }


    protected function extractProcedures(string $text): array
    {
        // naive: look for common surgical keywords and return short matches
        $procedures = [];
        $keywords = ['appendectomy', 'apendicectomia', 'colostomy', 'resection', 'hysterectomy', 'bypass', 'transplant', 'repair', 'excision', 'embolectomy', 'arthroplasty'];
        foreach ($keywords as $kw) {
            if (mb_stripos($text, $kw) !== false) {
                $procedures[] = ['text' => $kw];
            }
        }
        return array_values(array_unique($procedures, SORT_REGULAR));
    }

    protected function detectFlags(string $text): array
    {
        $flags = [];
        $patterns = [
            'sepsis' => ['sepsis', 'septic', 'septicemia', 'septic shock'],
            'shock' => ['shock', 'cardiogenic shock', 'hypovolemic shock', 'septic shock'],
            'acute_kidney_injury' => ['acute kidney injury', 'aki', 'acute renal failure', 'insuficiencia renal aguda'],
            'mechanical_ventilation' => ['mechanical ventilation', 'intubated', 'ventilated', 'mechanical ventilator'],
            'transfusion' => ['transfusion', 'received blood', 'blood transfusion']
        ];

        foreach ($patterns as $flag => $keywords) {
            foreach ($keywords as $kw) {
                if (mb_stripos($text, $kw) !== false) {
                    $flags[] = $flag;
                    break;
                }
            }
        }

        return array_values(array_unique($flags));
    }

    protected function mergeResults(array $local, $aiResults = null): array
    {
        $principal = $local['principal'] ?? null;
        $secondary = $local['secondary'] ?? [];

        if (is_array($aiResults) && isset($aiResults['validated']) && is_array($aiResults['validated'])) {
            // if AI suggests a principal, prefer it
            $aiPrimary = $aiResults['validated'][0] ?? null;
            if ($aiPrimary) {
                $principal = $aiPrimary;
                // AI validated others as secondary
                $secondary = array_slice($aiResults['validated'], 1, 9);
            }
        }

        return ['principal' => $principal, 'secondary' => $secondary];
    }

    /**
     * Build CMS keywords dictionary from database descriptions
     * Returns array with keyword => frequency
     */
    public function buildCMSKeywords(): array
    {
        $rows = DB::table('icd10cms')->select('descricao_longa')->get();
        $keywords = [];

        // Stopwords expandidas (palavras comuns irrelevantes)
        $stopwords = [
            'aguda', 'cronica', 'tipo', 'doenca', 'sindrome', 'outras', 'outro',
            'nao', 'sem', 'com', 'para', 'sobre', 'entre', 'estado', 'condicao',
            'forma', 'especificada', 'nao especificada', 'completa', 'incompleta'
        ];

        foreach ($rows as $row) {
            if (empty($row->descricao_longa)) continue;

            $text = strtolower($row->descricao_longa);
            $text = str_replace(['→', '-', ',', ';', '(', ')', '[', ']'], ' ', $text);
            $parts = preg_split('/\s+/', $text);

            foreach ($parts as $p) {
                $p = trim($p);
                if (strlen($p) < 4) continue;
                if (in_array($p, $stopwords)) continue;
                if (is_numeric($p)) continue;

                $keywords[$p] = ($keywords[$p] ?? 0) + 1;
            }
        }

        // Filtrar keywords muito frequentes (>1000 ocorrências = genéricas demais)
        $keywords = array_filter($keywords, fn($freq) => $freq < 1000 && $freq > 1);

        // Ordenar por frequência (descendente) para debugging
        arsort($keywords);

        return $keywords;
    }


    /**
     * Build PCS keywords dictionary from database descriptions
     * Returns array with keyword => frequency
     */
    public function buildPCSKeywords(): array
    {
        $rows = DB::table('icd10pcs')->select('descricao_longa')->get();
        $keywords = [];

        // Stopwords expandidas
        $stopwords = [
            'para', 'com', 'sem', 'das', 'dos', 'medico', 'cirurgico', 'aberta',
            'percutanea', 'endoscopica', 'outras', 'outro', 'nao', 'dispositivo',
            'tecido', 'substituto', 'autólogo', 'sintetico', 'artificial', 'natural'
        ];

        foreach ($rows as $row) {
            if (empty($row->descricao_longa)) continue;

            $text = strtolower($row->descricao_longa);
            // Remover acentos para normalização
            $text = iconv('UTF-8', 'ASCII//TRANSLIT', $text) ?: $text;
            $text = str_replace(['→', '-', ',', ';', '(', ')', '[', ']'], ' ', $text);
            $parts = preg_split('/\s+/', $text);

            foreach ($parts as $p) {
                $p = trim($p);
                if (strlen($p) < 4) continue;
                if (in_array($p, $stopwords)) continue;
                if (is_numeric($p)) continue;

                $keywords[$p] = ($keywords[$p] ?? 0) + 1;
            }
        }

        // Filtrar keywords muito frequentes (>1000 = genéricas) ou muito raras (1 = ruído)
        $keywords = array_filter($keywords, fn($freq) => $freq < 1000 && $freq > 1);

        // Ordenar por frequência
        arsort($keywords);

        return $keywords;
    }
}
