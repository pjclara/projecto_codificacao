<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use Illuminate\Database\Seeder;
use App\Models\ProcedimentoClinico;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class ProcedimentoClinicoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $procedimento = ProcedimentoClinico::create([
            'nome' => 'Consulta de rotina',
            'created_by' => User::inRandomOrder()->first()->id,
            'is_public' => true,
            'category_id' => Category::where('kind', 'procedimentos')->inRandomOrder()->first()->id,
            'notes' => 'Consulta médica de rotina para avaliação geral da saúde do paciente.',
        ]);

        // Associar códigos ICD-10-PCS ao procedimento
        $codigos = \App\Models\IcdCodePCS::inRandomOrder()->take(2)->pluck('id');
        $procedimento->codigos()->attach($codigos);
    }
}
