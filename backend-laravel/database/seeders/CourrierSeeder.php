<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Courrier;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CourrierSeeder extends Seeder
{
    public function run(): void
    {
        Courrier::truncate();

        $alice = User::where('email', 'admin@example.com')->first();
        $bob   = User::where('email', 'secretaire@example.com')->first();
        $carol = User::where('email', 'directeur@example.com')->first();

        if (!$alice || !$bob || !$carol) {
            $this->command->error('❌ Utilisateurs de base manquants (admin/secretaire/directeur)');
            return;
        }

        Courrier::create([
            'objet' => 'Test',
            'message' => 'Bonjour Bob',
            'sender_id' => $alice->id,
            'receiver_id' => $bob->id,
        ]);

        Courrier::create([
            'objet' => 'Réponse',
            'message' => 'Salut Alice, bien reçu !',
            'sender_id' => $bob->id,
            'receiver_id' => $alice->id,
        ]);

        Courrier::create([
            'objet' => 'Info',
            'message' => 'Hello Carol, voici la doc.',
            'sender_id' => $bob->id,
            'receiver_id' => $carol->id,
        ]);

        $this->command->info('✅ Courriers sécurisés (user_id) créés avec succès');
    }
}
