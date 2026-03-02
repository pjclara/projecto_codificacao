<?php

namespace App\Http\Controllers;

use App\Http\Requests\AnalyzeCodingRequest;
use App\Services\CodingService;
use App\Adapters\OpenAIAdapter;
use Illuminate\Http\JsonResponse;

class CodingController extends Controller
{
    protected $service;

    public function __construct()
    {
        // attempt to construct OpenAIAdapter lazily in the service
        try {
            $openai = new OpenAIAdapter();
        } catch (\Exception $e) {
            $openai = null;
        }

        $this->service = new CodingService($openai);
    }

    /**
     * POST /api/coding/analyze
     */
    public function analyze(AnalyzeCodingRequest $request): JsonResponse
    {
        $data = $request->validated();
        $text = $data['clinical_text'];
        $useAi = isset($data['use_ai']) ? (bool)$data['use_ai'] : false;

        $result = $this->service->analyze($text, $useAi);

        return response()->json($result);
    }
}
