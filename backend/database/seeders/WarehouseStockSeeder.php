<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Warehouse;
use App\Models\Product;
use App\Models\WarehouseStock;
use App\Models\StockMovement;

class WarehouseStockSeeder extends Seeder
{
    public function run(): void
    {
        $warehouses = Warehouse::all();
        $products = Product::all();

        $this->command->info('Création des stocks initiaux...');

        foreach ($warehouses as $warehouse) {
            $this->command->info("Entrepôt: {$warehouse->name}");

            foreach ($products as $product) {
                // Générer une quantité aléatoire entre le stock minimum et maximum
                $minStock = $product->minimum_stock;
                $maxStock = $product->maximum_stock ?? ($minStock * 3);

                // Variation par entrepôt pour rendre réaliste
                $baseQuantity = rand($minStock, $maxStock);

                // Quelques entrepôts ont plus ou moins de stock
                switch ($warehouse->code) {
                    case 'IDF-01': // Paris Nord - entrepôt principal
                        $quantity = $baseQuantity * 1.2;
                        break;
                    case 'IDF-02': // Paris Est
                        $quantity = $baseQuantity * 0.8;
                        break;
                    case 'IDF-03': // Paris Ouest
                        $quantity = $baseQuantity * 1.1;
                        break;
                    case 'IDF-04': // Paris Sud
                        $quantity = $baseQuantity * 0.9;
                        break;
                    default:
                        $quantity = $baseQuantity;
                }

                $quantity = max($minStock, round($quantity));

                // Créer le stock
                $stock = WarehouseStock::create([
                    'warehouse_id' => $warehouse->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'reserved_quantity' => 0,
                    'last_restock_date' => now()->subDays(rand(1, 30))
                ]);

                // Créer un mouvement de stock initial
                StockMovement::create([
                    'warehouse_id' => $warehouse->id,
                    'product_id' => $product->id,
                    'type' => 'in',
                    'quantity' => $quantity,
                    'quantity_before' => 0,
                    'quantity_after' => $quantity,
                    'reason' => 'Stock initial - Ouverture entrepôt',
                    'reference' => 'INIT-' . $warehouse->code,
                    'user_id' => null
                ]);
            }
        }

        // Créer quelques situations spéciales pour tester les alertes
        $this->createSpecialStockSituations();

        $totalStocks = WarehouseStock::count();
        $this->command->info("$totalStocks stocks créés avec succès !");
        $this->command->info('Situations spéciales créées pour tester les alertes.');
    }

    private function createSpecialStockSituations(): void
    {
        // Créer quelques ruptures de stock
        $outOfStockProducts = Product::inRandomOrder()->take(3)->get();
        foreach ($outOfStockProducts as $product) {
            $warehouse = Warehouse::inRandomOrder()->first();
            $stock = WarehouseStock::where('warehouse_id', $warehouse->id)
                ->where('product_id', $product->id)
                ->first();

            if ($stock) {
                $oldQuantity = $stock->quantity;
                $stock->update(['quantity' => 0]);

                // Créer le mouvement de sortie
                StockMovement::create([
                    'warehouse_id' => $warehouse->id,
                    'product_id' => $product->id,
                    'type' => 'out',
                    'quantity' => -$oldQuantity,
                    'quantity_before' => $oldQuantity,
                    'quantity_after' => 0,
                    'reason' => 'Rupture de stock simulée pour test',
                    'user_id' => null
                ]);

                $this->command->warn("⚠️  Rupture créée: {$product->name} dans {$warehouse->name}");
            }
        }

        // Créer quelques stocks faibles
        $lowStockProducts = Product::inRandomOrder()->take(5)->get();
        foreach ($lowStockProducts as $product) {
            $warehouse = Warehouse::inRandomOrder()->first();
            $stock = WarehouseStock::where('warehouse_id', $warehouse->id)
                ->where('product_id', $product->id)
                ->first();

            if ($stock) {
                $oldQuantity = $stock->quantity;
                $newQuantity = max(1, $product->minimum_stock - rand(1, 3));
                $adjustment = $newQuantity - $oldQuantity;

                $stock->update(['quantity' => $newQuantity]);

                // Créer le mouvement d'ajustement
                StockMovement::create([
                    'warehouse_id' => $warehouse->id,
                    'product_id' => $product->id,
                    'type' => 'adjustment',
                    'quantity' => $adjustment,
                    'quantity_before' => $oldQuantity,
                    'quantity_after' => $newQuantity,
                    'reason' => 'Stock faible simulé pour test alertes',
                    'user_id' => null
                ]);

                $this->command->warn("🔶 Stock faible créé: {$product->name} dans {$warehouse->name} (stock: $newQuantity)");
            }
        }

        // Créer quelques réservations pour tester
        $reservedStocks = WarehouseStock::inRandomOrder()->take(8)->get();
        foreach ($reservedStocks as $stock) {
            $reserveQuantity = min($stock->quantity, rand(1, 10));
            $stock->update(['reserved_quantity' => $reserveQuantity]);

            $this->command->info("📦 Réservation créée: {$reserveQuantity} unités de {$stock->product->name}");
        }
    }
}
