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
        Schema::table('diagnosticos_clinicos', function (Blueprint $table) {
            $table->foreignId('specialty_id')->nullable()->after('category_id')->constrained('specialties')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('diagnosticos_clinicos', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Specialty::class, 'specialty_id');
        });
    }
};
