<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SpecialtySeeder extends Seeder
{
    public function run()
    {
        $specialties = [
            ['name' => 'Cardiologia', 'description' => 'Doenças do coração e sistema circulatório'],
            ['name' => 'Ortopedia', 'description' => 'Aparelho locomotor e ossos'],
            ['name' => 'Pediatria', 'description' => 'Cuidados de saúde para crianças'],
            ['name' => 'Dermatologia', 'description' => 'Pele, unhas e cabelos'],
            ['name' => 'Ginecologia', 'description' => 'Saúde feminina e reprodutiva'],
            ['name' => 'Psiquiatria', 'description' => 'Transtornos mentais e emocionais'],
            ['name' => 'Oftalmologia', 'description' => 'Olhos e visão'],
            ['name' => 'Gastroenterologia', 'description' => 'Sistema digestivo e seus distúrbios'],
            ['name' => 'Urologia', 'description' => 'Sistema urinário e órgãos genitais masculinos'],
            ['name' => 'Cirurgia Geral', 'description' => 'Procedimentos cirúrgicos em geral'],
        ];

        foreach ($specialties as $s) {
            DB::table('specialties')->updateOrInsert(['name' => $s['name']], $s + ['created_at' => now(), 'updated_at' => now()]);
        }
    }
}
