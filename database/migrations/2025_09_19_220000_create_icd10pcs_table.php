<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('icd10pcs', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();
            $table->text('descricao_longa')->nullable();
            $table->text('descricao_curta')->nullable();
            $table->string('secoes')->nullable();
            $table->string('capitulos')->nullable();
            $table->string('grupos')->nullable();
            $table->string('categorias')->nullable();
            $table->string('subcategorias')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('icd10pcs');
    }
};
