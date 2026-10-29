<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $subject }}</title>
</head>
<body>
    <p>Bonjour {{ $receiver->name ?? 'utilisateur' }},</p>

    <p>{!! nl2br(e($content)) !!}</p>

    <p>— {{ $sender->name ?? 'Un expéditeur' }}<br>
       Envoyé le {{ $sentAt->format('d/m/Y à H:i') }}</p>
</body>
</html>
