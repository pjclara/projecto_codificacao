<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::with('specialty')
            ->when($request->query('kind'), function ($query, $kind) {
                $query->where('kind', $kind);
            })
            ->orderBy('name') // opcional: manter ordenado
            ->get();

        return response()->json([
            'data' => $categories
        ]);
    }


    public function show($id)
    {
        $category = \App\Models\Category::with('specialty')->findOrFail($id);
        return response()->json($category);
    }


    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'notes' => 'nullable|string',
            'kind' => 'nullable|string|in:procedimentos,diagnosticos',
            'specialty_id' => 'nullable|exists:specialties,id',
        ]);

        $category = \App\Models\Category::create([
            'name' => $request->name,
            'notes' => $request->notes,
            'kind' => $request->kind ?? 'procedimentos',
            'specialty_id' => $request->specialty_id ?? null,
        ]);

        // reload with specialty relation so frontend receives the embedded specialty object
        $categoryWithSpecialty = \App\Models\Category::with('specialty')->find($category->id);

        return response()->json([
            'message' => 'Category created successfully',
            'data' => $categoryWithSpecialty
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $id,
            'notes' => 'nullable|string',
            'kind' => 'nullable|string|in:procedimentos,diagnosticos',
            'specialty_id' => 'nullable|exists:specialties,id',
        ]);

        $category = \App\Models\Category::findOrFail($id);
        $category->name = $request->name;
        $category->notes = $request->notes ?? $category->notes;
        $category->kind = $request->kind ?? $category->kind;
        $category->specialty_id = $request->specialty_id ?? null;
        $category->save();

        $categoryWithSpecialty = \App\Models\Category::with('specialty')->find($category->id);

        return response()->json([
            'message' => 'Category updated successfully',
            'data' => $categoryWithSpecialty
        ]);
    }

    public function destroy($id)
    {
        $category = \App\Models\Category::findOrFail($id);
        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully'
        ]);
    }
}
