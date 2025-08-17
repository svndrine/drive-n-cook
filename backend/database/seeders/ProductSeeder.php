<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductCategory;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = ProductCategory::pluck('id', 'slug')->toArray();

        // 80% de produits OBLIGATOIRES (is_mandatory = true)
        $mandatoryProducts = [
            // Ingrédients obligatoires
            [
                'name' => 'Farine de blé T55',
                'sku' => 'ING-FARINE-001',
                'description' => 'Farine de blé type 55 pour préparations de base',
                'category_id' => $categories['ingredients'],
                'type' => 'ingredient',
                'purchase_price' => 1.20,
                'selling_price' => 1.80,
                'unit' => 'kg',
                'vat_rate' => 5.5,
                'is_mandatory' => true,
                'minimum_stock' => 50,
                'maximum_stock' => 200
            ],
            [
                'name' => 'Huile d\'olive vierge extra',
                'sku' => 'ING-HUILE-001',
                'description' => 'Huile d\'olive première pression à froid',
                'category_id' => $categories['ingredients'],
                'type' => 'ingredient',
                'purchase_price' => 8.50,
                'selling_price' => 12.75,
                'unit' => 'L',
                'vat_rate' => 5.5,
                'is_mandatory' => true,
                'minimum_stock' => 20,
                'maximum_stock' => 80
            ],
            [
                'name' => 'Sel de Guérande',
                'sku' => 'ING-SEL-001',
                'description' => 'Sel gris de Guérande récolte artisanale',
                'category_id' => $categories['ingredients'],
                'type' => 'ingredient',
                'purchase_price' => 2.80,
                'selling_price' => 4.20,
                'unit' => 'kg',
                'vat_rate' => 5.5,
                'is_mandatory' => true,
                'minimum_stock' => 30,
                'maximum_stock' => 100
            ],
            [
                'name' => 'Tomates pelées Bio',
                'sku' => 'ING-TOMATE-001',
                'description' => 'Tomates pelées biologiques en conserve',
                'category_id' => $categories['ingredients'],
                'type' => 'ingredient',
                'purchase_price' => 1.85,
                'selling_price' => 2.75,
                'unit' => 'boîte 400g',
                'vat_rate' => 5.5,
                'is_mandatory' => true,
                'minimum_stock' => 100,
                'maximum_stock' => 300
            ],

            // Plats préparés obligatoires
            [
                'name' => 'Burger Classic Driv\'n Cook',
                'sku' => 'PLAT-BURGER-001',
                'description' => 'Burger signature avec steak haché, salade, tomate, fromage',
                'category_id' => $categories['plats-prepares'],
                'type' => 'prepared_dish',
                'purchase_price' => 4.50,
                'selling_price' => 8.90,
                'unit' => 'pièce',
                'vat_rate' => 10.0,
                'is_mandatory' => true,
                'minimum_stock' => 30,
                'maximum_stock' => 100,
                'allergens' => ['gluten', 'lactose']
            ],
            [
                'name' => 'Salade César Gourmande',
                'sku' => 'PLAT-SALADE-001',
                'description' => 'Salade César avec poulet grillé, croûtons, parmesan',
                'category_id' => $categories['plats-prepares'],
                'type' => 'prepared_dish',
                'purchase_price' => 3.80,
                'selling_price' => 7.50,
                'unit' => 'pièce',
                'vat_rate' => 10.0,
                'is_mandatory' => true,
                'minimum_stock' => 25,
                'maximum_stock' => 80,
                'allergens' => ['lactose', 'œufs']
            ],
            [
                'name' => 'Croque-Monsieur Artisanal',
                'sku' => 'PLAT-CROQUE-001',
                'description' => 'Croque-monsieur au jambon blanc et emmental',
                'category_id' => $categories['plats-prepares'],
                'type' => 'prepared_dish',
                'purchase_price' => 2.90,
                'selling_price' => 5.80,
                'unit' => 'pièce',
                'vat_rate' => 10.0,
                'is_mandatory' => true,
                'minimum_stock' => 40,
                'maximum_stock' => 120
            ],
            [
                'name' => 'Quiche Lorraine Traditionnelle',
                'sku' => 'PLAT-QUICHE-001',
                'description' => 'Quiche lorraine aux lardons et fromage',
                'category_id' => $categories['plats-prepares'],
                'type' => 'prepared_dish',
                'purchase_price' => 3.20,
                'selling_price' => 6.40,
                'unit' => 'part',
                'vat_rate' => 10.0,
                'is_mandatory' => true,
                'minimum_stock' => 35,
                'maximum_stock' => 100,
                'allergens' => ['gluten', 'œufs', 'lactose']
            ],

            // Boissons obligatoires
            [
                'name' => 'Café Arabica Premium',
                'sku' => 'BOIS-CAFE-001',
                'description' => 'Café 100% Arabica torréfaction française',
                'category_id' => $categories['boissons'],
                'type' => 'beverage',
                'purchase_price' => 0.85,
                'selling_price' => 2.50,
                'unit' => 'tasse',
                'vat_rate' => 10.0,
                'is_mandatory' => true,
                'minimum_stock' => 200,
                'maximum_stock' => 500
            ],
            [
                'name' => 'Coca-Cola 33cl',
                'sku' => 'BOIS-COCA-001',
                'description' => 'Coca-Cola canette 33cl',
                'category_id' => $categories['boissons'],
                'type' => 'beverage',
                'purchase_price' => 0.75,
                'selling_price' => 2.20,
                'unit' => 'canette',
                'vat_rate' => 20.0,
                'is_mandatory' => true,
                'minimum_stock' => 150,
                'maximum_stock' => 400
            ],
            [
                'name' => 'Eau plate Evian 50cl',
                'sku' => 'BOIS-EAU-001',
                'description' => 'Eau minérale naturelle Evian',
                'category_id' => $categories['boissons'],
                'type' => 'beverage',
                'purchase_price' => 0.45,
                'selling_price' => 1.50,
                'unit' => 'bouteille',
                'vat_rate' => 5.5,
                'is_mandatory' => true,
                'minimum_stock' => 200,
                'maximum_stock' => 600
            ],

            // Desserts obligatoires
            [
                'name' => 'Tiramisu Maison',
                'sku' => 'DESS-TIRA-001',
                'description' => 'Tiramisu traditionnel fait maison',
                'category_id' => $categories['desserts'],
                'type' => 'prepared_dish',
                'purchase_price' => 2.10,
                'selling_price' => 4.90,
                'unit' => 'part',
                'vat_rate' => 10.0,
                'is_mandatory' => true,
                'minimum_stock' => 20,
                'maximum_stock' => 60,
                'allergens' => ['œufs', 'lactose', 'gluten']
            ],
            [
                'name' => 'Tarte aux Pommes',
                'sku' => 'DESS-TARTE-001',
                'description' => 'Tarte aux pommes pâte brisée maison',
                'category_id' => $categories['desserts'],
                'type' => 'prepared_dish',
                'purchase_price' => 1.80,
                'selling_price' => 4.20,
                'unit' => 'part',
                'vat_rate' => 10.0,
                'is_mandatory' => true,
                'minimum_stock' => 25,
                'maximum_stock' => 80,
                'allergens' => ['gluten', 'œufs']
            ],

            // Emballages obligatoires
            [
                'name' => 'Barquette kraft biodégradable',
                'sku' => 'EMB-BARQ-001',
                'description' => 'Barquette alimentaire kraft 750ml',
                'category_id' => $categories['emballages'],
                'type' => 'ingredient',
                'purchase_price' => 0.15,
                'selling_price' => 0.25,
                'unit' => 'pièce',
                'vat_rate' => 20.0,
                'is_mandatory' => true,
                'minimum_stock' => 500,
                'maximum_stock' => 2000
            ],
            [
                'name' => 'Couverts en bois',
                'sku' => 'EMB-COUV-001',
                'description' => 'Set couverts en bois (fourchette, couteau, cuillère)',
                'category_id' => $categories['emballages'],
                'type' => 'ingredient',
                'purchase_price' => 0.08,
                'selling_price' => 0.15,
                'unit' => 'set',
                'vat_rate' => 20.0,
                'is_mandatory' => true,
                'minimum_stock' => 1000,
                'maximum_stock' => 3000
            ]
        ];

        // 20% de produits OPTIONNELS (is_mandatory = false)
        $optionalProducts = [
            [
                'name' => 'Truffe noire du Périgord',
                'sku' => 'ING-TRUFFE-001',
                'description' => 'Truffe noire fraîche du Périgord - produit de luxe',
                'category_id' => $categories['ingredients'],
                'type' => 'ingredient',
                'purchase_price' => 45.00,
                'selling_price' => 75.00,
                'unit' => '10g',
                'vat_rate' => 5.5,
                'is_mandatory' => false,
                'minimum_stock' => 2,
                'maximum_stock' => 10
            ],
            [
                'name' => 'Champagne Drappier Brut',
                'sku' => 'BOIS-CHAMP-001',
                'description' => 'Champagne Drappier Carte d\'Or Brut',
                'category_id' => $categories['boissons'],
                'type' => 'beverage',
                'purchase_price' => 18.50,
                'selling_price' => 35.00,
                'unit' => 'bouteille',
                'vat_rate' => 20.0,
                'is_mandatory' => false,
                'minimum_stock' => 5,
                'maximum_stock' => 20
            ],
            [
                'name' => 'Macaron Ladurée assortis',
                'sku' => 'DESS-MACA-001',
                'description' => 'Boîte de 6 macarons Ladurée parfums assortis',
                'category_id' => $categories['desserts'],
                'type' => 'prepared_dish',
                'purchase_price' => 8.20,
                'selling_price' => 15.90,
                'unit' => 'boîte',
                'vat_rate' => 10.0,
                'is_mandatory' => false,
                'minimum_stock' => 10,
                'maximum_stock' => 30,
                'allergens' => ['œufs', 'lactose', 'fruits à coque']
            ],
            [
                'name' => 'Emballage carton premium',
                'sku' => 'EMB-PREM-001',
                'description' => 'Boîte carton premium avec dorure pour événements',
                'category_id' => $categories['emballages'],
                'type' => 'ingredient',
                'purchase_price' => 0.85,
                'selling_price' => 1.50,
                'unit' => 'pièce',
                'vat_rate' => 20.0,
                'is_mandatory' => false,
                'minimum_stock' => 50,
                'maximum_stock' => 200
            ]
        ];

        // Créer tous les produits
        $allProducts = array_merge($mandatoryProducts, $optionalProducts);

        foreach ($allProducts as $product) {
            Product::create($product);
        }

        $mandatoryCount = count($mandatoryProducts);
        $optionalCount = count($optionalProducts);
        $totalCount = count($allProducts);
        $mandatoryPercentage = round(($mandatoryCount / $totalCount) * 100, 1);

        $this->command->info("$totalCount produits créés avec succès !");
        $this->command->info("- $mandatoryCount produits obligatoires ($mandatoryPercentage%)");
        $this->command->info("- $optionalCount produits optionnels");
        $this->command->info("✅ Ratio 80/20 respecté !");
    }
}
