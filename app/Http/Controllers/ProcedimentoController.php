<?php

namespace App\Http\Controllers;

use App\Models\ProcedimentoClinico;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class ProcedimentoController extends Controller
{
    public function index(Request $request)
    {
        // eager-load category -> specialty and codigos so frontend receives nested specialty
        $query = ProcedimentoClinico::where('created_by', Auth::id())
            ->with(['codigos', 'category.specialty', 'specialties']);

        if ($request->filled('search')) { // filled verifica se existe e não está vazio
            $query->where('nome', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->get());
    }

    // Mostra um procedimento com os códigos
    public function show($id)
    {
        $proc = ProcedimentoClinico::with(['codigos', 'category.specialty', 'specialties'])->findOrFail($id);
        return response()->json($proc);
    }

    // uopdate
    public function update(Request $request, $id)
    {
        $proc = ProcedimentoClinico::findOrFail($id);
        $request->validate([
            'nome' => 'required|string|max:255',
            'codigos' => 'required|array|min:1', // precisa pelo menos 1 código
            'codigos.*' => 'exists:icd10pcs,id', // ids da tabela icd10pcs
            'is_public' => 'required|boolean',
            'category_id' => 'nullable|exists:categories,id',
            'specialty_ids' => 'nullable|array',
            'specialty_ids.*' => 'exists:specialties,id',
            'notes' => 'nullable|string'
        ]);
        
        $proc->update([
            'nome' => $request->nome ?? $proc->nome,
            'is_public' => $request->is_public ?? $proc->is_public,
            'category_id' => $request->category_id ?? $proc->category_id,
            'notes' => $request->notes ?? $proc->notes,
        ]);
        if ($request->has('codigos')) {
            $proc->codigos()->sync($request->codigos);
        }
        // Sync specialties (many-to-many)
        if ($request->has('specialty_ids')) {
            $proc->specialties()->sync($request->specialty_ids);
        }
        return response()->json([
            'message' => 'Procedimento atualizado com sucesso',
            // include category.specialty so client receives nested specialty
            'data' => $proc->load(['codigos', 'category.specialty', 'specialties'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nome' => 'required|string|max:255',
            'codigos' => 'required|array|min:1', // precisa pelo menos 1 código
            'codigos.*' => 'exists:icd10pcs,id', // ids da tabela icd10pcs
            'is_public' => 'required|boolean',
            'category_id' => 'nullable|exists:categories,id',
            'specialty_ids' => 'nullable|array',
            'specialty_ids.*' => 'exists:specialties,id',
            'notes' => 'nullable|string'
        ]);

        $proc = \App\Models\ProcedimentoClinico::create([
            'nome' => $request->nome,
            'is_public' => $request->is_public,
            'category_id' => $request->category_id,
            'notes' => $request->notes,
        ]);

        // ligar os códigos ao procedimento
        $proc->codigos()->attach($request->codigos);

        // Attach specialties (many-to-many)
        if ($request->has('specialty_ids') && is_array($request->specialty_ids)) {
            $proc->specialties()->attach($request->specialty_ids);
        }

        return response()->json([
            'message' => 'Procedimento criado com sucesso',
            'data' => $proc->load(['codigos', 'category.specialty', 'specialties'])
        ]);
    }

    // Remove um procedimento
    public function destroy($id)
    {
        $proc = ProcedimentoClinico::findOrFail($id);

        // detach codigos (pivot) handled by cascade or detach explicitly
        $proc->codigos()->detach();

        $proc->delete();

        return response()->json(['message' => 'Procedimento removido com sucesso']);
    }

    // lista procedimentos publicos
    public function publicIndex(Request $request)
    {
        // ensure category.specialty is eager-loaded for public listing
        $query = ProcedimentoClinico::where('is_public', true)
            ->orWhere('created_by', Auth::id())
            ->with(['codigos', 'category.specialty', 'specialties']);

        if ($request->filled('search')) {
            $query->where('nome', 'like', '%' . $request->search . '%');
        }

        return response()->json($query->get());
    }
}
