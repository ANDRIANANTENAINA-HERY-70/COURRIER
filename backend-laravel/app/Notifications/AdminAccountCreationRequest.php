<?php

namespace App\Notifications;

use App\Models\UserRequest;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminAccountCreationRequest extends Notification
{
    protected UserRequest $userRequest;

    public function __construct(UserRequest $userRequest)
    {
        $this->userRequest = $userRequest;
    }

    public function via($notifiable)
    {
        return ['database', 'mail'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'user_request_id' => $this->userRequest->id,
            'requester_name' => $this->userRequest->name,
            'requester_email' => $this->userRequest->email,
            'requester_role' => $this->userRequest->role,
            'status' => $this->userRequest->status,
            'message' => "Nouvelle demande de création de compte admin reçue. Merci de confirmer ou refuser la demande de {$this->userRequest->name} ({$this->userRequest->email}).",
            'type' => 'admin_account_creation_request',
            'action_url' => '/admin/account-requests',
            'approve_url' => '/admin/account-requests',
            'reject_url' => '/admin/account-requests',
            'created_at' => now(),
        ];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Nouvelle demande de compte administrateur')
            ->greeting('Bonjour ' . ($notifiable->name ?? 'Administrateur'))
            ->line("Une nouvelle demande de compte admin a été reçue.")
            ->line('Demandeur: ' . $this->userRequest->name . ' (' . $this->userRequest->email . ')')
            ->line('Vous pouvez confirmer ou refuser cette demande depuis le panneau administrateur.')
            ->action('Ouvrir les demandes', url('/admin/account-requests'))
            ->line('Une décision est requise avant l’activation du compte.');
    }
}
