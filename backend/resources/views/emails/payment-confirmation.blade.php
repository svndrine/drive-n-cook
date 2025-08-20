<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paiement confirmé - {{ $company_name }}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }

        .email-container {
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }

        .header .subtitle {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }

        .success-icon {
            font-size: 60px;
            margin: 20px 0;
            animation: bounce 2s infinite;
        }

        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-10px);
            }
            60% {
                transform: translateY(-5px);
            }
        }

        .content {
            padding: 30px;
        }

        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }

        .success-message {
            background: linear-gradient(135deg, #d4edda, #c3e6cb);
            border: 1px solid #c3e6cb;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }

        .success-message h3 {
            color: #155724;
            margin: 0 0 10px 0;
            font-size: 20px;
        }

        .success-message p {
            color: #155724;
            margin: 0;
            font-size: 16px;
        }

        .transaction-details {
            background-color: #f8f9fa;
            border-left: 4px solid #27ae60;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #ecf0f1;
        }

        .detail-row:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 18px;
            color: #27ae60;
        }

        .detail-label {
            color: #666;
        }

        .detail-value {
            font-weight: bold;
        }

        .amount-highlight {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            margin: 20px 0;
        }

        .amount-highlight .amount {
            font-size: 24px;
            font-weight: bold;
        }

        .next-steps {
            background-color: #e8f4f8;
            border: 1px solid #bee5eb;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }

        .next-steps h4 {
            color: #0c5460;
            margin-top: 0;
        }

        .next-steps ul {
            margin: 10px 0;
            padding-left: 20px;
        }

        .next-steps li {
            margin: 8px 0;
            color: #0c5460;
        }

        .cta-section {
            text-align: center;
            margin: 30px 0;
        }

        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.2s;
        }

        .cta-button:hover {
            transform: translateY(-2px);
        }

        .footer {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 12px;
        }

        .footer a {
            color: #3498db;
            text-decoration: none;
        }

        .social-links {
            margin: 15px 0;
        }

        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #3498db;
            text-decoration: none;
        }

        .legal {
            margin-top: 15px;
            opacity: 0.8;
            font-size: 10px;
        }

        @media only screen and (max-width: 600px) {
            body {
                padding: 10px;
            }

            .content {
                padding: 20px;
            }

            .detail-row {
                flex-direction: column;
                gap: 5px;
            }

            .cta-button {
                padding: 12px 25px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
<div class="email-container">
    {{-- En-tête de succès --}}
    <div class="header">
        <div class="success-icon">✅</div>
        <h1>Paiement Confirmé !</h1>
        <div class="subtitle">{{ $company_name }} - Votre transaction a été traitée avec succès</div>
    </div>

    {{-- Contenu principal --}}
    <div class="content">
        <div class="greeting">
            Bonjour {{ $user->firstname }} {{ $user->lastname }},
        </div>

        <div class="success-message">
            <h3>🎉 Paiement réussi !</h3>
            <p>Votre paiement a été traité avec succès. Merci pour votre confiance !</p>
        </div>

        {{-- Montant en évidence --}}
        <div class="amount-highlight">
            <div>Montant payé</div>
            <div class="amount">{{ number_format($transaction->amount, 2, ',', ' ') }} €</div>
            <div>{{ $transaction->created_at->format('d/m/Y à H:i') }}</div>
        </div>

        {{-- Détails de la transaction --}}
        <div class="transaction-details">
            <h3 style="margin-top: 0; color: #2c3e50;">📋 Détails de la transaction</h3>

            <div class="detail-row">
                <span class="detail-label">Numéro de transaction :</span>
                <span class="detail-value">#{{ $transaction->id }}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Type de paiement :</span>
                <span class="detail-value">
                        @switch($transaction->transaction_type)
                            @case('entry_fee')
                                💰 Droit d'entrée franchise
                                @break
                            @case('monthly_royalty')
                                📊 Royalties mensuelles
                                @break
                            @case('stock_purchase')
                                📦 Achat de stocks
                                @break
                            @case('penalty')
                                ⚠️ Pénalité
                                @break
                            @default
                                {{ $transaction->description }}
                        @endswitch
                    </span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Description :</span>
                <span class="detail-value">{{ $transaction->description }}</span>
            </div>

            @if($transaction->order_reference)
            <div class="detail-row">
                <span class="detail-label">Référence commande :</span>
                <span class="detail-value">{{ $transaction->order_reference }}</span>
            </div>
            @endif

            @if($transaction->stripe_payment_intent_id)
            <div class="detail-row">
                <span class="detail-label">Référence Stripe :</span>
                <span class="detail-value">{{ $transaction->stripe_payment_intent_id }}</span>
            </div>
            @endif

            <div class="detail-row">
                <span class="detail-label">Statut :</span>
                <span class="detail-value" style="color: #27ae60;">✅ Payé et confirmé</span>
            </div>
        </div>

        {{-- Prochaines étapes selon le type --}}
        @if($transaction->transaction_type === 'entry_fee')
        <div class="next-steps">
            <h4>🚀 Félicitations ! Votre franchise est maintenant active</h4>
            <p><strong>Prochaines étapes :</strong></p>
            <ul>
                <li>✅ Votre compte franchisé est maintenant activé</li>
                <li>📚 Vous recevrez vos accès à la formation sous 24h</li>
                <li>🚛 La livraison de votre food truck sera organisée dans les 2 semaines</li>
                <li>📞 Notre équipe vous contactera sous 48h pour planifier votre démarrage</li>
                <li>📦 Vous pouvez dès maintenant commander vos premiers stocks</li>
            </ul>
            <p><em>Bienvenue dans la famille Driv'n Cook ! 🎉</em></p>
        </div>
        @elseif($transaction->transaction_type === 'monthly_royalty')
        <div class="next-steps">
            <h4>📊 Royalties mensuelles à jour</h4>
            <p>Vos royalties pour le mois de {{ $transaction->created_at->format('F Y') }} sont maintenant réglées.</p>
            <ul>
                <li>✅ Votre compte franchisé reste en règle</li>
                <li>📈 Continuez à déclarer votre chiffre d'affaires mensuellement</li>
                <li>🗓️ Prochaine échéance : {{ $transaction->created_at->addMonth()->endOfMonth()->format('d/m/Y') }}</li>
            </ul>
        </div>
        @elseif($transaction->transaction_type === 'stock_purchase')
        <div class="next-steps">
            <h4>📦 Votre commande de stocks</h4>
            <p>Votre paiement pour l'achat de stocks a été confirmé.</p>
            <ul>
                <li>✅ Votre commande va être préparée dans les 24-48h</li>
                <li>📧 Vous recevrez un email de confirmation d'expédition</li>
                <li>🚚 Livraison prévue sous 3-5 jours ouvrés</li>
                <li>📱 Suivi de livraison disponible dans votre espace</li>
            </ul>
            @if($transaction->order_reference)
            <p><strong>Référence de commande :</strong> {{ $transaction->order_reference }}</p>
            @endif
        </div>
        @elseif($transaction->transaction_type === 'penalty')
        <div class="next-steps">
            <h4>⚠️ Pénalité réglée</h4>
            <p>Votre paiement de pénalité a été confirmé.</p>
            <ul>
                <li>✅ Votre compte est maintenant régularisé</li>
                <li>📅 Veillez à respecter les prochaines échéances</li>
                <li>💡 Configurez des rappels automatiques dans votre espace</li>
            </ul>
        </div>
        @endif

        {{-- Boutons d'action --}}
        <div class="cta-section">
            <a href="{{ url('/franchisee/dashboard') }}" class="cta-button">
                🏠 Accéder à mon espace
            </a>
        </div>

        {{-- Reçu et facture --}}
        <div class="next-steps">
            <h4>📄 Vos documents</h4>
            <ul>
                <li>📧 <strong>Facture officielle :</strong> Vous la recevrez dans quelques minutes par email séparé</li>
                <li>💾 <strong>Téléchargement :</strong> Disponible à tout moment dans votre espace franchisé</li>
                <li>🗃️ <strong>Archivage :</strong> Tous vos documents sont conservés en ligne</li>
            </ul>
        </div>

        {{-- Support --}}
        <div class="next-steps">
            <h4>🆘 Besoin d'aide ?</h4>
            <p>Notre équipe support est là pour vous accompagner :</p>
            <ul>
                <li>📧 Email : <a href="mailto:support@drivncook.fr" style="color: #3498db;">support@drivncook.fr</a></li>
                <li>📞 Téléphone : 01 23 45 67 89 (9h-18h, du lundi au vendredi)</li>
                <li>💬 Chat en ligne depuis votre espace franchisé</li>
                <li>📚 Centre d'aide : <a href="{{ url('/help') }}" style="color: #3498db;">FAQ et guides</a></li>
            </ul>
        </div>

        <p style="margin-top: 30px; text-align: center;">
            <strong>Merci de faire partie de l'aventure Driv'n Cook ! 🚚✨</strong>
        </p>
    </div>

    {{-- Pied de page --}}
    <div class="footer">
        <div>
            <strong>{{ $company_name }}</strong><br>
            123 Avenue de la République, 75012 Paris<br>
            📞 01 23 45 67 89 | 📧 contact@drivncook.fr
        </div>

        <div class="social-links">
            <a href="#">Facebook</a> |
            <a href="#">Instagram</a> |
            <a href="#">LinkedIn</a> |
            <a href="#">YouTube</a>
        </div>

        <div class="legal">
            Cet email a été envoyé à {{ $user->email }}.<br>
            <a href="#">Se désabonner</a> | <a href="#">Politique de confidentialité</a><br><br>

            © {{ date('Y') }} {{ $company_name }}. Tous droits réservés.<br>
            SIRET : 12345678901234 | TVA : FR12345678901
        </div>
    </div>
</div>
</body>
</html>
