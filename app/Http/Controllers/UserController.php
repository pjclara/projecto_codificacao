<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('roles', 'permissions')->get();
        $roles = \Spatie\Permission\Models\Role::all();
        $permissions = \Spatie\Permission\Models\Permission::all();
        return Inertia::render('users/Index', [
            'users' => $users,
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(UserStoreRequest $request)
    {
        $user = User::create($request->validated());
        return response([
            'user' => $user,
            'message' => 'Utilizador criado com sucesso!'
        ]);
    }

    // show()
    public function show(User $user)
    {
        return response([
            'user' => $user->load('roles', 'permissions'),
        ]);
    }

    public function update(UserUpdateRequest $request, User $user)
    {
        $user->update($request->validated());
        return response([
            'user' => $user,
            'message' => 'Utilizador atualizado com sucesso!'
        ]);
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response([
            'users' => User::all(),
            'message' => 'Utilizador removido com sucesso!'
        ]);
    }
}
