<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('courriers', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('type'); // entrant, sortant
            $table->string('expediteur');
            $table->string('destinataire');
            $table->string('objet');
            $table->text('contenu')->nullable();
            $table->enum('priorite', ['basse', 'normale', 'urgente'])->default('normale');
            $table->enum('statut', ['en_attente', 'traite', 'archive', 'en_cours'])->default('en_attente');
            $table->date('date_reception');
            $table->date('date_envoi')->nullable();
            $table->string('fichier_path')->nullable();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('service_id')->constrained();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('courriers');
    }
};