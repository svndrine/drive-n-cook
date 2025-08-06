<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $isValidation ? 'Validation de votre compte' : 'Votre mot de passe' }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .content {
            color: #666;
            font-size: 16px;
        }
        .password-box {
            background: #f8f9fa;
            border: 2px dashed #007bff;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            border-radius: 5px;
        }
        .password {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            letter-spacing: 2px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #999;
            text-align: center;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>{{ $isValidation ? '🎉 Félicitations !' : '🔑 Votre mot de passe' }}</h1>
    </div>

    <div class="content">
        @if($isValidation)
        <p>Bonjour <strong>{{ $franchisee->first_name }} {{ $franchisee->last_name }}</strong>,</p>

        <p>Excellente nouvelle ! Votre demande de franchise a été <strong>validée</strong> par notre équipe.</p>

        <p>Vous pouvez maintenant vous connecter à votre espace franchisé avec vos identifiants :</p>
        @else
        <p>Bonjour <strong>{{ $franchisee->first_name }} {{ $franchisee->last_name }}</strong>,</p>

        <p>Voici votre nouveau mot de passe pour accéder à votre espace franchisé :</p>
        @endif

        <div class="password-box">
            <p><strong>Email :</strong> {{ $userEmail ?? 'Non disponible' }}</p>
            <p><strong>Mot de passe :</strong></p>
            <div class="password">{{ $password }}</div>
        </div>

        <div class="warning">
            <strong>⚠️ Important :</strong> Pour votre sécurité, nous vous recommandons de changer ce mot de passe lors de votre première connexion.
        </div>

        @if($isValidation)
        <p>Prochaines étapes :</p>
        <ol>
            <li>Connectez-vous à votre espace franchisé</li>
            <li>Modifiez votre mot de passe</li>
            <li>Effectuez le paiement de votre franchise</li>
            <li>Accédez à tous vos documents et ressources</li>
        </ol>
        @endif

        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>

        <p>Cordialement,<br>
            L'équipe Franchise</p>
    </div>

    <div class="footer">
        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
</div>
</body>
</html>
