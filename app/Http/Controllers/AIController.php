<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use OpenAI;

class AIController extends Controller
{
    /**
     * Sugere códigos ICD-10-PCS baseados em similaridade semântica.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sugerir(Request $request)
    {
        // Validar entrada
        $request->validate([
            'texto' => 'required|string|min:3',
        ]);

        $texto = $request->input('texto');

        try {
            // Verificar se a API key está configurada
            $apiKey = config('services.openai.api_key');
            
            if (empty($apiKey)) {
                return response()->json([
                    'error' => 'API key da OpenAI não configurada',
                    'message' => 'Configure a variável OPENAI_API_KEY no arquivo .env'
                ], 500);
            }

            // 1. Criar embedding da entrada usando OpenAI
            $client = OpenAI::client($apiKey);
            
            $response = $client->embeddings()->create([
                'model' => 'text-embedding-3-small',
                'input' => $texto,
            ]);
            
            $embeddingEntrada = $response->embeddings[0]->embedding;

            // 2. Buscar todos os embeddings da tabela icd10pcs
            $registros = DB::table('icd10pcs')
                ->select('id', 'codigo', 'descricao_curta', 'descricao_longa', 'embedding')
                ->whereNotNull('embedding')
                ->get();

            if ($registros->isEmpty()) {
                return response()->json([
                    'error' => 'Nenhum embedding encontrado',
                    'message' => 'Execute o comando php artisan embeddings:gerar primeiro'
                ], 404);
            }

            // 3. Calcular similaridade cosseno para cada registro
            $resultados = [];
            
            foreach ($registros as $registro) {
                $embeddingSalvo = json_decode($registro->embedding, true);
                
                if (!is_array($embeddingSalvo)) {
                    continue; // Pular embeddings inválidos
                }
                
                // Calcular similaridade cosseno
                $score = $this->calcularSimilaridadeCosseno($embeddingEntrada, $embeddingSalvo);
                
                $resultados[] = [
                    'id' => $registro->id,
                    'codigo' => $registro->codigo,
                    'descricao' => $registro->descricao_curta ?? $registro->descricao_longa,
                    'score' => round($score, 4),
                ];
            }

            // 4. Ordenar por score (maior para menor)
            usort($resultados, function ($a, $b) {
                return $b['score'] <=> $a['score'];
            });

            // 5. Retornar os top 5 códigos
            $top5 = array_slice($resultados, 0, 5);

            // 6. Enviar para GPT-4o-mini para validar, reordenar e explicar
            $respostaGPT = $this->validarComGPT($client, $texto, $top5);

            return response()->json([
                'texto_entrada' => $texto,
                'total_comparacoes' => count($resultados),
                'sugestoes' => $respostaGPT['sugestoes'],
                'explicacao' => $respostaGPT['explicacao'],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao processar sugestão',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Valida, reordena e explica os resultados usando GPT-4o-mini.
     *
     * @param \OpenAI\Client $client
     * @param string $textoEntrada
     * @param array $top5
     * @return array
     */
    private function validarComGPT($client, string $textoEntrada, array $top5): array
    {
        // Preparar contexto para o GPT
        $codigosFormatados = array_map(function ($item, $index) {
            return sprintf(
                "%d. Código: %s | Descrição: %s | Score: %s",
                $index + 1,
                $item['codigo'],
                $item['descricao'],
                $item['score']
            );
        }, $top5, array_keys($top5));

        $prompt = "Você é um especialista em codificação médica ICD-10-PCS.\n\n"
            . "Um usuário procurou por: \"{$textoEntrada}\"\n\n"
            . "O sistema de embeddings encontrou os seguintes 5 códigos mais relevantes:\n\n"
            . implode("\n", $codigosFormatados) . "\n\n"
            . "Sua tarefa:\n"
            . "1. Analise os códigos retornados\n"
            . "2. Selecione os 3 MELHORES códigos que realmente correspondem à busca\n"
            . "3. Reordene-os se necessário (do mais relevante para o menos relevante)\n"
            . "4. Explique em português claro por que cada um dos 3 códigos é relevante\n\n"
            . "Retorne APENAS um JSON válido no seguinte formato:\n"
            . "{\n"
            . '  "sugestoes": [\n'
            . '    {"codigo": "XXXXX", "descricao": "...", "relevancia": "explicação curta"},\n'
            . '    {"codigo": "XXXXX", "descricao": "...", "relevancia": "explicação curta"},\n'
            . '    {"codigo": "XXXXX", "descricao": "...", "relevancia": "explicação curta"}\n'
            . "  ],\n"
            . '  "explicacao": "Explicação geral sobre os códigos selecionados e como eles se relacionam com a busca"\n'
            . "}\n\n"
            . "NÃO adicione texto antes ou depois do JSON. Retorne APENAS o JSON válido.";

        try {
            $response = $client->chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Você é um assistente especializado em codificação médica ICD-10-PCS. Sempre retorne respostas em formato JSON válido.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.3,
                'max_tokens' => 1000,
            ]);

