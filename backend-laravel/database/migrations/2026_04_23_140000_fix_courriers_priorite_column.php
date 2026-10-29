<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            // Modifier la colonne priorite pour accepter plus de valeurs
            $table->enum('priorite', ['basse', 'normale', 'urgente', 'haute'])->default('normale')->change();
        });
    }

    public function down(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            $table->enum('priorite', ['basse', 'normale', 'urgente'])->default('normale')->change();
        });
    }
};
