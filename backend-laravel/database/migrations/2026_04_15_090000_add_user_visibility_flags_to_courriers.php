<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            if (!Schema::hasColumn('courriers', 'sender_archived_at')) {
                $table->timestamp('sender_archived_at')->nullable()->after('priorite');
            }
            if (!Schema::hasColumn('courriers', 'receiver_archived_at')) {
                $table->timestamp('receiver_archived_at')->nullable()->after('sender_archived_at');
            }
            if (!Schema::hasColumn('courriers', 'sender_deleted_at')) {
                $table->timestamp('sender_deleted_at')->nullable()->after('receiver_archived_at');
            }
            if (!Schema::hasColumn('courriers', 'receiver_deleted_at')) {
                $table->timestamp('receiver_deleted_at')->nullable()->after('sender_deleted_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('courriers', function (Blueprint $table) {
            $columns = array_filter([
                Schema::hasColumn('courriers', 'sender_archived_at') ? 'sender_archived_at' : null,
                Schema::hasColumn('courriers', 'receiver_archived_at') ? 'receiver_archived_at' : null,
                Schema::hasColumn('courriers', 'sender_deleted_at') ? 'sender_deleted_at' : null,
                Schema::hasColumn('courriers', 'receiver_deleted_at') ? 'receiver_deleted_at' : null,
            ]);

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
