<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Échec de paiement - Driv'n Cook</title>
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
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }

        .header .subtitle {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }

        .error-icon {
            font-size: 60px;
            margin: 20px 0;
            animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }

        .content {
            padding: 30px;
        }

        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }

        .error-message {
            background: linear-gradient(135deg, #f8d7da, #f5c6cb);
            border: 1px solid #f5c6cb;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }

        .error-message h3 {
            color: #721c24;
            margin: 0 0 10px 0;
            font-size: 20px;
        }

        .error-message p {
            color: #721c24;
            margin: 0;
            font-size: 16px;
        }

        .transaction-details {
            background-color: #f8f9fa;
            border-left: 4px solid #e74c3c;
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
            color: #e74c3c;
        }

        .detail-label {
            color: #666;
        }

        .detail-value {
            font-weight: bold;
        }

        .error-details {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }

        .error-details h4 {
            color: #856404;
            margin-top: 0;
        }

        .error-details .error-code {
            background-color: #fff;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #e74c3c;
            margin: 10px 0;
        }

        .retry-section {
            background-color: #e8f4f8;
            border: 1px solid #bee5eb;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }

        .retry-section h4 {
            color: #0c5460;
            margin-top: 0;
        }

        .retry-section ul {
            margin: 10px 0;
            padding-left: 20px;
        }

        .retry-section li {
            margin: 8px 0;
            color: #0c5460;
        }

        .cta-section {
            text-align: center;
            margin: 30px 0;
        }

        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.2s;
            margin: 5px;
        }

        .cta-button.secondary {
            background: linear-gradient(135deg, #95a5a6, #7f8c8d);
        }

        .cta-button:hover {
            transform: translateY(-2px);
        }

        .support-section {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }

        .support-section h4 {
            color: #155724;
            margin-top: 0;
        }

        .footer {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 12px;
        }

        .footer a {
            color: #e74c3c;
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
                display: block;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
<div class="email-container">
    {{-- En-tête d'erreur --}}
    <div class="header">
        <div class="error-icon">❌</div>
        <h1>Échec de paiement</h1>
        <div class="subtitle">Votre transaction n'a pas pu être traitée</div>
    </div>

    {{-- Contenu principal --}}
    <div class="content">
        <div class="greeting">
            Bonjour {{ $user->firstname }} {{ $user->lastname }},
        </div>

        <p>Nous vous informons que votre tentative de paiement n'a pas pu être traitée avec succès.</p>

        <div class="error-message">
            <h3>⚠️ Paiement échoué</h3>
            <p>Ne vous inquiétez pas, aucun montant n'a été débité de votre compte.</p>
        </div>

        {{-- Détails de la transaction --}}
        <div class="transaction-details">
            <h3 style="margin-top: 0; color: #2c3e50;">📋 Détails de la transaction</h3>

            <div class="detail-row">
                <span class="detail-label">Numéro de transaction :</span>
                <span class="detail-value">#{{ $transaction->id }}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Montant :</span>
                <span class="detail-value">{{ number_format($transaction->amount, 2, ',', ' ') }} €</span>
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
                <span class="detail-label">Date/Heure :</span>
                <span class="detail-value">{{ $transaction->created_at->format('d/m/Y à H:i') }}</span>
            </div>

            <div class="detail-row">
                <span class="detail-label">Statut :</span>
                <span class="detail-value" style="color: #e74c3c;">❌ Échec</span>
            </div>
        </div>

        {{-- Détails de l'erreur --}}
        <div class="error-details">
            <h4>🔍 Raison de l'échec</h4>
            <div class="error-code">{{ $error_message }}</div>

            <p><strong>Causes possibles :</strong></p>
            <ul>
                <li>💳 Carte expirée ou invalide</li>
                <li>💰 Solde insuffisant</li>
                <li>🏦 Refus de la banque</li>
                <li>🔒 Problème de sécurité (3D Secure)</li>
                <li>📱 Interruption de la connexion</li>
            </ul>
        </div>

        {{-- Section retry --}}
        <div class="retry-section">
            <h4>🔄 Que faire maintenant ?</h4>
            <ol>
                <li><strong>Vérifiez vos informations bancaires</strong>
                    <ul>
                        <li>Numéro de carte correct</li>
                        <li>Date d'expiration valide</li>
                        <li>Code CVV exact</li>
                    </ul>
                </li>
                <li><strong>Contactez votre banque</strong> si nécessaire</li>
                <li><strong>Essayez avec une autre carte</strong> de paiement</li>
                <li><strong>Relancez le paiement</strong> depuis votre espace</li>
            </ol>
        </div>

        {{-- Boutons d'action --}}
        <div class="cta-section">
            <a href="{{ $retry_url }}" class="cta-button">
                🔄 Réessayer le paiement
            </a>
            <a href="{{ url('/franchisee/payments/methods') }}" class="cta-button secondary">
                💳 Changer de carte
            </a>
        </div>

        {{-- Urgence selon le type --}}
        @if($transaction->transaction_type === 'entry_fee')
        <div class="error-details">
            <h4>⚠️ Important - Droit d'entrée</h4>
            <p>Votre franchise ne pourra être activée qu'après réception du paiement du droit d'entrée.</p>
            <p><strong>Actions bloquées en attendant :</strong></p>
            <ul>
                <li>❌ Accès aux formations</li>
                <li>❌ Livraison du food truck</li>
                <li>❌ Commandes de stocks</li>
                <li>❌ Support technique avancé</li>
            </ul>
            <p><em>Merci de régler ce paiement rapidement pour débloquer votre franchise.</em></p>
        </div>
        @elseif($transaction->transaction_type === 'monthly_royalty')
        <div class="error-details">
            <h4>📅 Échéance royalties</h4>
            <p>Vos royalties mensuelles restent impayées. En cas de retard :</p>
            <ul>
                <li>⚠️ Pénalités de retard possibles</li>
                <li>🚫 Suspension temporaire possible</li>
                <li>📞 Contact de notre service recouvrement</li>
            </ul>
            <p><strong>Échéance :</strong> {{ $transaction->due_date ? $transaction->due_date->format('d/m/Y') : 'À définir' }}</p>
        </div>
        @elseif($transaction->transaction_type === 'stock_purchase')
        <div class="error-details">
            <h4>📦 Commande de stocks</h4>
            <p>Votre commande de stocks ne pourra être traitée qu'après réception du paiement.</p>
            @if($transaction->order_reference)
            <p><strong>Référence commande :</strong> {{ $transaction->order_reference }}</p>
            @endif
            <ul>
                <li>⏸️ Préparation en attente</li>
                <li>📅 Délai de livraison reporté</li>
                <li>⚠️ Stock réservé pendant 48h seulement</li>
            </ul>
        </div>
        @endif

        {{-- Conseils pratiques --}}
        <div class="retry-section">
            <h4>💡 Conseils pour éviter les échecs</h4>
            <ul>
                <li>🕐 <strong>Timing :</strong> Évitez les paiements tard le soir ou tôt le matin</li>
                <li>🌐 <strong>Connexion :</strong> Utilisez une connexion internet stable</li>
                <li>🔒 <strong>Sécurité :</strong> Désactivez temporairement VPN/proxy</li>
                <li>📱 <strong>Navigateur :</strong> Autorisez les pop-ups pour 3D Secure</li>
                <li>💳 <strong>Limite :</strong> Vérifiez vos plafonds de paiement</li>
                <li>🏦 <strong>Autorisation :</strong> Prévenez votre banque des gros montants</li>
            </ul>
        </div>

        {{-- Méthodes alternatives --}}
        <div class="retry-section">
            <h4>🔄 Méthodes de paiement alternatives</h4>
            <p>Si le problème persiste, vous pouvez :</p>
            <ul>
                <li>💳 <strong>Autre carte :</strong> Essayer avec une autre carte bancaire</li>
                <li>🏦 <strong>Virement :</strong> Demander nos coordonnées pour virement SEPA</li>
                <li>✉️ <strong>Chèque :</strong> Possibilité de paiement par chèque (délai plus long)</li>
                <li>📞 <strong>Téléphone :</strong> Paiement par téléphone avec nos conseillers</li>
            </ul>
            <p><em>Contactez notre service commercial pour ces options alternatives.</em></p>
        </div>

        {{-- Support prioritaire --}}
        <div class="support-section">
            <h4>🆘 Support prioritaire</h4>
            <p>Notre équipe est là pour vous aider à résoudre ce problème rapidement :</p>
            <ul>
                <li>📞 <strong>Hotline paiements :</strong> 01 23 45 67 89 (7j/7, 8h-20h)</li>
                <li>📧 <strong>Email prioritaire :</strong> <a href="mailto:paiements@drivncook.fr" style="color: #155724;">paiements@drivncook.fr</a></li>
                <li>💬 <strong>Chat urgent :</strong> Disponible dans votre espace franchisé</li>
                <li>📱 <strong>WhatsApp :</strong> +33 1 23 45 67 89</li>
            </ul>

            <p><strong>🎯 Informations à préparer pour nous aider :</strong></p>
            <ul>
                <li>Numéro de transaction : <strong>#{{ $transaction->id }}</strong></li>
                <li>Message d'erreur exact</li>
                <li>Type de carte utilisée</li>
                <li>Heure précise de la tentative</li>
            </ul>
        </div>

        {{-- Rappel important --}}
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center;">
            <h4 style="color: #856404; margin-top: 0;">⚠️ Rappel Important</h4>
            <p style="color: #856404; margin: 0;">
                <strong>Aucun montant n'a été débité</strong> de votre compte suite à cet échec.<br>
                Votre carte et vos données sont en sécurité.
            </p>
        </div>

        {{-- Délais selon le type --}}
        @if($transaction->transaction_type !== 'penalty')
        <div class="error-details">
            <h4>⏰ Délais à respecter</h4>
            @if($transaction->transaction_type === 'entry_fee')
            <p>Pour débloquer votre franchise rapidement, nous recommandons de régler ce paiement dans les <strong>24 heures</strong>.</p>
            @elseif($transaction->transaction_type === 'monthly_royalty')
            <p>Pour éviter les pénalités, merci de régulariser dans les <strong>7 jours</strong>.</p>
            @elseif($transaction->transaction_type === 'stock_purchase')
            <p>Votre stock reste réservé pendant <strong>48 heures</strong>. Au-delà, la commande sera annulée.</p>
            @endif
        </div>
        @endif

        <p style="margin-top: 30px; text-align: center;">
            <strong>Notre équipe reste à votre disposition pour vous accompagner ! 🤝</strong>
        </p>
    </div>

    {{-- Pied de page --}}
    <div class="footer">
        <div>
            <strong>Driv'n Cook</strong><br>
            123 Avenue de la République, 75012 Paris<br>
            📞 01 23 45 67 89 | 📧 contact@drivncook.fr
        </div>

        <div style="margin: 15px 0;">
            <a href="#">Centre d'aide</a> |
            <a href="#">FAQ Paiements</a> |
            <a href="#">Nous contacter</a>
        </div>

        <div class="legal">
            Cet email a été envoyé à {{ $user->email }}.<br>
            En cas de problème persistant, n'hésitez pas à nous contacter.<br><br>

            © {{ date('Y') }} Driv'n Cook. Tous droits réservés.<br>
            SIRET : 12345678901234 | TVA : FR12345678901
        </div>
    </div>
</div>
</body>
</html>
