<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $paymentTypes = [
            [
                'code' => 'FRANCHISE_FEE',
                'name' => 'Droit d\'entrée franchise',
                'description' => 'Paiement unique de 50 000€ pour devenir franchisé Driv\'n Cook',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'MONTHLY_ROYALTY',
                'name' => 'Royalties mensuelles',
                'description' => '4% du chiffre d\'affaires mensuel déclaré',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'STOCK_PURCHASE',
                'name' => 'Achat de stock',
                'description' => 'Commandes de stock auprès des entrepôts (minimum 80% obligatoire)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'TRUCK_MAINTENANCE',
                'name' => 'Maintenance camion',
                'description' => 'Frais de maintenance et réparation des camions food-truck',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'CREDIT_ADJUSTMENT',
                'name' => 'Ajustement de crédit',
                'description' => 'Ajustement manuel du solde du compte franchisé par un administrateur',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'PENALTY',
                'name' => 'Pénalité',
                'description' => 'Pénalité pour non-respect des conditions contractuelles (stock 80%, royalties, etc.)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'DEPOSIT',
                'name' => 'Dépôt de garantie',
                'description' => 'Dépôt de garantie pour la location du camion et équipements',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'code' => 'TRAINING_FEE',
                'name' => 'Formation initiale',
                'description' => 'Frais de formation obligatoire pour nouveaux franchisés',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ];

        // Utilisation d'upsert pour éviter les doublons lors des re-exécutions
        DB::table('payment_types')->upsert(
            $paymentTypes,
            ['code'], // Colonne unique pour détecter les doublons
            ['name', 'description', 'is_active', 'updated_at'] // Colonnes à mettre à jour si doublon
        );

        $this->command->info('Types de paiements insérés avec succès!');
    }
}
