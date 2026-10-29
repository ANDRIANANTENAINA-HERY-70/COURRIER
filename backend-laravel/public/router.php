<?php

// Simple router pour tester l'API
if ($_SERVER['REQUEST_URI'] === '/api/test') {
    header('Content-Type: application/json');
    echo json_encode(['message' => 'API fonctionne', 'status' => 'ok']);
    exit;
}

if (strpos($_SERVER['REQUEST_URI'], '/api/statistiques') === 0) {
    // Simuler l'authentification pour les tests
    $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer test-token';

    // Charger Laravel pour les vraies requêtes
    require_once __DIR__ . '/index.php';
    exit;
}

// Pour toutes les autres requêtes, utiliser Laravel
require_once __DIR__ . '/index.php';
