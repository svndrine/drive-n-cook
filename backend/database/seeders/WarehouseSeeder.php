<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Warehouse;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        $warehouses = [
            [
                'name' => 'Entrepôt Paris Nord',
                'code' => 'IDF-01',
                'address' => '15 Avenue Jean Jaurès',
                'city' => 'Saint-Denis',
                'postal_code' => '93200',
                'phone' => '01.48.13.25.47',
                'email' => 'nord@drivncook.fr',
                'latitude' => 48.9356,
                'longitude' => 2.3539,
                'opening_hours' => [
                    'monday' => ['open' => '07:00', 'close' => '19:00'],
                    'tuesday' => ['open' => '07:00', 'close' => '19:00'],
                    'wednesday' => ['open' => '07:00', 'close' => '19:00'],
                    'thursday' => ['open' => '07:00', 'close' => '19:00'],
                    'friday' => ['open' => '07:00', 'close' => '19:00'],
                    'saturday' => ['open' => '08:00', 'close' => '17:00'],
                    'sunday' => ['closed' => true]
                ],
                'is_active' => true
            ],
            [
                'name' => 'Entrepôt Paris Est',
                'code' => 'IDF-02',
                'address' => '42 Boulevard de Courcelles',
                'city' => 'Montreuil',
                'postal_code' => '93100',
                'phone' => '01.48.57.12.89',
                'email' => 'est@drivncook.fr',
                'latitude' => 48.8618,
                'longitude' => 2.4411,
                'opening_hours' => [
                    'monday' => ['open' => '07:00', 'close' => '19:00'],
                    'tuesday' => ['open' => '07:00', 'close' => '19:00'],
                    'wednesday' => ['open' => '07:00', 'close' => '19:00'],
                    'thursday' => ['open' => '07:00', 'close' => '19:00'],
                    'friday' => ['open' => '07:00', 'close' => '19:00'],
                    'saturday' => ['open' => '08:00', 'close' => '17:00'],
                    'sunday' => ['closed' => true]
                ],
                'is_active' => true
            ],
            [
                'name' => 'Entrepôt Paris Ouest',
                'code' => 'IDF-03',
                'address' => '8 Rue de la République',
                'city' => 'Nanterre',
                'postal_code' => '92000',
                'phone' => '01.47.25.68.91',
                'email' => 'ouest@drivncook.fr',
                'latitude' => 48.8924,
                'longitude' => 2.2069,
                'opening_hours' => [
                    'monday' => ['open' => '07:00', 'close' => '19:00'],
                    'tuesday' => ['open' => '07:00', 'close' => '19:00'],
                    'wednesday' => ['open' => '07:00', 'close' => '19:00'],
                    'thursday' => ['open' => '07:00', 'close' => '19:00'],
                    'friday' => ['open' => '07:00', 'close' => '19:00'],
                    'saturday' => ['open' => '08:00', 'close' => '17:00'],
                    'sunday' => ['closed' => true]
                ],
                'is_active' => true
            ],
            [
                'name' => 'Entrepôt Paris Sud',
                'code' => 'IDF-04',
                'address' => '25 Avenue du Général Leclerc',
                'city' => 'Villejuif',
                'postal_code' => '94800',
                'phone' => '01.46.78.34.52',
                'email' => 'sud@drivncook.fr',
                'latitude' => 48.7944,
                'longitude' => 2.3675,
                'opening_hours' => [
                    'monday' => ['open' => '07:00', 'close' => '19:00'],
                    'tuesday' => ['open' => '07:00', 'close' => '19:00'],
                    'wednesday' => ['open' => '07:00', 'close' => '19:00'],
                    'thursday' => ['open' => '07:00', 'close' => '19:00'],
                    'friday' => ['open' => '07:00', 'close' => '19:00'],
                    'saturday' => ['open' => '08:00', 'close' => '17:00'],
                    'sunday' => ['closed' => true]
                ],
                'is_active' => true
            ]
        ];

        foreach ($warehouses as $warehouse) {
            Warehouse::create($warehouse);
        }

        $this->command->info('4 entrepôts créés avec succès !');
    }
}
