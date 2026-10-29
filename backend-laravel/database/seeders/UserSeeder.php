<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Service;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Désactiver les contraintes de clés étrangères
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        // Vider la table
        User::truncate();
        
        // Réactiver les contraintes
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // Récupérer les services
        $services = Service::all();

        if ($services->isEmpty()) {
            $this->command->error('❌ Aucun service trouvé. Exécutez d\'abord ServiceSeeder');
            return;
        }

        $direction = $services->where('nom', 'Direction')->first();
        $rh = $services->where('nom', 'Ressources Humaines')->first();
        $compta = $services->where('nom', 'Comptabilité')->first();

        User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'service_id' => $direction->id ?? 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        User::create([
            'name' => 'Secrétaire',
            'email' => 'secretaire@example.com',
            'password' => Hash::make('password'),
            'role' => 'secretaire',
            'service_id' => $rh->id ?? 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        User::create([
            'name' => 'Directeur',
            'email' => 'directeur@example.com',
            'password' => Hash::make('password'),
            'role' => 'directeur',
            'service_id' => $direction->id ?? 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->command->info('✅ Utilisateurs créés avec succès !');
    }
}