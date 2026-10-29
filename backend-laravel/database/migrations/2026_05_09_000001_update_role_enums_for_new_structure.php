<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $roleEnum = "'admin','dg','sg','service_courrier','rh','drh','compta','technique','circuit','autre','directeur','secretaire','agent','agent_rh'";

        DB::statement("ALTER TABLE users MODIFY role ENUM($roleEnum) NOT NULL DEFAULT 'sg'");
        DB::statement("ALTER TABLE user_requests MODIFY role ENUM($roleEnum) NOT NULL DEFAULT 'service_courrier'");
    }

    public function down(): void
    {
        $legacyEnum = "'admin','secretaire','directeur','agent','compta','rh'";

        DB::statement("ALTER TABLE users MODIFY role ENUM($legacyEnum) NOT NULL DEFAULT 'secretaire'");
        DB::statement("ALTER TABLE user_requests MODIFY role ENUM($legacyEnum) NOT NULL DEFAULT 'agent'");
    }
};
