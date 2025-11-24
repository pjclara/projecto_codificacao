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
        Schema::create('procedimento_specialty', function (Blueprint $table) {
            $table->id();
            $table->foreignId('procedimento_clinico_id')->constrained('procedimentos_clinicos')->onDelete('cascade');
            $table->foreignId('specialty_id')->constrained('specialties')->onDelete('cascade');
            $table->timestamps();
            $table->unique(['procedimento_clinico_id', 'specialty_id'], 'proc_specialty_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('procedimento_specialty');
    }
};
