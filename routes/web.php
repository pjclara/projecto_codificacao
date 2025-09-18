<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\UserRolePermissionController;
use App\Http\Controllers\UserController;

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';


Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

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
});
