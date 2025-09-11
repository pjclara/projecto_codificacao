

<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;


Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

use App\Http\Controllers\UserController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
    // Para garantir que PUT/PATCH são aceites
    Route::match(['put', 'patch'], 'users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::resource('roles', RoleController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('permissions', PermissionController::class)->only(['index', 'store', 'update', 'destroy']);
});
