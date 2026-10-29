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
        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('language')->default('fr');
            $table->boolean('notifications')->default(true);
            $table->boolean('email_notifications')->default(false);
            $table->string('theme')->default('light');
            $table->boolean('auto_save')->default(true);
            $table->integer('session_timeout')->default(30); // en minutes
            $table->boolean('two_factor_enabled')->default(false);
            $table->string('timezone')->default('Indian/Antananarivo');
            $table->string('date_format')->default('DD/MM/YYYY');
            $table->string('time_format')->default('HH:mm');
            $table->integer('items_per_page')->default(10);
            $table->boolean('sound_notifications')->default(true);
            $table->boolean('desktop_notifications')->default(false);
            $table->json('custom_settings')->nullable(); // pour paramètres additionnels
            $table->timestamps();
            
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_settings');
    }
};
