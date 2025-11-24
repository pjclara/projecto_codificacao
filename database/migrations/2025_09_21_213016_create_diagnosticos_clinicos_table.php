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
        Schema::create('diagnosticos_clinicos', function (Blueprint $table) {
            $table->id();
            $table->string('nome'); // Nome clínico do diagnóstico
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('codigo_id')->nullable()->constrained('icd10cms')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->boolean('is_public')->default(false); // Indica se o procedimento é público
            $table->text('notes')->nullable();
            $table->timestamps();
        });
        // pivot table removed: a DiagnosticoClinico agora referencia um único codigo via codigo_id
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('diagnosticos_clinicos');
    }
};
