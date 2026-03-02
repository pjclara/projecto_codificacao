<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AnalyzeCodingRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'clinical_text' => ['required', 'string', 'min:10', 'max:20000'],
            'use_ai' => ['sometimes', 'boolean'],
        ];
    }

    public function attributes()
    {
        return [
            'clinical_text' => 'clinical text',
            'use_ai' => 'use AI',
        ];
    }
}
