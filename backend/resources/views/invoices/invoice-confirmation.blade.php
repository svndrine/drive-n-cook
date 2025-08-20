<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture {{ $invoice->invoice_number }} - {{ $company_name }}</title>
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

        .content {
            padding: 30px;
        }

        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }

        .invoice-info {
            background-color: #f8f9fa;
            border-left: 4px solid #e74c3c;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }

        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            padding: 10px 0;
            border-bottom: 1px solid #ecf0f1;
        }

        .invoice-details:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 18px;
            color: #e74c3c;
        }

        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            margin: 10px 0;
        }

        .status-paid {
            background-color: #27ae60;
            color: white;
        }

        .status-pending {
            background-color: #f39c12;
            color: white;
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
        }

        .cta-button:hover {
            transform: translateY(-2px);
        }

        .info-section {
            background-color: #e8f4f8;
            border: 1px solid #bee5eb;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
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

        .social-links {
            margin: 15px 0;
        }

        .social-links a {
            display: inline-block;
            margin: 0 10px;
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

            .invoice-details {
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
    {{-- En-tête --}}
    <div class="header">
        <h1>🍔 {{ $company_name }}</h1>
        <div class="subtitle">Votre facture est disponible</div>
    </div>

    {{-- Contenu principal --}}
    <div class="content">
        <div class="greeting">
            Bonjour {{ $user->firstname }} {{ $user->lastname }},
        </div>

        @if($invoice->status === 'paid')
        <p>Nous vous confirmons la <strong>réception de votre paiement</strong> pour la facture <strong>{{ $invoice->invoice_number }}</strong>.</p>

        <div class="status-badge status-paid">
            ✅ PAIEMENT CONFIRMÉ
        </div>

        <p>Votre paiement a été traité avec succès le {{ $invoice->paid_at->format('d/m/Y à H:i') }}.</p>
        @else
        <p>Votre facture <strong>{{ $invoice->invoice_number }}</strong> est maintenant disponible et en attente de paiement.</p>

        <div class="status-badge status-pending">
            ⏳ EN ATTENTE DE PAIEMENT
        </div>

        <p>Échéance de paiement : <strong>{{ $invoice->due_date->format('d/m/Y') }}</strong></p>
        @endif

        {{-- Détails de la facture --}}
        <div class="invoice-info">
            <h3 style="margin-top: 0; color: #2c3e50;">📋 Détails de la facture</h3>

            <div class="invoice-details">
                <span>Numéro de facture :</span>
                <span><strong>{{ $invoice->invoice_number }}</strong></span>
            </div>

            <div class="invoice-details">
                <span>Date d'émission :</span>
                <span>{{ $invoice->issue_date->format('d/m/Y') }}</span>
            </div>

            @if($invoice->status !== 'paid')
            <div class="invoice-details">
                <span>Date d'échéance :</span>
                <span>{{ $invoice->due_date->format('d/m/Y') }}</span>
            </div>
            @endif

            <div class="invoice-details">
                <span>Description :</span>
                <span>{{ $transaction->description }}</span>
            </div>

            @if($transaction->order_reference)
            <div class="invoice-details">
                <span>Référence commande :</span>
                <span>{{ $transaction->order_reference }}</span>
            </div>
            @endif

            <div class="invoice-details">
                <span>Montant total TTC :</span>
                <span>{{ number_format($invoice->amount_ttc, 2, ',', ' ') }} €</span>
            </div>
        </div>

        {{-- Actions selon le statut --}}
        @if($invoice->status === 'paid')
        {{-- Facture payée --}}
        <p>🎉 <strong>Merci pour votre paiement !</strong></p>

        @if($transaction->transaction_type === 'entry_fee')
        <div class="info-section">
            <h4 style="margin-top: 0;">🚀 Prochaines étapes de votre franchise</h4>
            <ul>
                <li>Votre franchise est maintenant <strong>officiellement active</strong></li>
                <li>Vous allez recevoir vos accès complets à la plateforme</li>
                <li>Notre équipe vous contactera sous 48h pour planifier votre formation</li>
                <li>La livraison de votre food truck sera organisée dans les 2 semaines</li>
            </ul>
        </div>
        @elseif($transaction->transaction_type === 'monthly_royalty')
        <div class="info-section">
            <h4 style="margin-top: 0;">📊 Vos royalties mensuelles</h4>
            <p>Période : {{ $transaction->created_at->format('F Y') }}</p>
            <p>Votre paiement de royalties (4% du CA) est à jour. Merci de votre ponctualité !</p>
        </div>
        @elseif($transaction->transaction_type === 'stock_purchase')
        <div class="info-section">
            <h4 style="margin-top: 0;">📦 Votre commande de stocks</h4>
            <p>Votre commande sera préparée et expédiée dans les 24-48h.</p>
            <p>Vous recevrez un email de confirmation d'expédition avec le numéro de suivi.</p>
        </div>
        @endif

        <div class="cta-section">
            <a href="{{ url('/franchisee/invoices') }}" class="cta-button">
                📄 Voir mes factures
            </a>
        </div>

        @else
        {{-- Facture en attente --}}
        @if($invoice->isOverdue())
        <div style="background-color: #fdf2f2; border: 1px solid #fca5a5; color: #dc2626; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>⚠️ Facture en retard</strong><br>
            Cette facture est en retard de {{ $invoice->days_overdue }} jour(s).
            Merci de procéder au paiement rapidement pour éviter les pénalités.
        </div>
        @endif

        <div class="cta-section">
            <a href="{{ url('/franchisee/payments/invoice/' . $invoice->id) }}" class="cta-button">
                💳 Payer maintenant
            </a>
        </div>

        <div class="info-section">
            <h4 style="margin-top: 0;">💡 Modalités de paiement</h4>
            <ul>
                <li>Paiement sécurisé par carte bancaire</li>
                <li>Traitement instantané de votre paiement</li>
                <li>Confirmation automatique par email</li>
                <li>Accès 24h/7j depuis votre espace franchisé</li>
            </ul>
        </div>
        @endif

        {{-- Pièce jointe --}}
        <p style="margin-top: 30px;">
            📎 <strong>Facture en pièce jointe :</strong> facture_{{ $invoice->invoice_number }}.pdf
        </p>

        <p>
            Vous pouvez également télécharger votre facture à tout moment depuis votre espace franchisé.
        </p>

        {{-- Support --}}
        <div class="info-section">
            <h4 style="margin-top: 0;">🆘 Besoin d'aide ?</h4>
            <p>Notre équipe est là pour vous accompagner :</p>
            <ul>
                <li>📧 Email : <a href="mailto:support@drivncook.fr">support@drivncook.fr</a></li>
                <li>📞 Téléphone : 01 23 45 67 89 (du lundi au vendredi, 9h-18h)</li>
                <li>💬 Chat en ligne depuis votre espace franchisé</li>
            </ul>
        </div>

        <p style="margin-top: 30px;">
            Merci de faire partie de la famille Driv'n Cook ! 🚚✨
        </p>
    </div>

    {{-- Pied de page --}}
    <div class="footer">
        <div>
            <strong>Driv'n Cook</strong><br>
            123 Avenue de la République, 75012 Paris<br>
            📞 01 23 45 67 89 | 📧 contact@drivncook.fr
        </div>

        <div class="social-links">
            <a href="#">Facebook</a> |
            <a href="#">Instagram</a> |
            <a href="#">LinkedIn</a>
        </div>

        <div class="legal">
            Cet email a été envoyé à {{ $user->email }}.<br>
            Si vous ne souhaitez plus recevoir ces emails,
            <a href="#">cliquez ici pour vous désabonner</a>.<br><br>

            © {{ date('Y') }} Driv'n Cook. Tous droits réservés.<br>
            SIRET : 12345678901234 | TVA : FR12345678901
        </div>
    </div>
</div>
</body>
</html>
