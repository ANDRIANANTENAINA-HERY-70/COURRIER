<?php

namespace App\Notifications;

use App\Models\PasswordResetRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetRequested extends Notification
{
    use Queueable;

    public function __construct(
        protected PasswordResetRequest $request
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
        $adminPanelUrl = "{$frontendUrl}/utilisateurs";
        $adminEmail = config('app.admin_email', 'admin@example.com');

        return (new MailMessage)
            ->from($adminEmail, config('mail.from.name', config('app.name', 'Gestion Courrier')))
            ->subject('Demande de réinitialisation de mot de passe')
            ->greeting('Bonjour,')
            ->line("Une demande de réinitialisation a été reçue pour : {$this->request->email}")
            ->line("Code de réinitialisation : {$this->request->code}")
            ->line("Le code expire le {$this->request->expires_at->format('d/m/Y H:i')}.")
            ->action('Ouvrir la page Utilisateurs', $adminPanelUrl)
            ->line('Vous pouvez transmettre ce code à l’utilisateur concerné.')
            ->line('Si vous n’êtes pas à l’origine de cette notification, ignorez ce message.');
    }
}
