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
        // Change fichiers_paths from longtext to json
        Schema::table('courriers', function (Blueprint $table) {
            // For MySQL 5.7.8+, json type is supported
            // Since the data is already stored as JSON string, we just need proper accessor/mutator
            // The casting in the Model will handle the conversion
        });

        // Note: MySQL treats JSON as longtext internally, 
        // so the Laravel 'json' cast will handle encoding/decoding automatically
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No changes needed for rollback
    }
};
