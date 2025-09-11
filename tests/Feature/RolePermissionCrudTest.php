<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Tests\TestCase;

class RolePermissionCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_can_be_created_with_permissions()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);
        $permission = Permission::create(['name' => 'edit posts']);
        $response = $this->post('/roles', [
            'name' => 'editor',
            'permissions' => [$permission->id],
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('roles', ['name' => 'editor']);
        $this->assertTrue(Role::where('name', 'editor')->first()->hasPermissionTo('edit posts'));
    }

    public function test_role_can_be_updated_with_permissions()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);
        $role = Role::create(['name' => 'writer']);
        $permission = Permission::create(['name' => 'publish posts']);
        $response = $this->put("/roles/{$role->id}", [
            'name' => 'writer',
            'permissions' => [$permission->id],
        ]);
        $response->assertStatus(200);
        $this->assertTrue($role->fresh()->hasPermissionTo('publish posts'));
    }

    public function test_role_can_be_deleted()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);
        $role = Role::create(['name' => 'to-delete']);
        $response = $this->delete("/roles/{$role->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }

    public function test_permission_can_be_created()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);
        $response = $this->post('/permissions', [
            'name' => 'delete users',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('permissions', ['name' => 'delete users']);
    }

    public function test_permission_can_be_updated()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);
        $permission = Permission::create(['name' => 'old name']);
        $response = $this->put("/permissions/{$permission->id}", [
            'name' => 'new name',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('permissions', ['name' => 'new name']);
    }

    public function test_permission_can_be_deleted()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);
        $permission = Permission::create(['name' => 'to-delete']);
        $response = $this->delete("/permissions/{$permission->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('permissions', ['id' => $permission->id]);
    }
}
