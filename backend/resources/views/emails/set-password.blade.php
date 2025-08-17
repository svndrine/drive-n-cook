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

        <p style="margin:24px 0 8px 0;">1) Lire et accepter votre contrat :</p>
        @if($contract_view_url)
        <a href="{{ $contract_view_url }}" style="display:inline-block;padding:12px 16px;border-radius:8px;background:#111;color:#fff;text-decoration:none;font-weight:600">
            Ouvrir le contrat
        </a>
        @else
        <p style="color:#999;font-style:italic;">Lien du contrat en cours de génération...</p>
        @endif

        <p style="margin:24px 0 8px 0;">2) Payer le droit d'entrée (50 000 €) :</p>
        @if($entry_fee_url)
        <a href="{{ $entry_fee_url }}" style="display:inline-block;padding:12px 16px;border-radius:8px;background:#16a34a;color:#fff;text-decoration:none;font-weight:600">
            Payer maintenant
        </a>
        @else
        <p style="color:#999;font-style:italic;">Lien de paiement en cours de génération...</p>
        @endif

        <p style="margin-top:24px;font-size:13px;color:#6b7280">
            Vos accès seront activés automatiquement après le paiement.
        </p>
        @else
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
    <!-- DEBUG TEMPORAIRE -->
    <div style="background:#f0f0f0;padding:10px;margin:10px 0;font-size:12px;">
        <strong>Debug:</strong><br>
        isValidation: {{ $isValidation ? 'true' : 'false' }}<br>
        paymentData exists: {{ isset($paymentData) ? 'OUI' : 'NON' }}<br>
        @if(isset($paymentData))
        public_links exists: {{ isset($paymentData['public_links']) ? 'OUI' : 'NON' }}<br>
        @if(isset($paymentData['public_links']))
        contract_url: {{ isset($paymentData['public_links']['contract_view_url']) ? 'OUI' : 'NON' }}<br>
        @endif
        @endif
    </div>
</div>
</body>
</html>
