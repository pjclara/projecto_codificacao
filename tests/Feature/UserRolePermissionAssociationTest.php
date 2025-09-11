<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class UserRolePermissionAssociationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_assign_and_remove_roles_and_permissions_to_user()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);
        $user = User::factory()->create();
        $role = Role::create(['name' => 'manager']);
        $permission = Permission::create(['name' => 'edit articles']);

        // Assign role
        $response = $this->post("/users/{$user->id}/assign-role", ['role_id' => $role->id]);
        $response->assertStatus(200);
        $this->assertTrue($user->fresh()->hasRole('manager'));

        // Remove role
        $response = $this->post("/users/{$user->id}/remove-role", ['role_id' => $role->id]);
        $response->assertStatus(200);
        $this->assertFalse($user->fresh()->hasRole('manager'));

        // Give permission
        $response = $this->post("/users/{$user->id}/give-permission", ['permission_id' => $permission->id]);
        $response->assertStatus(200);
        $this->assertTrue($user->fresh()->hasPermissionTo('edit articles'));

        // Revoke permission
        $response = $this->post("/users/{$user->id}/revoke-permission", ['permission_id' => $permission->id]);
        $response->assertStatus(200);
        $this->assertFalse($user->fresh()->hasPermissionTo('edit articles'));
    }
}
