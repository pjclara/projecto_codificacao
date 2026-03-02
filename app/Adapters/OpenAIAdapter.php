<?php

namespace App\Adapters;

use OpenAI;

class OpenAIAdapter
{
    protected $client;

    public function __construct()
    {
        $apiKey = config('services.openai.api_key') ?? env('OPENAI_API_KEY');
        if (empty($apiKey)) {
            throw new \RuntimeException('OpenAI API key not configured.');
        }
        $this->client = OpenAI::client($apiKey);
    }

    /**
     * Send clinical text and local candidates to OpenAI to validate and suggest codes.
     * Expects response JSON with 'validated' (array) and 'explanation' (string).
     */
    public function analyzeCoding(string $clinicalText, array $localCandidates = []): array
    {
        // Build candidates text block
        $cands = '';
        foreach (array_slice($localCandidates['secondary'] ?? [], 0, 10) as $i => $c) {
            $cands .= sprintf("%d) %s - %s (score: %s)\n", $i+1, $c['codigo'] ?? ($c['codigo'] ?? ''), $c['descricao'] ?? '', $c['score'] ?? '');
        }

        $prompt = "You are a clinical coding assistant. Given the clinical text and a list of local candidate ICD codes, return a JSON with 'validated' (array of up to 3 objects {codigo, descricao, relevancia}) and 'explanation' (string).\n\n";
        $prompt .= "Clinical text:\n" . $clinicalText . "\n\n";
        $prompt .= "Local candidates:\n" . $cands . "\n\n";
        $prompt .= "Return ONLY a JSON object with keys 'validated' and 'explanation'. Do not add extra commentary.";

        $resp = $this->client->chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a concise, strict JSON-only clinical coding assistant.'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.2,
            'max_tokens' => 800,
        ]);

        $content = $resp->choices[0]->message->content ?? '';

        // Strip code fences if any
        $content = preg_replace('/^```json\s*/i', '', $content);
        $content = preg_replace('/```$/', '', $content);
        $content = trim($content);

        $json = json_decode($content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('OpenAI returned invalid JSON: ' . json_last_error_msg());
        }

        return $json;
    }
}
