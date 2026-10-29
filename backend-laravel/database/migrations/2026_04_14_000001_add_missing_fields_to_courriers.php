<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            // Add missing fields with defaults for existing records
            if (!Schema::hasColumn('courriers', 'type')) {
                $table->enum('type', ['entrant', 'sortant'])->default('sortant')->after('receiver_id');
            }
            if (!Schema::hasColumn('courriers', 'statut')) {
                $table->enum('statut', ['en_attente', 'traite', 'archive', 'en_cours'])->default('en_attente')->after('type');
            }
            if (!Schema::hasColumn('courriers', 'priorite')) {
                $table->enum('priorite', ['basse', 'normale', 'urgente'])->default('normale')->after('statut');
            }
        });
    }

    public function down(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            $table->dropColumn(['type', 'statut', 'priorite']);
        });
    }
};
