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
        Schema::create('procedimentos_clinicos', function (Blueprint $table) {
            $table->id();
            $table->string('nome'); // Nome clínico do procedimento
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('category_id')->nullable()->constrained('categories')->onDelete('set null');
            $table->boolean('is_public')->default(false); // Indica se o procedimento é público
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('procedimento_codigos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('procedimento_id')->constrained('procedimentos_clinicos')->onDelete('cascade');
            $table->foreignId('codigo_id')->constrained('icd10pcs')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('procedimento_codigos');
        Schema::dropIfExists('procedimentos_clinicos');
    }
};
