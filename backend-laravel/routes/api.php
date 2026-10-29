<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourrierController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserRequestController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\PublicCourrierController;
use App\Http\Controllers\UserListController;
use App\Http\Controllers\UserSettingController;
use App\Http\Controllers\StatistiquesController;

// Route de test
Route::get('/test', function () {
    return response()->json(['message' => 'API fonctionne', 'status' => 'ok']);
});

// Routes publiques
Route::post('/register', [AuthController::class, 'register']);
Route::post('/signup', [AuthController::class, 'signup']); // inscription directe
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register-request', [UserRequestController::class, 'store']);
Route::get('/check-name', [AuthController::class, 'checkNameAvailability']);

// Réinitialisation de mot de passe (publiques)
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/verify-reset-code', [AuthController::class, 'verifyResetCode']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/user/avatar', [AuthController::class, 'uploadAvatar']);
    Route::delete('/user/avatar', [AuthController::class, 'deleteAvatar']);
    Route::get('/user/settings', [UserSettingController::class, 'show']);
    Route::put('/user/settings', [UserSettingController::class, 'update']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Courriers sécurisés (user_id)
    Route::post('/courriers', [PublicCourrierController::class, 'store']);
    Route::get('/courriers/inbox', [PublicCourrierController::class, 'inbox']);
    Route::get('/courriers/sent', [PublicCourrierController::class, 'sent']);
    Route::get('/courriers/archives', [PublicCourrierController::class, 'archives']);
    Route::post('/courriers/{courrier}/archive', [PublicCourrierController::class, 'archive']);
    Route::post('/courriers/{courrier}/mark-as-read', [PublicCourrierController::class, 'markAsRead']);
    Route::post('/courriers/{courrier}/mark-as-unread', [PublicCourrierController::class, 'markAsUnread']);
    Route::post('/courriers/{courrier}/set-pending', [PublicCourrierController::class, 'setPending']);
    Route::post('/courriers/{courrier}/remove-pending', [PublicCourrierController::class, 'removePending']);
    Route::delete('/courriers/{courrier}', [PublicCourrierController::class, 'destroy']);
    Route::get('/inbox/{email}', [PublicCourrierController::class, 'inboxByEmail']); // compat email-based, sécurisé

    // Statistiques
    Route::get('/statistiques', [StatistiquesController::class, 'index']);

    // Liste des utilisateurs (sélection destinataire)
    Route::get('/users', [UserListController::class, 'index']);

    // Gestion des utilisateurs (admin)
    Route::patch('/users/{id}/status', [AuthController::class, 'toggleUserStatus']);
    Route::patch('/users/{id}/role', [AuthController::class, 'changeUserRole']);
    Route::delete('/users/{id}', [AuthController::class, 'deleteUser']);
    Route::get('/users/{id}/reset-code', [AuthController::class, 'getUserResetCode']);

    // Demandes de création de compte (admin)
    Route::get('/register-requests', [UserRequestController::class, 'index']);
    Route::post('/register-requests/{userRequest}/approve', [UserRequestController::class, 'approve']);
    Route::post('/register-requests/{userRequest}/reject', [UserRequestController::class, 'reject']);

    // Messages privés
    Route::post('/messages', [MessageController::class, 'store']);
    Route::get('/messages/received', [MessageController::class, 'inbox']);
    Route::get('/messages/sent', [MessageController::class, 'sent']);
    Route::put('/messages/{message}/read', [MessageController::class, 'markAsRead']);
});
