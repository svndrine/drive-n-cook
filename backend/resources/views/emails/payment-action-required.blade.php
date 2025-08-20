<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Action requise pour votre paiement - Driv'n Cook</title>
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
            background: linear-gradient(135deg, #f39c12, #e67e22);
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

        .warning-icon {
            font-size: 60px;
            margin: 20px 0;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .content {
            padding: 30px;
        }

        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }

        .warning-message {
            background: linear-gradient(135deg, #fff3cd, #ffeaa7);
            border: 1px solid #ffeaa7;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }

        .warning-message h3 {
            color: #856404;
            margin: 0 0 10px 0;
            font-size: 20px;
        }

        .warning-message p {
            color: #856404;
            margin: 0;
            font-size: 16px;
        }

        .countdown-timer {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 20px 0;
        }

        .countdown-timer .time {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
        }

        .transaction-details {
            background-color: #f8f9fa;
            border-left: 4px solid #f39c12;
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
            color: #f39c12;
        }

        .detail-label {
            color: #666;
        }

        .detail-value {
            font-weight: bold;
        }

        .action-steps {
            background-color: #e8f4f8;
            border: 1px solid #bee5eb;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }

        .action-steps h4 {
            color: #0c5460;
            margin-top: 0;
        }

        .step {
            margin: 15px 0;
            padding: 15px;
            background-color: white;
            border-radius: 8px;
            border-left: 4px solid #17a2b8;
        }

        .step-number {
            display: inline-block;
            background-color: #17a2b8;
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            text-align: center;
            line-height: 25px;
            font-weight: bold;
            margin-right: 10px;
        }

        .cta-section {
            text-align: center;
            margin: 30px 0;
        }

        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #f39c12, #e67e22);
            color: white;
            text-decoration: none;
            padding: 18px 35px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 18px;
            transition: transform 0.2s;
            box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
        }

        .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(243, 156, 18, 0.4);
        }

        .security-info {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }

        .security-info h4 {
            color: #155724;
            margin-top: 0;
        }

        .why-section {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }

        .troubleshooting {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }

        .troubleshooting h4 {
            color: #856404;
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
            color: #f39c12;
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
                padding: 15px 25px;
                font-size: 16px;
            }

            .countdown-timer .time {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
<div class="email-container">
    {{-- En-tête d'alerte --}}
    <div class="header">
        <div class="warning-icon">⚠️</div>
        <h1>Action requise</h1>
        <div class="subtitle">Votre paiement nécessite une vérification</div>
    </div>

    {{-- Contenu principal --}}
    <div class="content">
        <div class="greeting">
            Bonjour {{ $user->firstname }} {{ $user->lastname }},
        </div>

        <p>Votre paiement a été initié avec succès, mais <strong>une action supplémentaire est requise</strong> pour finaliser la transaction.</p>

        <div class="warning-message">
            <h3>🔐 Vérification de sécurité nécessaire</h3>
            <p>Votre banque demande une authentification supplémentaire (3D Secure)</p>
        </div>

        {{-- Urgence temporelle --}}
        <div class="countdown-timer">
            <div>⏰ Temps restant pour finaliser</div>
            <div class="time">24 heures</div>
            <div>Après ce délai, le paiement sera automatiquement annulé</div>
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
                <span class="detail-value" style="color: #f39c12;">⏳ En attente d'action</span>
            </div>
        </div>

        {{-- Étapes à suivre --}}
        <div class="action-steps">
            <h4>📝 Étapes pour finaliser votre paiement</h4>

            <div class="step">
                <span class="step-number">1</span>
                <strong>Cliquez sur le bouton ci-dessous</strong><br>
                <small>Vous serez redirigé vers une page sécurisée</small>
            </div>

            <div class="step">
                <span class="step-number">2</span>
                <strong>Confirmez votre identité</strong><br>
                <small>Votre banque vous demandera une authentification (SMS, application mobile, etc.)</small>
            </div>

            <div class="step">
                <span class="step-number">3</span>
                <strong>Validez la transaction</strong><br>
                <small>Suivez les instructions de votre banque pour confirmer le paiement</small>
            </div>

            <div class="step">
                <span class="step-number">4</span>
                <strong>Confirmation automatique</strong><br>
                <small>Vous recevrez un email de confirmation une fois le paiement validé</small>
            </div>
        </div>

        {{-- Bouton d'action principal --}}
        <div class="cta-section">
            <a href="{{ $action_url }}" class="cta-button">
                🔐 Finaliser mon paiement
            </a>
            <p style="margin-top: 15px; font-size: 12px; color: #666;">
                Lien sécurisé - Valable 24 heures
            </p>
        </div>

        {{-- Pourquoi cette étape ? --}}
        <div class="why-section">
            <h4>🤔 Pourquoi cette étape supplémentaire ?</h4>
            <p>Cette vérification est <strong>obligatoire</strong> dans l'Union Européenne pour :</p>
            <ul>
                <li>🛡️ <strong>Protéger votre carte</strong> contre les fraudes</li>
                <li>🔒 <strong>Sécuriser vos transactions</strong> importantes</li>
                <li>✅ <strong>Respecter la réglementation</strong> bancaire européenne</li>
                <li>🏦 <strong>Validation par votre banque</strong> des gros montants</li>
            </ul>
            <p><em>Cette étape est automatique pour les montants élevés ou les nouveaux bénéficiaires.</em></p>
        </div>

        {{-- Informations de sécurité --}}
        <div class="security-info">
            <h4>🔐 Sécurité garantie</h4>
            <ul>
                <li>✅ <strong>Connexion chiffrée</strong> (SSL 256 bits)</li>
                <li>✅ <strong>Aucune donnée</strong> stockée par Driv'n Cook</li>
                <li>✅ <strong>Traitement direct</strong> par votre banque</li>
                <li>✅ <strong>Conformité PCI-DSS</strong> niveau 1</li>
                <li>✅ <strong>Processus certifié</strong> par Stripe</li>
            </ul>
            <p><strong>Vos données bancaires restent confidentielles et sécurisées.</strong></p>
        </div>

        {{-- Urgence selon le type --}}
        @if($transaction->transaction_type === 'entry_fee')
        <div class="warning-message">
            <h3>⚡ Activation de votre franchise</h3>
            <p>Votre franchise sera activée dès validation de ce paiement.<br>
                <strong>Finalisez rapidement pour débloquer tous vos services !</strong></p>
        </div>
        @elseif($transaction->transaction_type === 'monthly_royalty')
        <div class="warning-message">
            <h3>📅 Échéance royalties</h3>
            <p>Finalisez ce paiement avant l'échéance pour éviter les pénalités de retard.</p>
        </div>
        @elseif($transaction->transaction_type === 'stock_purchase')
        <div class="warning-message">
            <h3>📦 Commande en attente</h3>
            <p>Votre commande de stocks sera préparée dès validation du paiement.<br>
                Stock réservé pendant 24h seulement !</p>
        </div>
        @endif

        {{-- Problèmes courants --}}
        <div class="troubleshooting">
            <h4>🔧 Problèmes courants</h4>

            <p><strong>❓ Le lien ne fonctionne pas ?</strong></p>
            <ul>
                <li>Vérifiez que le lien n'est pas expiré (24h max)</li>
                <li>Désactivez temporairement bloqueurs de pub</li>
                <li>Essayez avec un autre navigateur</li>
            </ul>

            <p><strong>📱 Pas de SMS reçu ?</strong></p>
            <ul>
                <li>Vérifiez votre numéro dans votre espace bancaire</li>
                <li>Attendez quelques minutes (délai possible)</li>
                <li>Contactez votre banque si nécessaire</li>
            </ul>

            <p><strong>⏰ Plus de temps ?</strong></p>
            <ul>
                <li>Contactez-nous pour prolonger le délai</li>
                <li>Ou relancez un nouveau paiement</li>
            </ul>
        </div>

        {{-- Support --}}
        <div class="security-info">
            <h4>🆘 Besoin d'aide ?</h4>
            <p>Notre équipe support est disponible pour vous accompagner :</p>
            <ul>
                <li>📞 <strong>Hotline urgente :</strong> 01 23 45 67 89</li>
                <li>📧 <strong>Email :</strong> <a href="mailto:support@drivncook.fr" style="color: #155724;">support@drivncook.fr</a></li>
                <li>💬 <strong>Chat :</strong> Disponible dans votre espace franchisé</li>
            </ul>
            <p><strong>Référence à communiquer :</strong> Transaction #{{ $transaction->id }}</p>
        </div>

        {{-- Rappel temporel --}}
        <div style="background-color: #e74c3c; color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <h4 style="margin-top: 0;">⏰ Attention - Délai limité</h4>
            <p style="margin: 0;">
                <strong>Ce paiement expirera automatiquement dans 24 heures.</strong><br>
                Passé ce délai, vous devrez relancer une nouvelle transaction.
            </p>
        </div>

        <p style="margin-top: 30px; text-align: center;">
            <strong>Finalisez votre paiement maintenant en un clic ! 🚀</strong>
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
            <a href="#">Sécurité des paiements</a> |
            <a href="#">Centre d'aide</a> |
            <a href="#">Nous contacter</a>
        </div>

        <div class="legal">
            Cet email a été envoyé à {{ $user->email }}.<br>
            Paiement sécurisé par Stripe - Certifié PCI-DSS Niveau 1<br><br>

            © {{ date('Y') }} Driv'n Cook. Tous droits réservés.<br>
            SIRET : 12345678901234 | TVA : FR12345678901
        </div>
    </div>
</div>
</body>
</html>
