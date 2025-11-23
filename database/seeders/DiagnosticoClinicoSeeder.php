<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\DiagnosticoClinico;
use App\Models\IcdCodeCMS;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DiagnosticoClinicoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DiagnosticoClinico::create([
            'nome' => 'Hipertensão Essencial (Primária)',
            'codigo_id' => IcdCodeCMS::inRandomOrder()->first()->id,
            'category_id' => Category::where('kind', 'diagnosticos')->inRandomOrder()->first()->id,
            'created_by' => User::inRandomOrder()->first()->id,
            'is_public' => true,
            'notes' => 'Diagnóstico comum relacionado à pressão arterial elevada sem causa identificável.',
        ]);

        DiagnosticoClinico::create([
            'nome' => 'Diabetes Mellitus Tipo 2',
            'codigo_id' => IcdCodeCMS::inRandomOrder()->first()->id,
            'category_id' => Category::where('kind', 'diagnosticos')->inRandomOrder()->first()->id,
            'created_by' => User::inRandomOrder()->first()->id,
            'is_public' => true,
            'notes' => 'Condição crônica que afeta a forma como o corpo processa o açúcar no sangue.',
        ]);
    }
}
