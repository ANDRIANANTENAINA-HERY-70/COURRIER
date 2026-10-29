<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;
use Illuminate\Support\Facades\DB;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        // Désactiver les contraintes de clés étrangères
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        // Vider la table
        Service::truncate();
        
        // Réactiver les contraintes
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $services = [
            [
                'nom' => 'Direction',
                'description' => 'Direction générale',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'nom' => 'Comptabilité',
                'description' => 'Service comptable',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'nom' => 'Ressources Humaines',
                'description' => 'Gestion du personnel',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'nom' => 'Informatique',
                'description' => 'Support technique',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'nom' => 'Marketing',
                'description' => 'Communication et marketing',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'nom' => 'Commercial',
                'description' => 'Service commercial',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'nom' => 'Juridique',
                'description' => 'Service juridique',
                'created_at' => now(),
                'updated_at' => now()
            ],
        ];

        foreach ($services as $service) {
            Service::create($service);
        }

        $this->command->info('✅ Services créés avec succès !');
    }
}