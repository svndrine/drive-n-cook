<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // D'abord les entrepôts
            WarehouseSeeder::class,

            // Puis les catégories et produits
            ProductCategorySeeder::class,
            ProductSeeder::class,

            // Ensuite les stocks (qui dépendent des entrepôts et produits)
            WarehouseStockSeeder::class,
        ]);

        $this->command->info('🎉 Tous les seeders exécutés avec succès !');
        $this->command->info('');
        $this->command->info('✅ Données créées :');
        $this->command->info('   - 4 entrepôts d\'Île-de-France');
        $this->command->info('   - 5 catégories de produits');
        $this->command->info('   - ~20 produits (80% obligatoires / 20% optionnels)');
        $this->command->info('   - Stocks dans tous les entrepôts');
        $this->command->info('   - Situations de test (ruptures, stocks faibles)');
        $this->command->info('');
        $this->command->info('🚀 Votre système est prêt à être testé !');
        $this->command->info('');
        $this->command->info('📋 Tests recommandés :');
        $this->command->info('   GET /api/warehouses - Lister les entrepôts');
        $this->command->info('   GET /api/products - Lister les produits');
        $this->command->info('   GET /api/products/warehouse/1/catalog - Catalogue entrepôt 1');
        $this->command->info('   GET /api/stock/alerts - Voir les alertes de stock');
        $this->command->info('   GET /api/warehouses/1/stocks - Stocks entrepôt 1');
    }
}
