<?php

use App\Models\Specialty;
use App\Models\Category;
use App\Models\ProcedimentoClinico;

test('public procedimentos include category.specialty', function () {
    // create specialty and category
    $specialty = Specialty::create(['name' => 'Cardiologia']);

    $category = Category::create([
        'name' => 'Cat Procedimentos Teste',
        'kind' => 'procedimentos',
        'specialty_id' => $specialty->id,
    ]);

    // create procedimento directly (skip controller validation) and mark public
    $proc = ProcedimentoClinico::create([
        'nome' => 'Proc Teste Publico',
        'is_public' => true,
        'category_id' => $category->id,
    ]);

    $response = $this->getJson('/api/procedimentos-publicos');

    $response->assertStatus(200);

    $data = $response->json();

    // ensure we can find our procedimento and that category.specialty is present
    $found = collect($data)->firstWhere('nome', 'Proc Teste Publico');

    expect($found)->not->toBeNull();
    expect($found['category'])->toBeArray();
    expect($found['category']['specialty'])->toBeArray();
    expect($found['category']['specialty']['id'])->toBe($specialty->id);
});
