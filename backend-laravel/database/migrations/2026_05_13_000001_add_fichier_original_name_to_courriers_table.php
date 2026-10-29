<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('courriers', 'fichier_original_name')) {
            Schema::table('courriers', function (Blueprint $table) {
                $table->string('fichier_original_name')->nullable()->after('fichier_path');
            });

            DB::table('courriers')
                ->whereNotNull('fichier_path')
                ->orderBy('id')
                ->get(['id', 'fichier_path'])
                ->each(function ($courrier) {
                    $originalName = basename((string) $courrier->fichier_path);

                    DB::table('courriers')
                        ->where('id', $courrier->id)
                        ->update(['fichier_original_name' => $originalName]);
                });
        }
    }

    public function down(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            $table->dropColumn('fichier_original_name');
        });
    }
};
