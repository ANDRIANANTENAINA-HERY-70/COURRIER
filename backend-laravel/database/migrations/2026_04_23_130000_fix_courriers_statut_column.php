<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            // Modifier la colonne statut pour accepter plus de valeurs
            $table->enum('statut', ['en_attente', 'traite', 'archive', 'en_cours', 'non_lu', 'lu'])->default('en_attente')->change();
        });
    }

    public function down(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            $table->enum('statut', ['en_attente', 'traite', 'archive', 'en_cours'])->default('en_attente')->change();
        });
    }
};
