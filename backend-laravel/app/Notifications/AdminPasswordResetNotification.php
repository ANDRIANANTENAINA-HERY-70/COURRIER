<?php

namespace App\Notifications;

use App\Models\Courrier;
use App\Models\PasswordResetRequest;
use Illuminate\Notifications\Notification;

class AdminPasswordResetNotification extends Notification
{
    protected PasswordResetRequest $request;

    public function __construct(PasswordResetRequest $request)
    {
        $this->request = $request;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        try {
            $courrier = $this->createPasswordResetCourrier($notifiable->id);

            \Log::info('Courrier de réinitialisation créé', [
                'courrier_id' => $courrier->id,
                'user_id' => $this->request->user_id,
                'admin_id' => $notifiable->id,
                'objet' => $courrier->objet
            ]);

            return [
                'user_id' => $this->request->user_id,
                'user_name' => $this->request->user?->name,
                'user_email' => $this->request->email,
                'user_role' => $this->request->user?->role,
                'code' => $this->request->code,
                'expires_at' => $this->request->expires_at?->toIso8601String(),
                'message' => "L'utilisateur {$this->request->user?->name} ({$this->request->email}) a demandé une réinitialisation de mot de passe. Code: {$this->request->code}",
                'type' => 'password_reset_request',
                'courrier_id' => $courrier->id,
                'created_at' => now(),
            ];
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la création du courrier de réinitialisation', [
                'error' => $e->getMessage(),
                'user_id' => $this->request->user_id,
                'admin_id' => $notifiable->id
            ]);

            return [
                'user_id' => $this->request->user_id,
                'user_name' => $this->request->user?->name,
                'user_email' => $this->request->email,
                'user_role' => $this->request->user?->role,
                'code' => $this->request->code,
                'expires_at' => $this->request->expires_at?->toIso8601String(),
                'message' => "L'utilisateur {$this->request->user?->name} ({$this->request->email}) a demandé une réinitialisation de mot de passe. Code: {$this->request->code}",
                'type' => 'password_reset_request',
                'created_at' => now(),
            ];
        }
    }

    private function createPasswordResetCourrier(int $adminId)
    {
        \Log::info('Tentative de création de courrier de réinitialisation', [
            'user_id' => $this->request->user_id,
            'user_email' => $this->request->email,
            'code' => $this->request->code,
            'admin_id' => $adminId,
        ]);

        $courrier = Courrier::create([
            'objet' => '🔐 Demande de réinitialisation de mot de passe',
            'message' => "L'utilisateur {$this->request->user?->name} ({$this->request->email}, rôle: {$this->request->user?->role}) a demandé une réinitialisation de mot de passe.\n\nCode de réinitialisation : {$this->request->code}\nExpire le : {$this->request->expires_at?->format('d/m/Y H:i')}\n\nTransmettez ce code à l'utilisateur concerné.",
            'sender_id' => $this->request->user_id,
            'receiver_id' => $adminId,
            'type' => 'password_reset_request',
            'statut' => 'en_attente',
            'priorite' => 'urgente',
        ]);

        \Log::info('Courrier de réinitialisation créé avec succès', [
            'courrier_id' => $courrier->id,
            'objet' => $courrier->objet,
            'receiver_id' => $courrier->receiver_id
        ]);

        return $courrier;
    }
}
