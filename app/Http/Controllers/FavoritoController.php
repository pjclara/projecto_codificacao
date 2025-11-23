<?php

namespace App\Http\Controllers;

use App\Models\Favorito;
use App\Http\Requests\StoreFavoritoRequest;
use App\Http\Requests\UpdateFavoritoRequest;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FavoritoController extends Controller
{
    public function index(Request $request)
    {
        $query = Favorito::with(['category.specialty', 'users'])
            ->orderBy('codigo_id');

        // Filtro por origem
        if ($request->filled('origem')) {
            $query->where('tabela_origem', $request->origem);
        }

        // Busca textual
        if ($request->filled('search')) {
            $searchTerms = array_filter(explode(' ', trim($request->search)));

            $query->where(function ($q) use ($searchTerms) {
                foreach ($searchTerms as $term) {
                    $q->where(function ($subQ) use ($term) {

                        // ICD10CMS
                        $subQ->whereIn('codigo_id', function ($sub) use ($term) {
                            $sub->select('id')
                                ->from('icd10cms')
                                ->where(function ($w) use ($term) {
                                    $w->where('codigo', 'like', "%{$term}%")
                                        ->orWhere('descricao_longa', 'like', "%{$term}%");
                                });
                        })

                            // ICD10PCS
                            ->orWhereIn('codigo_id', function ($sub) use ($term) {
                                $sub->select('id')
                                    ->from('icd10pcs')
                                    ->where(function ($w) use ($term) {
                                        $w->where('codigo', 'like', "%{$term}%")
                                            ->orWhere('descricao_longa', 'like', "%{$term}%")
                                            ->orWhere('descricao_linguagem_corrente', 'like', "%{$term}%");
                                    });
                            });
                    });
                }
            });
        }

        if ($request->per_page) {
            // Paginação
            $favoritos = $query->paginate($request->per_page ?? 15);

            // Calcula as estatísticas (com a mesma query base)
            $stats = [
                'total'          => $query->count(),
                'diagnosticos'   => (clone $query)->where('tabela_origem', 'icd10cms')->count(),
                'procedimentos'  => (clone $query)->where('tabela_origem', 'icd10pcs')->count(),
                'pessoais'       => (clone $query)->where('personal', true)->count(),
            ];

            // Transformação final dos dados
            $favoritos->getCollection()->transform(function ($fav) {
                $table = $fav->tabela_origem;
                $codigo = DB::table($table)->find($fav->codigo_id);

                return [
                    'id'            => $fav->id,
                    'codigo_id'     => $fav->codigo_id,
                    'tabela_origem' => $fav->tabela_origem,
                    'category_id'   => $fav->category_id,
                    'specialty_id'  => $fav->specialty_id,
                    'section_id'    => $fav->section_id,
                    'personal'      => $fav->personal,

                    'codigo'        => $codigo->codigo ?? null,
                    'descricao'     => $codigo->descricao_longa ?? ($codigo->descricao ?? null),
                    'section'       => $codigo->section ?? null,

                    'category'      => $fav->category,
                    'specialty'     => $fav->specialty_id
                        ? $fav->specialty
                        : optional($fav->category)->specialty,
                    'users'         => $fav->users->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email])->all(),
                ];
            });

            return response()->json([
                'data'  => $favoritos,
                'stats' => $stats,
            ]);
        } else {
            // Sem paginação
            $favoritos = $query->get();
            // Transformação final dos dados
            $favoritos->transform(function ($fav) {
                $table = $fav->tabela_origem;
                $codigo = DB::table($table)->find($fav->codigo_id);
                return [
                    'id'            => $fav->id,
                    'codigo_id'     => $fav->codigo_id,
                    'tabela_origem' => $fav->tabela_origem,
                    'category_id'   => $fav->category_id,
                    'specialty_id'  => $fav->specialty_id,
                    'section_id'    => $fav->section_id,
                    'personal'      => $fav->personal,

                    'codigo'        => $codigo->codigo ?? null,
                    'descricao'     => $codigo->descricao_linguagem_corrente ?? $codigo->descricao_longa ?? ($codigo->descricao ?? null),
                    'section'       => $fav->section->name ?? null,

                    'category'      => $fav->category,
                    'specialty'     => $fav->section->specialty?->name ?? null,
                    'users'         => $fav->users->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email])->all(),
                ];
            });
            return response()->json($favoritos);
        }
    }





    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'tabela_origem' => 'required|in:icd10cms,icd10pcs',
            'codigo_id' => 'required|integer',
        ]);
        return Favorito::create([
            'tabela_origem' => $request->tabela_origem, // "icd10cm" ou "icd10pcs"
            'codigo_id' => $request->codigo_id,
        ]);
    }

    public function getFavoritos()
    {
        $favoritos = Favorito::all()->map(function ($fav) {
            if ($fav->tabela_origem === 'icd10cm') {
                $codigo = DB::table('icd10cm')->find($fav->codigo_id);
            } else {
                $codigo = DB::table('icd10pcs')->find($fav->codigo_id);
            }
            return [
                'id' => $fav->id,
                'codigo' => $codigo->codigo,
                'descricao' => $codigo->descricao,
                'origem' => $fav->tabela_origem,
            ];
        });

        return response()->json($favoritos);
    }


    /**
     * Display the specified resource.
     */
    public function show(Favorito $favorito)
    {
        $fav = $favorito->load(['users', 'category.specialty', 'section']);
        $table = $fav->tabela_origem;
        $codigo = DB::table($table)->find($fav->codigo_id);

        return response()->json([
            'id'            => $fav->id,
            'codigo_id'     => $fav->codigo_id,
            'tabela_origem' => $fav->tabela_origem,
            'category_id'   => $fav->category_id,
            'specialty_id'  => $fav->specialty_id,
            'section_id'    => $fav->section_id,
            'personal'      => $fav->personal,

            'codigo'        => $codigo->codigo ?? null,
            'descricao'     => $codigo->descricao_linguagem_corrente ?? $codigo->descricao_longa ?? ($codigo->descricao ?? null),
            'section'       => $fav->section->name ?? null,

            'category'      => $fav->category,
            'specialty'     => $fav->section->specialty?->name ?? null,
            'users'         => $fav->users->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email])->all(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Favorito $favorito)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Favorito $favorito)
    {
        $request->validate([
            'category_id' => 'nullable|integer|exists:categories,id',
            'specialty_id' => 'nullable|integer|exists:specialties,id',
            'section_id' => 'nullable|integer',
            'personal' => 'nullable|boolean',
        ]);

        $favorito->update($request->only([
            'category_id',
            'specialty_id',
            'section_id',
            'personal',
        ]));

        return response()->json($favorito->load('category.specialty'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Favorito $favorito)
    {
        $favorito->delete();
        return response()->json(['message' => 'Favorito deleted successfully']);
    }

    /**
     * Attach a user to a favorito
     */
    public function attachUser(Request $request, Favorito $favorito)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        // Check if user is already associated
        if ($favorito->users()->where('user_id', $request->user_id)->exists()) {
            return response()->json(['message' => 'User already associated'], 400);
        }

        $favorito->users()->attach($request->user_id);

        return response()->json(['message' => 'User attached to favorito']);
    }

    /**
     * Detach a user from a favorito
     */
    public function detachUser(Request $request, Favorito $favorito)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $favorito->users()->detach($request->user_id);

        return response()->json(['message' => 'User detached from favorito']);
    }

    /**
     * Get users associated with a favorito
     */
    public function getUsers(Favorito $favorito)
    {
        return response()->json($favorito->users()->get());
    }
}
