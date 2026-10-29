<?php

namespace App\Notifications;

use App\Models\UserRequest;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class AdminAccountApprovedNotification extends Notification
{
    protected UserRequest $userRequest;
    protected $admin;

    public function __construct(UserRequest $userRequest, $admin)
    {
        $this->userRequest = $userRequest;
        $this->admin = $admin;
    }

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'user_request_id' => $this->userRequest->id,
            'user_name' => $this->userRequest->name,
            'user_email' => $this->userRequest->email,
            'user_role' => $this->userRequest->role,
            'approved_by' => $this->admin->name,
            'approved_at' => now()->toIso8601String(),
            'message' => "Votre demande de création de compte avec le rôle '{$this->userRequest->role}' a été approuvée par {$this->admin->name}. Vous pouvez maintenant vous connecter.",
            'type' => 'admin_account_approved',
            'status' => 'approved',
            'created_at' => now(),
        ];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Demande de compte approuvée')
            ->greeting('Bonjour ' . $this->userRequest->name)
            ->line('Votre demande de création de compte avec le rôle ' . $this->userRequest->role . ' a été approuvée!')
            ->line('Approuvée par: ' . $this->admin->name)
            ->action('Se connecter', url('/login'))
            ->line('Vous pouvez maintenant accéder à la plateforme avec vos identifiants.');
    }
}