            $conteudoResposta = $response->choices[0]->message->content;

            // Tentar extrair JSON da resposta
            $conteudoResposta = trim($conteudoResposta);
            
            // Remover possíveis markdown code blocks
            $conteudoResposta = preg_replace('/^```json\s*/m', '', $conteudoResposta);
            $conteudoResposta = preg_replace('/^```\s*/m', '', $conteudoResposta);
            $conteudoResposta = trim($conteudoResposta);

            $jsonDecodificado = json_decode($conteudoResposta, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                // Se falhar ao decodificar, retornar top 3 original com explicação genérica
                return [
                    'sugestoes' => array_slice($top5, 0, 3),
                    'explicacao' => 'Estes são os códigos mais similares baseados em análise semântica. Erro ao processar validação com IA: ' . json_last_error_msg()
                ];
            }

            // Validar estrutura do JSON
            if (!isset($jsonDecodificado['sugestoes']) || !isset($jsonDecodificado['explicacao'])) {
                return [
                    'sugestoes' => array_slice($top5, 0, 3),
                    'explicacao' => 'Estes são os códigos mais similares baseados em análise semântica. Formato de resposta da IA inválido.'
                ];
            }

            return $jsonDecodificado;

        } catch (\Exception $e) {
            // Em caso de erro, retornar top 3 original
            return [
                'sugestoes' => array_slice($top5, 0, 3),
                'explicacao' => 'Estes são os códigos mais similares baseados em análise semântica. Erro na validação com IA: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Calcula a similaridade cosseno entre dois vetores.
     *
     * Fórmula: cos(θ) = (A · B) / (||A|| × ||B||)
     * 
     * Onde:
     * - A · B = produto escalar (dot product)
     * - ||A|| = norma (magnitude) do vetor A
     * - ||B|| = norma (magnitude) do vetor B
     *
     * Retorna um valor entre -1 e 1:
     * - 1 = vetores idênticos (ângulo 0°)
     * - 0 = vetores perpendiculares (ângulo 90°)
     * - -1 = vetores opostos (ângulo 180°)
     *
     * @param array $vetor1
     * @param array $vetor2
     * @return float
     */
    private function calcularSimilaridadeCosseno(array $vetor1, array $vetor2): float
    {
        $dimensoes = count($vetor1);
        
        // Verificar se os vetores têm a mesma dimensão
        if ($dimensoes !== count($vetor2)) {
            throw new \InvalidArgumentException('Os vetores devem ter a mesma dimensão');
        }

        if ($dimensoes === 0) {
            return 0.0;
        }

        // Calcular produto escalar (dot product)
        $produtoEscalar = 0.0;
        for ($i = 0; $i < $dimensoes; $i++) {
            $produtoEscalar += $vetor1[$i] * $vetor2[$i];
        }

        // Calcular norma (magnitude) de cada vetor
        $normaVetor1 = 0.0;
        $normaVetor2 = 0.0;
        
        for ($i = 0; $i < $dimensoes; $i++) {
            $normaVetor1 += $vetor1[$i] * $vetor1[$i];
            $normaVetor2 += $vetor2[$i] * $vetor2[$i];
        }
        
        $normaVetor1 = sqrt($normaVetor1);
        $normaVetor2 = sqrt($normaVetor2);

        // Evitar divisão por zero
        if ($normaVetor1 == 0 || $normaVetor2 == 0) {
            return 0.0;
        }

        // Calcular similaridade cosseno
        return $produtoEscalar / ($normaVetor1 * $normaVetor2);
    }
}
