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
        Schema::table('courriers', function (Blueprint $table) {
            // Ajouter une colonne JSON pour stocker plusieurs fichiers
            if (!Schema::hasColumn('courriers', 'fichiers_paths')) {
                $table->json('fichiers_paths')->nullable()->after('fichier_path');
            }
        });

        // Migrer les données existantes vers le nouveau format JSON
        if (Schema::hasColumn('courriers', 'fichier_path')) {
            \DB::table('courriers')
                ->whereNotNull('fichier_path')
                ->get(['id', 'fichier_path'])
                ->each(function ($courrier) {
                    \DB::table('courriers')
                        ->where('id', $courrier->id)
                        ->update([
                            'fichiers_paths' => json_encode([$courrier->fichier_path])
                        ]);
                });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            if (Schema::hasColumn('courriers', 'fichiers_paths')) {
                $table->dropColumn('fichiers_paths');
            }
        });
    }
};
