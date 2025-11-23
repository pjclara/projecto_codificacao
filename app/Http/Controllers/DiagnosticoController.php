<?php

namespace App\Http\Controllers;

use App\Models\DiagnosticoClinico;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DiagnosticoController extends Controller
{
    public function index(Request $request)
    {
        // eager-load category -> specialty, specialties (many-to-many) and codigo
        $query = DiagnosticoClinico::with(['category.specialty', 'specialties', 'codigo'])->where('created_by', Auth::id());

        if ($request->filled('search')) {
            $query->where('nome', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->get());
    }

    public function show(DiagnosticoClinico $diagnostico)
    {
        return response()->json($diagnostico->load(['category.specialty', 'specialties']));
    }

    // update
    public function update(Request $request, DiagnosticoClinico $diagnostico)
    {

        $request->validate([
            'codigo_id' => 'required|exists:icd10cms,id',
            'is_public' => 'required|boolean',
            'category_id' => 'nullable|exists:categories,id',
            'specialty_ids' => 'nullable|array',
            'specialty_ids.*' => 'exists:specialties,id',
            'notes' => 'nullable|string',
        ]);

        $diagnostico->update([
            'nome' => $request->nome ?? $diagnostico->nome,
            'is_public' => $request->is_public ?? $diagnostico->is_public,
            'category_id' => $request->category_id ?? $diagnostico->category_id,
            'codigo_id' => $request->codigo_id,
            'notes' => $request->notes ?? $diagnostico->notes,
        ]);

        // Sync specialties (many-to-many)
        if ($request->has('specialty_ids')) {
            $diagnostico->specialties()->sync($request->specialty_ids);
        }

        return response()->json([
            'message' => 'Diagnóstico atualizado com sucesso',
            // include category.specialty and specialties so the client receives both
            'data' => $diagnostico->load(['category.specialty', 'specialties', 'codigo'])
        ]);
    }

    public function store(Request $request)
    {

        $request->validate([
            'codigo_id' => 'required|exists:icd10cms,id',
            'is_public' => 'required|boolean',
            'category_id' => 'nullable|exists:categories,id',
            'specialty_ids' => 'nullable|array',
            'specialty_ids.*' => 'exists:specialties,id'
        ]);

        $diagnostico = DiagnosticoClinico::create([
            'nome' => $request->nome,
            'is_public' => $request->is_public,
            'category_id' => $request->category_id ?? null,
            'codigo_id' => $request->codigo_id,
        ]);

        // Attach specialties (many-to-many)
        if ($request->has('specialty_ids') && is_array($request->specialty_ids)) {
            $diagnostico->specialties()->attach($request->specialty_ids);
        }

        return response()->json([
            'message' => 'Diagnóstico criado com sucesso',
            'data' => $diagnostico->load(['category.specialty', 'specialties'])
        ]);
    }

    public function destroy(DiagnosticoClinico $diagnostico)
    {
        $diagnostico->delete();

        return response()->json(['message' => 'Diagnóstico deletado com sucesso'], 200);
    }

    // lista os diagnosticos publicos
    public function publicIndex(Request $request)
    {
        // ensure category.specialty and specialties are eager-loaded for public listing
        $query = DiagnosticoClinico::with(['codigo', 'category.specialty', 'specialties'])->where('is_public', true)
            ->orWhere('created_by', Auth::id());
        if ($request->filled('search')) {
            $query->where('nome', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->orderBy('nome')->get());
    }
}
