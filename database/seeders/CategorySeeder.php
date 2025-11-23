<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        DB::table('categories')->insert([
        // diagnósticos
            ['name' => 'Cardiologia', 'kind' => 'diagnosticos', 'notes' => 'Diagnósticos relacionados ao coração e sistema circulatório.'],
            ['name' => 'Neurologia', 'kind' => 'diagnosticos', 'notes' => 'Diagnósticos relacionados ao sistema nervoso.'],
            ['name' => 'Ortopedia', 'kind' => 'diagnosticos', 'notes' => 'Diagnósticos relacionados ao sistema musculoesquelético.'],
            ['name' => 'Pediatria', 'kind' => 'diagnosticos', 'notes' => 'Diagnósticos relacionados à saúde infantil.'],
            ['name' => 'Ginecologia', 'kind' => 'diagnosticos', 'notes' => 'Diagnósticos relacionados ao sistema reprodutor feminino.'],
            ['name' => 'Dermatologia', 'kind' => 'diagnosticos', 'notes' => 'Diagnósticos relacionados à pele.'],
            ['name' => 'Psiquiatria', 'kind' => 'diagnosticos', 'notes' => 'Diagnósticos relacionados à saúde mental.'],
            ['name' => 'Oncologia', 'kind' => 'diagnosticos', 'notes' => 'Diagnósticos relacionados ao câncer.'],
            ['name' => 'Infectologia', 'kind' => 'diagnosticos', 'notes' => 'Diagnósticos relacionados a doenças infecciosas.'],
            ['name' => 'Endocrinologia', 'kind' => 'diagnosticos', 'notes' => 'Diagnósticos relacionados ao sistema endócrino e hormônios.'],
            // procedimentos por areas anatomicas
            ['name' => 'Tiroide', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados à tireoide.'],
            ['name' => 'Cabeça e Pescoço', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados à cabeça e pescoço.'],
            ['name' => 'Coluna Vertebral', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados à coluna vertebral.'],
            ['name' => 'Tórax', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados ao tórax.'],
            ['name' => 'Abdômen', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados ao abdômen.'],
            ['name' => 'Pelve', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados à pelve.'],
            ['name' => 'Membros Superiores', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados aos membros superiores.'],
            ['name' => 'Membros Inferiores', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados aos membros inferiores.'],
            ['name' => 'Sistema Nervoso Central', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados ao sistema nervoso central.'],
            ['name' => 'Sistema Cardiovascular', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados ao sistema cardiovascular.'],
            ['name' => 'Sistema Respiratório', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados ao sistema respiratório.'],
            ['name' => 'Sistema Digestivo', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados ao sistema digestivo.'],
            ['name' => 'Sistema Geniturinário', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados ao sistema geniturinário.'],
            ['name' => 'Pele e Tecidos Moles', 'kind' => 'procedimentos', 'notes' => 'Procedimentos relacionados à pele e tecidos moles.'],
            ['name' => 'Obstetrícia e Ginecologia',  'kind' =>  'procedimentos',  'notes'  =>  'Procedimentos relacionados à obstetrícia e ginecologia.'],
            ['name' =>  'Pediatria e Neonatologia',  'kind' =>  'procedimentos',  'notes'  =>  'Procedimentos relacionados à pediatria e neonatologia.'],

        ]);
    }
}
