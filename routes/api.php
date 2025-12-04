<?php

use App\Http\Controllers\CategoryController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\FavoritoController;
use App\Http\Controllers\HistoricoController;
use App\Http\Controllers\IcdCodeCMSController;
use App\Http\Controllers\IcdCodePCSController;
use App\Http\Controllers\DiagnosticoController;
use App\Http\Controllers\ProcedimentoController;
use App\Http\Controllers\AIController;
use App\Models\Category;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


// prefix diagnosticos



//proteger com auth
Route::get('/historico', [HistoricoController::class, 'index']);
Route::post('/historico', [HistoricoController::class, 'store']);

Route::apiResource('diagnosticos', DiagnosticoController::class);
Route::apiResource('procedimentos', ProcedimentoController::class);

// list procedimento categories (used by frontend to populate selects)
Route::apiResource('categories', CategoryController::class);
// specialties list for category creation
Route::get('/specialties', [\App\Http\Controllers\SpecialtyController::class, 'index']);

// AI Sugestões - Similaridade semântica com embeddings
Route::post('/ai/sugerir', [AIController::class, 'sugerir']);
