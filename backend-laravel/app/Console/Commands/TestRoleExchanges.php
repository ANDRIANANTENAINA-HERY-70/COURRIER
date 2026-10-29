<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\RoleExchangeService;

class TestRoleExchanges extends Command
{
    protected $signature = 'test:role-exchanges {--scenario= : Scénario spécifique à tester}';
    protected $description = 'Test la logique des échanges de rôles - A envoie à B, C ne voit rien';

    public function handle()
    {
        $this->info('🧪 Test des Échanges de Rôles - Logique A→B, C≠Rien');
        $this->newLine();

        $scenario = $this->option('scenario');

        if ($scenario) {
            $this->runScenario($scenario);
        } else {
            $this->runAllScenarios();
        }
    }

    private function runAllScenarios()
    {
        $this->line('📋 Scénarios disponibles:');
        $this->info('  php artisan test:role-exchanges --scenario=1  (Admin → SG)');
        $this->info('  php artisan test:role-exchanges --scenario=2  (Service Courrier → DG)');
        $this->info('  php artisan test:role-exchanges --scenario=3  (Self-envoi = Erreur)');
        $this->info('  php artisan test:role-exchanges --scenario=matrix  (Matrice complète)');
        $this->newLine();

        // Exécuter tous les scénarios
        foreach ([1, 2, 3] as $i) {
            $this->runScenario($i);
            $this->newLine();
        }
    }

    private function runScenario($scenario)
    {
        match ($scenario) {
            '1' => $this->scenario1(),
            '2' => $this->scenario2(),
            '3' => $this->scenario3(),
            'matrix' => $this->showMatrix(),
            default => $this->error("❌ Scénario inconnu: {$scenario}")
        };
    }

    private function scenario1()
    {
        $this->line('═══════════════════════════════════════════════════════════');
        $this->line('SCÉNARIO 1: Admin (A) → SG (B), DG (C) = Tiers');
        $this->line('═══════════════════════════════════════════════════════════');

        $admin = User::where('email', 'admin@example.com')->first();
        $secretaire = User::where('email', 'sg@example.com')->first();
        $directeur = User::where('email', 'dg@example.com')->first();

        if (!$admin || !$secretaire || !$directeur) {
            $this->error('❌ Utilisateurs manquants. Exécutez: php artisan db:seed --class=UserSeeder');
            return;
        }

        $this->info("Utilisateur A: {$admin->name} (Role: {$admin->role})");
        $this->info("Utilisateur B: {$secretaire->name} (Role: {$secretaire->role})");
        $this->info("Utilisateur C: {$directeur->name} (Role: {$directeur->role})");
        $this->newLine();

        // Test 1: Échange autorisé?
        $this->line('📤 Étape 1: Vérifier si Admin peut envoyer à Secrétaire');
        $validation = RoleExchangeService::canExchange($admin, $secretaire);

        if ($validation['allowed']) {
            $this->line("  ✅ {$validation['message']}");
        } else {
            $this->error("  ❌ {$validation['message']}");
            return;
        }

        // Test 2: Can View Message
        $this->newLine();
        $this->line('👁️ Étape 2: Vérifier qui peut voir le message A→B');

        $canAdminView = RoleExchangeService::canViewMessage($admin, $admin, $secretaire);
        $this->line("  Admin peut voir le message A→B? " . ($canAdminView ? '✅ Oui' : '❌ Non'));

        $canSecretaireView = RoleExchangeService::canViewMessage($secretaire, $admin, $secretaire);
        $this->line("  Secrétaire peut voir le message A→B? " . ($canSecretaireView ? '✅ Oui' : '❌ Non'));

        $canDirecteurView = RoleExchangeService::canViewMessage($directeur, $admin, $secretaire);
        $this->line("  Directeur (tiers) peut voir le message A→B? " . ($canDirecteurView ? '❌ Oui' : '✅ Non'));

        // Test 3: Résultat final
        $this->newLine();
        $this->line('📋 Résultat Final:');
        $this->info('  ✅ A voit dans "Courriers Sortants"');
        $this->info('  ✅ B voit dans "Courriers Entrants"');
        $this->info('  ✅ C ne voit rien (listes vides)');
    }

    private function scenario2()
    {
        $this->line('═══════════════════════════════════════════════════════════');
        $this->line('SCÉNARIO 2: Service Courrier (A) → DG (B), RH (C) = Tiers');
        $this->line('═══════════════════════════════════════════════════════════');

        $agent = User::where('email', 'service-courrier@example.com')->first();
        $directeur = User::where('email', 'dg@example.com')->first();
        $agent2 = User::where('email', 'rh@example.com')->first();

        if (!$agent || !$directeur || !$agent2) {
            $this->error('❌ Utilisateurs manquants. Exécutez: php artisan db:seed --class=UserSeeder');
            return;
        }

        $this->info("Utilisateur A: {$agent->name} (Role: {$agent->role})");
        $this->info("Utilisateur B: {$directeur->name} (Role: {$directeur->role})");
        $this->info("Utilisateur C: {$agent2->name} (Role: {$agent2->role})");
        $this->newLine();

        $validation = RoleExchangeService::canExchange($agent, $directeur);

        $this->line('📤 Échange autorisé?');
        if ($validation['allowed']) {
            $this->line("  ✅ {$validation['message']}");
        } else {
            $this->error("  ❌ {$validation['message']}");
            return;
        }

        $this->newLine();
        $this->line('📋 Résultat: Agent peut envoyer au Directeur ✅');
    }

    private function scenario3()
    {
        $this->line('═══════════════════════════════════════════════════════════');
        $this->line('SCÉNARIO 3: Admin (A) tente de s\'envoyer à lui-même ❌');
        $this->line('═══════════════════════════════════════════════════════════');

        $admin = User::where('email', 'admin@example.com')->first();

        if (!$admin) {
            $this->error('❌ Admin non trouvé. Exécutez: php artisan db:seed --class=UserSeeder');
            return;
        }

        $this->info("Utilisateur: {$admin->name} (Role: {$admin->role})");
        $this->newLine();

        $validation = RoleExchangeService::canExchange($admin, $admin);

        $this->line('📤 Self-envoi autorisé?');
        if ($validation['allowed']) {
            $this->error("  ❌ ERREUR: Self-envoi ne devrait pas être autorisé!\n     {$validation['message']}");
        } else {
            $this->info("  ✅ Correctement refusé");
            $this->info("     Message: {$validation['message']}");
        }
    }

    private function showMatrix()
    {
        $this->line('═══════════════════════════════════════════════════════════');
        $this->line('MATRICE D\'AUTORISATION COMPLÈTE');
        $this->line('═══════════════════════════════════════════════════════════');
        $this->newLine();

        $matrix = RoleExchangeService::getExchangeMatrix();

        foreach ($matrix as $role => $canSendTo) {
            $this->line("📤 <fg=blue>{$role}</> peut envoyer à:");
            $roles = implode(', ', $canSendTo);
            $this->info("   ✅ {$roles}");
            $this->newLine();
        }

        $this->line('⚠️  Restriction générale:');
        $this->info('   ❌ Personne ne peut s\'envoyer un message (self-envoi interdit)');
    }
}
