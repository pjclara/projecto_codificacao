<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserRolePermissionController extends Controller
{
    public function assignRole(Request $request, User $user)
    {
        $data = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);
        $role = Role::findOrFail($data['role_id']);
        $user->assignRole($role);
        return response(['message' => 'Role atribuída ao utilizador com sucesso!']);
    }

    public function removeRole(Request $request, User $user)
    {
        $data = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);
        $role = Role::findOrFail($data['role_id']);
        $user->removeRole($role);
        return response(['message' => 'Role removida do utilizador com sucesso!']);
    }

    public function givePermission(Request $request, User $user)
    {
        $data = $request->validate([
            'permission_id' => 'required|exists:permissions,id',
        ]);
        $permission = Permission::findOrFail($data['permission_id']);
        $user->givePermissionTo($permission);
        return response(['message' => 'Permissão atribuída ao utilizador com sucesso!']);
    }

    public function revokePermission(Request $request, User $user)
    {
        $data = $request->validate([
            'permission_id' => 'required|exists:permissions,id',
        ]);
        $permission = Permission::findOrFail($data['permission_id']);
        $user->revokePermissionTo($permission);
        return response(['message' => 'Permissão removida do utilizador com sucesso!']);
    }
}
