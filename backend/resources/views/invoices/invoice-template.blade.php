<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture {{ $invoice->invoice_number }}</title>
    <style>
        @page {
            margin: 2cm;
            @bottom-right {
                content: "Page " counter(page) " sur " counter(pages);
                font-size: 10px;
                color: #666;
            }
        }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e74c3c;
        }

        .company-info {
            flex: 1;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #e74c3c;
            margin-bottom: 10px;
        }

        .company-details {
            font-size: 11px;
            color: #666;
            line-height: 1.3;
        }

        .invoice-info {
            text-align: right;
            flex: 1;
        }

        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }

        .invoice-number {
            font-size: 16px;
            color: #e74c3c;
            font-weight: bold;
            margin-bottom: 20px;
        }

        .invoice-dates {
            font-size: 11px;
            color: #666;
        }

        .client-section {
            margin-bottom: 40px;
        }

        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #bdc3c7;
        }

        .client-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #e74c3c;
        }

        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .details-table th {
            background-color: #2c3e50;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
        }

        .details-table td {
            padding: 12px;
            border-bottom: 1px solid #ecf0f1;
            vertical-align: top;
        }

        .details-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }

        .amount-column {
            text-align: right;
            font-weight: bold;
        }

        .totals-section {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }

        .totals-table {
            width: 300px;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 8px 15px;
            border: 1px solid #bdc3c7;
        }

        .totals-table .label {
            background-color: #ecf0f1;
            font-weight: bold;
            text-align: right;
        }

        .totals-table .amount {
            text-align: right;
            font-weight: bold;
        }

        .totals-table .total-row {
            background-color: #2c3e50;
            color: white;
            font-size: 14px;
            font-weight: bold;
        }

        .payment-info {
            margin-top: 40px;
            padding: 20px;
            background-color: #f8f9fa;
            border: 1px solid #bdc3c7;
            border-radius: 5px;
        }

        .payment-status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
        }

        .status-paid {
            background-color: #27ae60;
            color: white;
        }

        .status-pending {
            background-color: #f39c12;
            color: white;
        }

        .status-overdue {
            background-color: #e74c3c;
            color: white;
        }

        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #bdc3c7;
            font-size: 10px;
            color: #7f8c8d;
            text-align: center;
        }

        .legal-mentions {
            margin-top: 20px;
            font-size: 9px;
            color: #95a5a6;
            line-height: 1.3;
        }

        .highlight {
            color: #e74c3c;
            font-weight: bold;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .mb-10 {
            margin-bottom: 10px;
        }

        .mb-20 {
            margin-bottom: 20px;
        }

        .mt-20 {
            margin-top: 20px;
        }
    </style>
</head>
<body>
{{-- En-tête --}}
<div class="header">
    <div class="company-info">
        <div class="company-name">{{ $company['name'] }}</div>
        <div class="company-details">
            {{ $company['address'] }}<br>
            {{ $company['postal_code'] }} {{ $company['city'] }}<br>
            {{ $company['country'] }}<br><br>
            <strong>SIRET:</strong> {{ $company['siret'] }}<br>
            <strong>TVA:</strong> {{ $company['vat_number'] }}<br>
            <strong>Email:</strong> {{ $company['email'] }}<br>
            <strong>Tél:</strong> {{ $company['phone'] }}
        </div>
    </div>

    <div class="invoice-info">
        <div class="invoice-title">FACTURE</div>
        <div class="invoice-number">{{ $invoice->invoice_number }}</div>
        <div class="invoice-dates">
            <strong>Date d'émission:</strong> {{ $invoice->issue_date->format('d/m/Y') }}<br>
            <strong>Date d'échéance:</strong> {{ $invoice->due_date->format('d/m/Y') }}<br>
            @if($invoice->paid_at)
            <strong>Date de paiement:</strong> {{ $invoice->paid_at->format('d/m/Y') }}
            @endif
        </div>
    </div>
</div>

{{-- Informations client --}}
<div class="client-section">
    <div class="section-title">FACTURER À</div>
    <div class="client-info">
        <strong>{{ $user->firstname }} {{ $user->lastname }}</strong><br>
        @if($franchisee)
        Franchisé Driv'n Cook<br>
        @if($franchisee->phone)
        Tél: {{ $franchisee->phone }}<br>
        @endif
        @endif
        Email: {{ $user->email }}<br>
        @if($franchisee && $franchisee->address)
        {{ $franchisee->address }}
        @endif
    </div>
</div>

{{-- Statut de paiement --}}
<div class="mb-20">
        <span class="payment-status
            @if($invoice->status === 'paid') status-paid
            @elseif($invoice->isOverdue()) status-overdue
            @else status-pending
            @endif">
            @if($invoice->status === 'paid')
                ✓ PAYÉE
            @elseif($invoice->isOverdue())
                ⚠ EN RETARD ({{ $invoice->days_overdue }} jours)
            @else
                ⏳ EN ATTENTE
            @endif
        </span>
</div>

{{-- Détails de la facture --}}
<table class="details-table">
    <thead>
    <tr>
        <th style="width: 50%">DESCRIPTION</th>
        <th style="width: 15%">QTÉ</th>
        <th style="width: 15%">PRIX UNIT. HT</th>
        <th style="width: 10%">TVA</th>
        <th style="width: 15%">TOTAL TTC</th>
    </tr>
    </thead>
    <tbody>
    <tr>
        <td>
            <strong>{{ $payment_details['description'] }}</strong><br>
            <small style="color: #7f8c8d;">{{ $payment_details['detail'] }}</small>
            @if($payment_details['reference'])
            <br><small><strong>Référence:</strong> {{ $payment_details['reference'] }}</small>
            @endif
            @if($transaction->transaction_type === 'monthly_royalty')
            <br><small>Période: {{ $transaction->created_at->format('m/Y') }}</small>
            @endif
        </td>
        <td class="text-center">1</td>
        <td class="amount-column">{{ number_format($invoice->amount_ht, 2, ',', ' ') }} €</td>
        <td class="text-center">{{ $invoice->vat_rate }}%</td>
        <td class="amount-column">{{ number_format($invoice->amount_ttc, 2, ',', ' ') }} €</td>
    </tr>
    </tbody>
</table>

{{-- Totaux --}}
<div class="totals-section">
    <table class="totals-table">
        <tr>
            <td class="label">Total HT</td>
            <td class="amount">{{ number_format($invoice->amount_ht, 2, ',', ' ') }} €</td>
        </tr>
        <tr>
            <td class="label">TVA ({{ $invoice->vat_rate }}%)</td>
            <td class="amount">{{ number_format($invoice->vat_amount, 2, ',', ' ') }} €</td>
        </tr>
        <tr class="total-row">
            <td class="label">TOTAL TTC</td>
            <td class="amount">{{ number_format($invoice->amount_ttc, 2, ',', ' ') }} €</td>
        </tr>
    </table>
</div>

{{-- Informations de paiement --}}
<div class="payment-info">
    <div class="section-title">INFORMATIONS DE PAIEMENT</div>

    @if($invoice->status === 'paid')
    <p><span class="highlight">✓ Facture réglée</span>
        @if($invoice->paid_at)
        le {{ $invoice->paid_at->format('d/m/Y à H:i') }}
        @endif
    </p>
    @if($transaction->stripe_payment_intent_id)
    <p><strong>Référence de paiement:</strong> {{ $transaction->stripe_payment_intent_id }}</p>
    @endif
    @else
    <p><strong>Échéance de paiement:</strong> {{ $invoice->due_date->format('d/m/Y') }}</p>
    @if($invoice->isOverdue())
    <p style="color: #e74c3c;"><strong>⚠ ATTENTION: Cette facture est en retard de {{ $invoice->days_overdue }} jour(s)</strong></p>
    @endif

    <p><strong>Modalités de paiement:</strong></p>
    <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Paiement par carte bancaire via notre plateforme sécurisée</li>
        <li>Paiement en ligne depuis votre espace franchisé</li>
        <li>En cas de retard, des pénalités peuvent s'appliquer</li>
    </ul>

    @if($transaction->due_date && $transaction->due_date->isFuture())
    <p><em>Un email de rappel sera envoyé 7 jours avant l'échéance.</em></p>
    @endif
    @endif

    @if($transaction->description && $transaction->description !== $payment_details['description'])
    <p><strong>Note:</strong> {{ $transaction->description }}</p>
    @endif
</div>

{{-- Notes additionnelles selon le type --}}
@if($transaction->transaction_type === 'entry_fee')
<div class="payment-info mt-20">
    <div class="section-title">INFORMATIONS FRANCHISE</div>
    <p>Ce paiement correspond au <strong>droit d'entrée</strong> pour l'acquisition de votre franchise Driv'n Cook.</p>
    <p>Ce montant inclut :</p>
    <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Formation initiale obligatoire</li>
        <li>Support marketing de lancement</li>
        <li>Équipement de base du food truck</li>
        <li>Assistance technique pendant 6 mois</li>
    </ul>
    <p><em>Votre franchise sera officiellement active après réception de ce paiement.</em></p>
</div>
@elseif($transaction->transaction_type === 'monthly_royalty')
<div class="payment-info mt-20">
    <div class="section-title">ROYALTIES MENSUELLES</div>
    <p>Ce paiement correspond aux <strong>royalties mensuelles</strong> calculées sur 4% de votre chiffre d'affaires.</p>
    <p>Période concernée : {{ $transaction->created_at->format('F Y') }}</p>
    @if($transaction->revenue_amount)
    <p>Chiffre d'affaires déclaré : {{ number_format($transaction->revenue_amount, 2, ',', ' ') }} €</p>
    <p>Calcul : {{ number_format($transaction->revenue_amount, 2, ',', ' ') }} € × 4% = {{ number_format($invoice->amount_ttc, 2, ',', ' ') }} € TTC</p>
    @endif
</div>
@elseif($transaction->transaction_type === 'stock_purchase')
<div class="payment-info mt-20">
    <div class="section-title">ACHAT DE STOCKS</div>
    <p>Ce paiement correspond à l'achat de stocks depuis nos entrepôts.</p>
    @if($transaction->order_reference)
    <p><strong>Commande :</strong> {{ $transaction->order_reference }}</p>
    @endif
    <p><em>Rappel : L'obligation d'achat de 80% de vos stocks depuis nos entrepôts fait partie de vos engagements contractuels.</em></p>
</div>
@endif

{{-- Pied de page --}}
<div class="footer">
    <div class="text-center mb-10">
        <strong>{{ $company['name'] }}</strong> - Franchise de food trucks de qualité
    </div>

    <div class="legal-mentions">
        <strong>Mentions légales :</strong><br>
        {{ $company['name'] }} - {{ $company['address'] }}, {{ $company['postal_code'] }} {{ $company['city'] }}<br>
        SIRET : {{ $company['siret'] }} - TVA Intracommunautaire : {{ $company['vat_number'] }}<br>
        Capital social : 100 000 € - RCS Paris 123 456 789<br><br>

        <strong>Conditions de paiement :</strong> Paiement à réception de facture.
        En cas de retard de paiement, des pénalités de 3 fois le taux d'intérêt légal seront appliquées,
        ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement (Art. L441-6 du Code de commerce).<br><br>

        Facture générée automatiquement le {{ $created_at }}
    </div>
</div>
</body>
</html>
