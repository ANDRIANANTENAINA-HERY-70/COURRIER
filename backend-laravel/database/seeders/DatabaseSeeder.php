<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 Début du seeding...');

        $this->call([
            ServiceSeeder::class,
            UserSeeder::class,
            CourrierSeeder::class,
        ]);

        $this->command->info('🎉 Seeding terminé avec succès !');
    }
}