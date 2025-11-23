<?php

namespace App\Http\Controllers;

use App\Models\Section;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Section::with('specialty')->orderBy('name');

        // Filtro por tipo (kind)
        if ($request->filled('kind')) {
            $query->where('kind', $request->kind);
        }

        // Busca por nome ou notas
        if ($request->filled('search')) {
            $searchTerms = explode(' ', trim($request->search));
            $searchTerms = array_filter($searchTerms);

            $query->where(function ($q) use ($searchTerms) {
                foreach ($searchTerms as $term) {
                    $q->where(function ($subQ) use ($term) {
                        $subQ->where('name', 'like', "%{$term}%")
                            ->orWhere('notes', 'like', "%{$term}%");
                    });
                }
            });
        }

        $sections = $query->paginate($request->per_page ?? 15);

        return response()->json($sections);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'kind' => 'required|in:diagnosticos,procedimentos',
            'specialty_id' => 'nullable|integer|exists:specialties,id',
            'notes' => 'nullable|string',
        ]);

        $section = Section::create($request->all());

        return response()->json($section->load('specialty'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Section $section)
    {
        return response()->json($section->load('specialty'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Section $section)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'kind' => 'required|in:diagnosticos,procedimentos',
            'specialty_id' => 'nullable|integer|exists:specialties,id',
            'notes' => 'nullable|string',
        ]);

        $section->update($request->all());

        return response()->json($section->load('specialty'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Section $section)
    {
        $section->delete();
        return response()->json(['message' => 'Section deleted successfully']);
    }
}
