<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductCategory;

class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Ingrédients',
                'slug' => 'ingredients',
                'description' => 'Ingrédients de base pour la préparation des plats (légumes, viandes, épices, etc.)',
                'icon' => '🥕',
                'sort_order' => 1,
                'is_active' => true
            ],
            [
                'name' => 'Plats Préparés',
                'slug' => 'plats-prepares',
                'description' => 'Plats cuisinés prêts à servir ou à réchauffer',
                'icon' => '🍽️',
                'sort_order' => 2,
                'is_active' => true
            ],
            [
                'name' => 'Boissons',
                'slug' => 'boissons',
                'description' => 'Boissons chaudes, froides, alcoolisées et non-alcoolisées',
                'icon' => '🥤',
                'sort_order' => 3,
                'is_active' => true
            ],
            [
                'name' => 'Desserts',
                'slug' => 'desserts',
                'description' => 'Desserts et pâtisseries',
                'icon' => '🍰',
                'sort_order' => 4,
                'is_active' => true
            ],
            [
                'name' => 'Emballages',
                'slug' => 'emballages',
                'description' => 'Emballages, couverts et accessoires de service',
                'icon' => '📦',
                'sort_order' => 5,
                'is_active' => true
            ]
        ];

        foreach ($categories as $category) {
            ProductCategory::create($category);
        }

        $this->command->info('5 catégories de produits créées avec succès !');
    }
}
