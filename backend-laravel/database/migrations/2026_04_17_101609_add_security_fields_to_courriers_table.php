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
            // Champs de sécurité pour le chiffrement
            $table->boolean('is_encrypted')->default(false)->after('fichier_path');
            $table->text('encryption_key')->nullable()->after('is_encrypted');

            // Champs de suivi et de sécurité
            $table->boolean('require_read_receipt')->default(false)->after('encryption_key');
            $table->timestamp('read_at')->nullable()->after('require_read_receipt');

            // Champs d'audit de sécurité
            $table->string('security_level')->default('normal')->after('read_at'); // normal, high, critical
            $table->text('security_metadata')->nullable()->after('security_level'); // JSON

            // Index pour les requêtes de sécurité
            $table->index(['is_encrypted', 'security_level']);
            $table->index(['receiver_id', 'read_at']);
            $table->index(['sender_id', 'security_level']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            $table->dropIndex(['is_encrypted', 'security_level']);
            $table->dropIndex(['receiver_id', 'read_at']);
            $table->dropIndex(['sender_id', 'security_level']);

            $table->dropColumn([
                'is_encrypted',
                'encryption_key',
                'require_read_receipt',
                'read_at',
                'security_level',
                'security_metadata'
            ]);
        });
    }
};
