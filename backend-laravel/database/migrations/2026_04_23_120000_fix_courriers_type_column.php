<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            // Modifier la colonne type pour accepter plus de valeurs
            $table->enum('type', ['entrant', 'sortant', 'message', 'password_reset_request'])->default('message')->change();
        });
    }

    public function down(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            $table->enum('type', ['entrant', 'sortant'])->default('sortant')->change();
        });
    }
};
