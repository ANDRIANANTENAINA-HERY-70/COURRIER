<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use App\Mail\MessageMail;

class MessageController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'receiver_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'subject'     => ['required', 'string', 'max:255'],
            'content'     => ['required', 'string'],
        ]);

        // Empêcher l'auto-envoi
        if ((int)$validated['receiver_id'] === (int)$user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas vous envoyer un message.'
            ], 422);
        }

        return DB::transaction(function () use ($validated, $user) {
            $message = Message::create([
                'sender_id'   => $user->id,
                'receiver_id' => $validated['receiver_id'],
                'subject'     => $validated['subject'],
                'content'     => $validated['content'],
            ]);

            // Envoi d'email après le commit pour ne pas annuler l'enregistrement
            DB::afterCommit(function () use ($validated, $message) {
                $receiver = User::find($validated['receiver_id']);
                if (!$receiver || empty($receiver->email)) {
                    Log::warning('Message sans email destinataire', ['message_id' => $message->id]);
                    return;
                }

                try {
                    $recipientEmail = trim($receiver->email);
                    Log::info('Envoi email de message', [
                        'message_id' => $message->id,
                        'to' => $recipientEmail,
                    ]);
                    Mail::to($recipientEmail)->send(new MessageMail($message->fresh('sender', 'receiver')));
                } catch (\Throwable $e) {
                    // On n'échoue pas la requête API pour un problème SMTP
                    Log::error('Echec envoi email pour message', [
                        'message_id' => $message->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Message enregistré; email en cours d\'envoi',
                'data'    => $message->load('sender', 'receiver')
            ], 201);
        });
    }

    public function inbox(Request $request)
    {
        $user = $request->user();

        $messages = Message::query()
            ->where('receiver_id', $user->id)
            ->with(['sender:id,name,email'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function sent(Request $request)
    {
        $user = $request->user();

        $messages = Message::query()
            ->where('sender_id', $user->id)
            ->with(['receiver:id,name,email'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $messages]);
    }

    public function markAsRead(Request $request, Message $message)
    {
        $user = $request->user();
        abort_unless($message->receiver_id === $user->id, 403, 'Non autorisé');

        $updated = $message->update(['is_read' => true]);

        abort_unless($updated, 403, 'Non autorisé');

        return response()->json(['success' => true]);
    }
}
