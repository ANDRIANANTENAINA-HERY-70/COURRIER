<?php

namespace App\Notifications;

use App\Models\UserRequest;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class AdminAccountRejectedNotification extends Notification
{
    protected UserRequest $userRequest;
    protected $admin;
    protected $reason;

    public function __construct(UserRequest $userRequest, $admin, $reason = null)
    {
        $this->userRequest = $userRequest;
        $this->admin = $admin;
        $this->reason = $reason;
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
            'rejected_by' => $this->admin->name,
            'rejected_at' => now()->toIso8601String(),
            'reason' => $this->reason,
            'message' => "Votre demande de création de compte avec le rôle '{$this->userRequest->role}' a été refusée par {$this->admin->name}." . ($this->reason ? " Raison: {$this->reason}" : ""),
            'type' => 'admin_account_rejected',
            'status' => 'rejected',
            'created_at' => now(),
        ];
    }

    public function toMail($notifiable)
    {
        $mail = (new MailMessage)
            ->subject('Demande de compte refusée')
            ->greeting('Bonjour ' . $this->userRequest->name)
            ->line('Votre demande de création de compte avec le rôle ' . $this->userRequest->role . ' a été refusée.')
            ->line('Refusée par: ' . $this->admin->name);

        if ($this->reason) {
            $mail->line('Raison: ' . $this->reason);
        }

        return $mail->line('Vous pouvez renouveler votre demande si vous le souhaitez.');
    }
}
