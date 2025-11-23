<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate([
            'email' => 'admin@admin.com'],
            [
                'name' => 'Admin',
                'password' => bcrypt('admin123'),
            ]);

        
        User::firstOrCreate([
            'email' => 'pjclara@gmail.com'],
            [
                'name' => 'Pedro Clara',
                'password' => bcrypt('password123'),
            ]);

        $this->call([
            //CategorySeeder::class,
            //DiagnosticoClinicoSeeder::class,
            //ProcedimentoClinicoSeeder::class,
            \Database\Seeders\SpecialtySeeder::class,
        ]);
    }
}
