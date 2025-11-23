<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FavoritoController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\IcdCodeCMSController;
use App\Http\Controllers\IcdCodePCSController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\DiagnosticoController;
use App\Http\Controllers\ProcedimentoController;
use App\Http\Controllers\UserRolePermissionController;

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';


Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/welcome-alt', function () {
    return Inertia::render('welcome-alt');
})->name('welcome.alt');

Route::apiResource('api/favoritos', FavoritoController::class);

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('users', UserController::class);
    Route::resource('roles', RoleController::class);
    Route::resource('permissions', PermissionController::class);

    Route::prefix('users/{user}')->group(function () {
        Route::post('assign-role', [UserRolePermissionController::class, 'assignRole']);
        Route::post('remove-role', [UserRolePermissionController::class, 'removeRole']);
        Route::post('give-permission', [UserRolePermissionController::class, 'givePermission']);
        Route::post('revoke-permission', [UserRolePermissionController::class, 'revokePermission']);
    });

    Route::prefix('cms')->group(function () {
        Route::get('/', function () {
            return Inertia::render('IcdCodeCMS/Index');
        })->name('cms.index');
    });

    Route::get('/categories', function () {
        return Inertia::render('categories/Index');
    })->name('categories.index');

    # sections
    Route::get('/sections', function () {
        return Inertia::render('sections/Index');
    })->name('sections.index');

    # favoritos
    Route::get('/favoritos', function () {
        return Inertia::render('favoritos/Index');
    })->name('favoritos.index');

    Route::get('/pcs', function () {
        return Inertia::render('IcdCodePCS/Index');
    })->name('pcs.index');

    Route::get('/procedimentos', function () {
        return Inertia::render('procedimentos/Index');
    })->name('procedimentos.index');

    Route::get('/diagnosticos', function () {
        return Inertia::render('diagnosticos/Index');
    })->name('diagnosticos.index');

    Route::prefix('api/icd10cms')->group(function () {
        Route::get('/', [IcdCodeCMSController::class, 'index']);
        Route::get('/search', [IcdCodeCMSController::class, 'search']);
        Route::get('/{id}', [IcdCodeCMSController::class, 'show']);
    });
    // Rotas para códigos PCS
    Route::prefix('api/icd10pcs')->group(function () {
        Route::get('/', [IcdCodePCSController::class, 'index']);
        Route::get('/search', [IcdCodePCSController::class, 'search']);
        Route::get('/{id}', [IcdCodePCSController::class, 'show']);
    });
});


Route::prefix('api')->middleware('auth')->group(function () {
    Route::apiResource('diagnosticos', DiagnosticoController::class);
    Route::apiResource('procedimentos', ProcedimentoController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('sections', SectionController::class);
    
    // Rotas para gerenciar usuários associados a favoritos
    Route::prefix('favoritos/{favorito}')->group(function () {
        Route::post('attach-user', [FavoritoController::class, 'attachUser']);
        Route::post('detach-user', [FavoritoController::class, 'detachUser']);
        Route::get('users', [FavoritoController::class, 'getUsers']);
    });
});

// rota para ver os procedimentos publicos
Route::get('/api/procedimentos-publicos', [ProcedimentoController::class, 'publicIndex'])->name('procedimentos.publicos');
// rota para ver os diagnosticos publicos
Route::get('/api/diagnosticos-publicos', [DiagnosticoController::class, 'publicIndex'])->name('diagnosticos.publicos');
