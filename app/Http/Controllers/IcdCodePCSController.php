<?php

namespace App\Http\Controllers;

use App\Models\IcdCodePCS;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IcdCodePCSController extends Controller
{
    public function index(Request $request)
    {
        return IcdCodePCS::paginate(20);
    }

    // Pesquisa por termo
    public function search(Request $request)
    {
        // normalize query string: trim and split on any whitespace, ignore empty tokens
        $q = trim((string) $request->get('q', ''));

        $query = IcdCodePCS::query();

        if ($q === '') {
            return $query->paginate(20);
        }

        $termos = preg_split('/\s+/', $q);
        $termos = array_filter($termos, fn ($t) => $t !== '');

        foreach ($termos as $termo) {
            $termo = (string) $termo;
            $query->where(function ($q2) use ($termo) {
                $q2->where('codigo', 'like', "%{$termo}%")
                    ->orWhere('descricao_longa', 'like', "%{$termo}%");
            });
        }

        return $query->paginate(20);
    }

    // Detalhe por ID ou código
    public function show($id)
    {
        return IcdCodePCS::findOrFail($id);
    }
}
