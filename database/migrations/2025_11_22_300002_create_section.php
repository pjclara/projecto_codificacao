<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // create categories table
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('kind')->default('procedimentos'); // 'procedimentos' or 'diagnosticos'
            $table->text('notes')->nullable();
            $table->timestamps();
        });
       
    }

    public function down()
    {
        Schema::dropIfExists('sections');
    }
};
