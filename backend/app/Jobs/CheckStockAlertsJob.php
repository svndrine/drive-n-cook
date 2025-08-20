<?php
// app/Jobs/CheckStockAlertsJob.php
// Job qui s'exécute automatiquement pour vérifier les stocks

namespace App\Jobs;

use App\Models\WarehouseStock;
use App\Models\StockAlert;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckStockAlertsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle()
    {
        Log::info('Vérification automatique des alertes de stock...');

        // 1. Vérifier tous les stocks dans tous les entrepôts
        $stocks = WarehouseStock::with(['product', 'warehouse'])->get();

        foreach ($stocks as $stock) {
            $this->checkStockLevel($stock);
        }

        // 2. Nettoyer les anciennes alertes résolues
        $this->cleanupOldAlerts();

        Log::info('Vérification des alertes terminée');
    }

    private function checkStockLevel(WarehouseStock $stock)
    {
        $product = $stock->product;
        $currentStock = $stock->current_quantity;

        // Vérifier si une alerte existe déjà pour ce stock
        $existingAlert = StockAlert::where('warehouse_id', $stock->warehouse_id)
            ->where('product_id', $stock->product_id)
            ->where('status', 'active')
            ->first();

        $alertType = null;
        $severity = null;

        // 1. Rupture de stock (stock = 0)
        if ($currentStock <= 0) {
            $alertType = 'out_of_stock';
            $severity = 'critical';
        }
        // 2. Stock faible (en dessous du minimum)
        elseif ($currentStock <= $product->stock_minimum) {
            $alertType = 'low_stock';
            // Calculer la sévérité selon le niveau
            $percentageOfMin = ($currentStock / $product->stock_minimum) * 100;
            if ($percentageOfMin <= 25) {
                $severity = 'high';
            } elseif ($percentageOfMin <= 50) {
                $severity = 'medium';
            } else {
                $severity = 'low';
            }
        }
        // 3. Stock excessif (au-dessus du maximum)
        elseif ($currentStock >= $product->stock_maximum) {
            $alertType = 'excess_stock';
            $percentageOverMax = (($currentStock - $product->stock_maximum) / $product->stock_maximum) * 100;
            if ($percentageOverMax >= 50) {
                $severity = 'high';
            } elseif ($percentageOverMax >= 25) {
                $severity = 'medium';
            } else {
                $severity = 'low';
            }
        }

        // Si aucune alerte nécessaire, supprimer l'alerte existante si elle existe
        if (!$alertType) {
            if ($existingAlert) {
                $existingAlert->update(['status' => 'resolved', 'resolved_at' => now()]);
            }
            return;
        }

        // Créer ou mettre à jour l'alerte
        if ($existingAlert) {
            // Mettre à jour l'alerte existante si le type ou la sévérité a changé
            if ($existingAlert->alert_type !== $alertType || $existingAlert->severity !== $severity) {
                $existingAlert->update([
                    'alert_type' => $alertType,
                    'severity' => $severity,
                    'updated_at' => now()
                ]);
            }
        } else {
            // Créer une nouvelle alerte
            StockAlert::create([
                'warehouse_id' => $stock->warehouse_id,
                'product_id' => $stock->product_id,
                'alert_type' => $alertType,
                'severity' => $severity,
                'current_stock' => $currentStock,
                'minimum_stock' => $product->stock_minimum,
                'maximum_stock' => $product->stock_maximum,
                'status' => 'active',
                'created_at' => now()
            ]);

            // Envoyer une notification si critique
            if ($severity === 'critical') {
                $this->sendCriticalAlert($stock, $alertType);
            }
        }
    }

    private function cleanupOldAlerts()
    {
        // Supprimer les alertes résolues de plus de 30 jours
        StockAlert::where('status', 'resolved')
            ->where('resolved_at', '<', now()->subDays(30))
            ->delete();
    }

    private function sendCriticalAlert(WarehouseStock $stock, string $alertType)
    {
        // Envoyer notification email aux admins
        $admins = \App\Models\User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            // Ici vous pouvez envoyer un email, une notification push, etc.
            Log::warning("Alerte critique: {$alertType} pour {$stock->product->name} dans {$stock->warehouse->name}");
        }
    }
}



