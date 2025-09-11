<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Inertia\Inertia;

class PermissionController extends Controller
{
    public function index()
    {
        $permissions = Permission::all();
        return Inertia::render('permissions/Index', [
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|unique:permissions,name',
        ]);
        $permission = Permission::create(['name' => $data['name']]);
        return response(['permission' => $permission, 'message' => 'Permissão criada com sucesso!']);
    }

    public function update(Request $request, Permission $permission)
    {
        $data = $request->validate([
            'name' => 'required|string|unique:permissions,name,' . $permission->id,
        ]);
        $permission->update(['name' => $data['name']]);
        return response(['permission' => $permission, 'message' => 'Permissão atualizada com sucesso!']);
    }

    public function destroy(Permission $permission)
    {
        $permission->delete();
        return response(['message' => 'Permissão removida com sucesso!']);
    }
}
