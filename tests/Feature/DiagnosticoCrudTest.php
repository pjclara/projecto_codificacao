<?php

use App\Models\User;
use App\Models\IcdCodeCMS;

test('can create a diagnostico with codigo and notes', function () {
    $user = User::factory()->create();

    // create an ICD code to reference
    $icd = IcdCodeCMS::create([
        'codigo' => 'A00',
        'descricao_longa' => 'Colera',
    ]);

    $payload = [
        'nome' => 'Teste Diagnóstico',
        'codigo_id' => $icd->id,
        'is_public' => true,
        'category_id' => null,
        'notes' => 'Observação de teste',
    ];

    $response = $this->actingAs($user)->postJson('/api/diagnosticos', $payload);

    $response->assertStatus(200);
    $response->assertJsonFragment(['message' => 'Diagnóstico criado com sucesso']);

    $this->assertDatabaseHas('diagnosticos_clinicos', [
        'nome' => 'Teste Diagnóstico',
        'codigo_id' => $icd->id,
        'is_public' => 1,
        'notes' => 'Observação de teste',
        'created_by' => $user->id,
    ]);
});

test('can update a diagnostico and change codigo and notes', function () {
    $user = User::factory()->create();

    $icd1 = IcdCodeCMS::create(['codigo' => 'A00', 'descricao_longa' => 'Colera']);
    $icd2 = IcdCodeCMS::create(['codigo' => 'B00', 'descricao_longa' => 'Outro']);

    // create diagnostico via API so created_by is set
    $create = $this->actingAs($user)->postJson('/api/diagnosticos', [
        'nome' => 'Origem Dx',
        'codigo_id' => $icd1->id,
        'is_public' => false,
        'category_id' => null,
    ]);

    $create->assertStatus(200);
    $data = $create->json('data');
    $this->assertNotNull($data['id']);

    $id = $data['id'];

    // update
    $update = $this->actingAs($user)->putJson("/api/diagnosticos/{$id}", [
        'codigo_id' => $icd2->id,
        'is_public' => true,
        'notes' => 'Atualizado via teste',
    ]);

    $update->assertStatus(200);
    $update->assertJsonFragment(['message' => 'Diagnóstico atualizado com sucesso']);

    $this->assertDatabaseHas('diagnosticos_clinicos', [
        'id' => $id,
        'codigo_id' => $icd2->id,
        'is_public' => 1,
        'notes' => 'Atualizado via teste',
        'created_by' => $user->id,
    ]);
});
