<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Contrat de Franchise - {{ $contract->contract_number }}</title>
    <style>
        @page {
            margin: 2cm;
            @top-center {
                content: "Contrat de Franchise Driv'n Cook";
            }
            @bottom-center {
                content: "Page " counter(page) " sur " counter(pages);
            }
        }

        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            font-size: 11pt;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
        }

        .company-logo {
            font-size: 24pt;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
        }

        .contract-title {
            font-size: 18pt;
            font-weight: bold;
            margin: 20px 0;
        }

        .contract-number {
            font-size: 12pt;
            color: #666;
            margin-bottom: 30px;
        }

        .parties {
            margin: 30px 0;
        }

        .party {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            background: #f9f9f9;
        }

        .party-title {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 10px;
            color: #007bff;
        }

        .article {
            margin: 25px 0;
            page-break-inside: avoid;
        }

        .article-title {
            font-size: 12pt;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }

        .clause {
            margin: 15px 0;
            text-align: justify;
        }

        .amount {
            font-weight: bold;
            color: #d32f2f;
        }

        .signature-section {
            margin-top: 50px;
            page-break-inside: avoid;
        }

        .signature-box {
            border: 1px solid #333;
            padding: 20px;
            margin: 20px 0;
            min-height: 80px;
        }

        .signature-line {
            border-bottom: 1px solid #333;
            width: 200px;
            margin: 20px 0 10px 0;
        }

        .page-break {
            page-break-before: always;
        }

        .footer-info {
            font-size: 9pt;
            color: #666;
            margin-top: 30px;
            text-align: center;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
    </style>
</head>
<body>
<div class="header">
    <div class="company-logo">🚚 DRIV'N COOK</div>
    <div class="contract-title">CONTRAT DE FRANCHISE</div>
    <div class="contract-number">N° {{ $contract->contract_number }}</div>
    <div>Date d'établissement : {{ $contract->created_at->format('d/m/Y') }}</div>
</div>

<div class="parties">
    <div class="party">
        <div class="party-title">LE FRANCHISEUR :</div>
        <strong>DRIV'N COOK</strong><br>
        Société par Actions Simplifiée au capital de 150 000 €<br>
        Siège social : 12ème arrondissement, Paris<br>
        SIRET : 123 456 789 00012<br>
        Représentée par son Président, M. Jean MARTIN
    </div>

    <div class="party">
        <div class="party-title">LE FRANCHISÉ :</div>
        <strong>{{ $franchisee->first_name }} {{ $franchisee->last_name }}</strong><br>
        Email : {{ $franchisee->user->email ?? $franchisee->email }}<br>
        @if($franchisee->address)
        Adresse : {{ $franchisee->address }}<br>
        {{ $franchisee->zip_code }} {{ $franchisee->city }}
        @endif
    </div>
</div>

<div class="article">
    <div class="article-title">ARTICLE 1 - OBJET DU CONTRAT</div>
    <div class="clause">
        Le présent contrat a pour objet l'octroi par DRIV'N COOK au Franchisé du droit d'exploiter
        un food truck sous l'enseigne et selon le concept DRIV'N COOK, dans le respect des normes,
        méthodes et standards définis par le Franchiseur.
    </div>
    <div class="clause">
        Le concept DRIV'N COOK consiste en l'exploitation d'un food truck proposant des plats de qualité,
        à base de produits frais, bruts et majoritairement locaux, avec un service de vente ambulante
        et de restauration rapide.
    </div>
</div>

<div class="article">
    <div class="article-title">ARTICLE 2 - ZONE D'EXPLOITATION</div>
    <div class="clause">
        Le Franchisé est autorisé à exploiter son activité dans la zone géographique suivante :
        {{ $franchisee->desired_zone ?? 'Île-de-France' }}.
    </div>
    <div class="clause">
        Cette zone d'exploitation est exclusive et le Franchiseur s'engage à ne pas autoriser
        d'autre franchisé dans cette zone pendant la durée du contrat.
    </div>
</div>

<div class="article">
    <div class="article-title">ARTICLE 3 - DURÉE DU CONTRAT</div>
    <div class="clause">
        Le présent contrat est conclu pour une durée de <strong>{{ $contract->end_date->diffInYears($contract->start_date) }} ans</strong>,
        à compter du {{ $contract->start_date->format('d/m/Y') }}
        et prendra fin le {{ $contract->end_date->format('d/m/Y') }}.
    </div>
    <div class="clause">
        Le contrat pourra être renouvelé par accord mutuel des parties, dans les mêmes conditions
        ou selon de nouvelles modalités à convenir.
    </div>
</div>

<div class="article">
    <div class="article-title">ARTICLE 4 - CONDITIONS FINANCIÈRES</div>

    <table>
        <tr>
            <th>Désignation</th>
            <th>Montant</th>
            <th>Modalités</th>
        </tr>
        <tr>
            <td>Droit d'entrée</td>
            <td class="amount">{{ number_format($contract->franchise_fee, 0, ',', ' ') }} €</td>
            <td>Payable à la signature du contrat</td>
        </tr>
        <tr>
            <td>Redevances mensuelles</td>
            <td class="amount">{{ $contract->royalty_rate }}% du CA HT</td>
            <td>Payable le 5 de chaque mois</td>
        </tr>
        <tr>
            <td>Achats obligatoires</td>
            <td class="amount">{{ $contract->stock_requirement_rate }}% minimum</td>
            <td>Auprès des entrepôts DRIV'N COOK</td>
        </tr>
    </table>

    <div class="clause">
        Le Franchisé s'engage à acheter au minimum {{ $contract->stock_requirement_rate }}% de ses stocks
        (ingrédients, plats préparés, boissons) auprès des entrepôts DRIV'N COOK.
        Les 20% restants peuvent être achetés librement.
    </div>
</div>

<div class="page-break"></div>

<div class="article">
    <div class="article-title">ARTICLE 5 - OBLIGATIONS DU FRANCHISEUR</div>
    <div class="clause">
        DRIV'N COOK s'engage à :
        <ul>
            <li>Fournir un food truck équipé et conforme aux standards de l'enseigne</li>
            <li>Assurer la formation initiale du Franchisé</li>
            <li>Fournir le savoir-faire et l'assistance technique</li>
            <li>Garantir l'approvisionnement via ses 4 entrepôts en Île-de-France</li>
            <li>Assurer la promotion de l'enseigne</li>
            <li>Respecter l'exclusivité territoriale accordée</li>
        </ul>
    </div>
</div>

<div class="article">
    <div class="article-title">ARTICLE 6 - OBLIGATIONS DU FRANCHISÉ</div>
    <div class="clause">
        Le Franchisé s'engage à :
        <ul>
            <li>Exploiter personnellement son food truck</li>
            <li>Respecter les standards de qualité et d'hygiène DRIV'N COOK</li>
            <li>Utiliser exclusivement les recettes et méthodes du Franchiseur</li>
            <li>Payer les redevances dans les délais impartis</li>
            <li>Respecter les obligations d'approvisionnement</li>
            <li>Maintenir la confidentialité du savoir-faire</li>
            <li>Participer aux actions promotionnelles</li>
        </ul>
    </div>
</div>

<div class="article">
    <div class="article-title">ARTICLE 7 - SYSTÈME DE FIDÉLITÉ</div>
    <div class="clause">
        Le Franchisé devra mettre en place le système de carte de fidélité numérique DRIV'N COOK,
        permettant aux clients de bénéficier de réductions, invitations à des dégustations,
        et prix réduits sur les produits.
    </div>
</div>

<div class="article">
    <div class="article-title">ARTICLE 8 - RÉSILIATION</div>
    <div class="clause">
        Le présent contrat pourra être résilié de plein droit par l'une ou l'autre des parties
        en cas de manquement grave aux obligations contractuelles, après mise en demeure
        restée sans effet pendant 30 jours.
    </div>
</div>

<div class="page-break"></div>

<div class="signature-section">
    <div class="article-title">SIGNATURES</div>

    <p>Fait à Paris, le {{ now()->format('d/m/Y') }}, en deux exemplaires originaux.</p>

    <table style="border: none;">
        <tr>
            <td style="border: none; width: 50%; vertical-align: top;">
                <div class="signature-box">
                    <strong>LE FRANCHISEUR</strong><br>
                    DRIV'N COOK<br>
                    Représenté par M. Jean MARTIN<br><br>

                    <div class="signature-line"></div>
                    <small>Signature et cachet</small>
                </div>
            </td>
            <td style="border: none; width: 50%; vertical-align: top;">
                <div class="signature-box">
                    <strong>LE FRANCHISÉ</strong><br>
                    {{ $franchisee->first_name }} {{ $franchisee->last_name }}<br><br>

                    @if($contract->signed_at)
                    <p><strong>✓ Signé électroniquement le {{ $contract->signed_at->format('d/m/Y à H:i') }}</strong></p>
                    @else
                    <div class="signature-line"></div>
                    <small>Signature</small>
                    @endif
                </div>
            </td>
        </tr>
    </table>
</div>

<div class="footer-info">
    <p>Contrat généré le {{ now()->format('d/m/Y à H:i') }}</p>
    <p>DRIV'N COOK - Société par Actions Simplifiée - Capital 150 000 € - SIRET : 123 456 789 00012</p>
</div>
</body>
</html>
