<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Soft deletes + indexation pour recherche rapide expéditeur/destinataire
        Schema::table('courriers', function (Blueprint $table) {
            if (!Schema::hasColumn('courriers', 'deleted_at')) {
                $table->softDeletes();
            }
            $table->index('expediteur');
            $table->index('destinataire');
            $table->index('created_at');
        });

        // Table dédiée aux pièces jointes
        if (!Schema::hasTable('courrier_attachments')) {
            Schema::create('courrier_attachments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('courrier_id')
                    ->constrained('courriers')
                    ->onDelete('cascade');
                $table->string('original_name');
                $table->string('path');
                $table->string('mime_type')->nullable();
                $table->unsignedBigInteger('size')->nullable(); // en octets
                $table->timestamps();

                $table->index('courrier_id');
                $table->index('created_at');
            });
        }
    }

    public function down(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            // Les dropIndex nécessitent le nom exact : Laravel 8+ génère {table}_{column}_index
            $table->dropSoftDeletes();
            $table->dropIndex('courriers_expediteur_index');
            $table->dropIndex('courriers_destinataire_index');
            $table->dropIndex('courriers_created_at_index');
        });

        Schema::dropIfExists('courrier_attachments');
    }
};
