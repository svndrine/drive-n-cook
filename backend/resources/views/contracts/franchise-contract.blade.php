<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrat de Franchise - {{ $contract->contract_number }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.5;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
        }
        .company-logo {
            font-size: 24px;
            font-weight: bold;
            color: #ff6b35;
            margin-bottom: 10px;
        }
        .contract-title {
            font-size: 20px;
            font-weight: bold;
            margin-top: 20px;
        }
        .contract-number {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #000;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }
        .parties {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }
        .party {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 10px;
        }
        .party-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .signature-section {
            margin-top: 50px;
            display: table;
            width: 100%;
        }
        .signature-box {
            display: table-cell;
            width: 50%;
            text-align: center;
            padding: 20px;
        }
        .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 5px;
        }
        .terms-list {
            margin-left: 20px;
        }
        .amount {
            font-weight: bold;
            color: #ff6b35;
        }
        .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #666;
            text-align: center;
            border-top: 1px solid #ccc;
            padding-top: 20px;
        }
    </style>
</head>
<body>
<div class="header">
    <div class="company-logo">DRIV'N COOK</div>
    <div>Franchise de Food Trucks Premium</div>
    <div class="contract-title">CONTRAT DE FRANCHISE</div>
    <div class="contract-number">N° {{ $contract->contract_number }}</div>
    <div style="margin-top: 10px; font-size: 14px;">
        Généré le {{ now()->format('d/m/Y à H:i') }}
    </div>
</div>

<div class="section">
    <div class="section-title">PARTIES CONTRACTANTES</div>
    <div class="parties">
        <div class="party">
            <div class="party-title">LE FRANCHISEUR :</div>
            <strong>DRIV'N COOK SAS</strong><br>
            Société par Actions Simplifiée<br>
            Capital social : 50 000 €<br>
            Siège social : 123 Avenue de la République<br>
            75012 Paris, France<br>
            SIRET : 123 456 789 00012<br>
            Représentée par : M. Jean MARTIN, Président
        </div>
        <div class="party">
            <div class="party-title">LE FRANCHISÉ :</div>
            <strong>{{ $franchisee->first_name }} {{ $franchisee->last_name }}</strong><br>
            Adresse : {{ $franchisee->address }}<br>
            {{ $franchisee->zip_code }} {{ $franchisee->city }}<br>
            Téléphone : {{ $franchisee->phone }}<br>
            <br>
            Situation actuelle : {{ $franchisee->current_situation }}<br>
            Zone désirée : {{ $franchisee->desired_zone }}
        </div>
    </div>
</div>

<div class="section">
    <div class="section-title">OBJET DU CONTRAT</div>
    <p>
        Le présent contrat a pour objet l'octroi par DRIV'N COOK au franchisé du droit d'exploiter
        un food truck sous l'enseigne et selon le concept DRIV'N COOK dans la zone géographique
        définie ci-après.
    </p>
</div>

<div class="section">
    <div class="section-title">CONDITIONS FINANCIÈRES</div>
    <div class="terms-list">
        <p><strong>Droit d'entrée :</strong> <span class="amount">{{ number_format($contract->franchise_fee, 0, ',', ' ') }} €</span> TTC</p>
        <p><strong>Royalties :</strong> <span class="amount">{{ $contract->royalty_rate }}%</span> du chiffre d'affaires mensuel HT</p>
        <p><strong>Obligation d'achat :</strong> 80% minimum des approvisionnements auprès des entrepôts DRIV'N COOK</p>
        <p><strong>Crédit initial :</strong> 5 000 € pour les premiers achats</p>
    </div>
</div>

<div class="section">
    <div class="section-title">DURÉE DU CONTRAT</div>
    <p>
        <strong>Date de début :</strong> {{ $contract->start_date->format('d/m/Y') }}<br>
        <strong>Date de fin :</strong> {{ $contract->end_date->format('d/m/Y') }}<br>
        <strong>Durée :</strong> {{ $contract->start_date->diffInYears($contract->end_date) }} année(s)
    </p>
</div>

<div class="section">
    <div class="section-title">OBLIGATIONS DU FRANCHISÉ</div>
    <div class="terms-list">
        <p>• Respecter les standards de qualité et d'hygiène DRIV'N COOK</p>
        <p>• Effectuer 80% minimum des achats auprès des entrepôts agréés</p>
        <p>• Déclarer mensuellement son chiffre d'affaires</p>
        <p>• Payer les royalties avant le 15 de chaque mois</p>
        <p>• Suivre la formation initiale obligatoire</p>
        <p>• Respecter l'image de marque et les procédures opérationnelles</p>
        <p>• Maintenir la confidentialité du savoir-faire</p>
    </div>
</div>

<div class="section">
    <div class="section-title">OBLIGATIONS DU FRANCHISEUR</div>
    <div class="terms-list">
        <p>• Fournir la formation initiale et continue</p>
        <p>• Assurer l'approvisionnement via les 4 entrepôts franciliens</p>
        <p>• Garantir l'exclusivité territoriale définie</p>
        <p>• Fournir le support marketing et commercial</p>
        <p>• Assurer la maintenance des équipements</p>
        <p>• Mettre à disposition les outils de gestion</p>
    </div>
</div>

<div class="section">
    <div class="section-title">TERRITOIRE ET EXCLUSIVITÉ</div>
    <p>
        <strong>Zone d'exploitation exclusive :</strong> {{ $franchisee->desired_zone }}<br>
        Le franchisé bénéficie de l'exclusivité territoriale dans un rayon de 5 km
        autour de sa zone d'implantation principale.
    </p>
</div>

<div class="section">
    <div class="section-title">MODALITÉS DE PAIEMENT</div>
    <div class="terms-list">
        <p>• Droit d'entrée : payable dans les 30 jours suivant la signature</p>
        <p>• Royalties : paiement mensuel automatique avant le 15 de chaque mois</p>
        <p>• Pénalités de retard : 2% par mois de retard</p>
        <p>• Achats de stock : paiement à 30 jours ou crédit selon accord</p>
    </div>
</div>

<div class="section">
    <div class="section-title">RÉSILIATION</div>
    <p>
        Le présent contrat peut être résilié en cas de manquement grave aux obligations
        contractuelles, après mise en demeure restée sans effet pendant 30 jours.
    </p>
</div>

<div class="signature-section">
    <div class="signature-box">
        <div><strong>LE FRANCHISEUR</strong></div>
        <div>DRIV'N COOK SAS</div>
        <div class="signature-line">
            Signature et cachet<br>
            {{ now()->format('d/m/Y') }}
        </div>
    </div>
    <div class="signature-box">
        <div><strong>LE FRANCHISÉ</strong></div>
        <div>{{ $franchisee->first_name }} {{ $franchisee->last_name }}</div>
        <div class="signature-line">
            Signature<br>
            "Lu et approuvé"
        </div>
    </div>
</div>

<div class="footer">
    <p>
        Contrat généré automatiquement le {{ now()->format('d/m/Y à H:i:s') }} -
        DRIV'N COOK SAS - 123 Avenue de la République, 75012 Paris<br>
        Numéro de contrat : {{ $contract->contract_number }}
    </p>
</div>
</body>
</html>
