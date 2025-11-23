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
        Schema::create('favoritos', function (Blueprint $table) {
            $table->id();
            $table->string('tabela_origem'); // "icd10cm" ou "icd10pcs"
            $table->unsignedBigInteger('category_id');
            $table->unsignedBigInteger('section_id');
            $table->unsignedBigInteger('codigo_id');
            $table->string('specialty_id')->nullable();
            $table->boolean('personal')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('favoritos');
    }
};
