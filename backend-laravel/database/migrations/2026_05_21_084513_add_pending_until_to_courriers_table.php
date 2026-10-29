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
        if (!Schema::hasColumn('courriers', 'pending_until')) {
            Schema::table('courriers', function (Blueprint $table) {
                $table->timestamp('pending_until')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('courriers', 'pending_until')) {
            Schema::table('courriers', function (Blueprint $table) {
                $table->dropColumn('pending_until');
            });
        }
    }
};
