<?php

namespace App\Http\Controllers;

use App\Models\IcdCodeCMS;
use Illuminate\Http\Request;

class IcdCodeCMSController extends Controller
{
    // Listagem com paginação
    public function index()
    {
        return IcdCodeCMS::where('valido',1)->paginate(20);
    }

    // Pesquisa por termo
    public function search(Request $request)
    {
        $q = trim((string) $request->get('q', ''));

        $query = IcdCodeCMS::query();

        if ($q !== '') {
            $termos = explode(' ', $q);

            foreach ($termos as $termo) {
                $query->where(function ($q) use ($termo) {
                    $q->where('codigo', 'like', "%{$termo}%")
                        ->orWhere('descricao_longa', 'like', "%{$termo}%")
                        ->orWhere('descricao_curta', 'like', "%{$termo}%");

                });
            }
        }

        return response()->json($query->paginate(20)); // limite para não travar
    }


    // Detalhe por ID ou código
    public function show($id)
    {
        return response()->json(IcdCodeCMS::findOrFail($id));
    }
}
