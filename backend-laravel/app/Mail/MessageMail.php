<?php

namespace App\Mail;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public Message $messageModel;

    public function __construct(Message $message)
    {
        // Eager-load relations to avoid lazy-loading inside the mailable
        $this->messageModel = $message->load('sender', 'receiver');
    }

    public function build(): self
    {
        return $this
            ->subject($this->messageModel->subject)
            ->view('emails.message')
            ->with([
                'subject' => $this->messageModel->subject,
                'content' => $this->messageModel->content,
                'sender'  => $this->messageModel->sender,
                'receiver'=> $this->messageModel->receiver,
                'sentAt'  => $this->messageModel->created_at,
            ]);
    }
}
