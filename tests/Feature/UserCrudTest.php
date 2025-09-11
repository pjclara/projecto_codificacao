<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserCrudTest extends TestCase
{
    use RefreshDatabase;


    public function test_user_can_be_created()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);
        $response = $this->post('/users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
        ]);
    }

    public function test_user_can_be_updated()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);
        $user = User::factory()->create();
        $response = $this->put("/users/{$user->id}", [
            'name' => 'Updated Name',
            'email' => $user->email,
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_user_can_be_deleted()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);
        $user = User::factory()->create();
        $response = $this->delete("/users/{$user->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', [
            'id' => $user->id,
        ]);
    }

    public function test_users_can_be_listed()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);
        User::factory()->count(3)->create();
        $response = $this->get('/users');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('users/Index')
                ->has('users', 4)
        );
    }
}
