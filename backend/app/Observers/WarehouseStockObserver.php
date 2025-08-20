<?php
// app/Observers/WarehouseStockObserver.php
// Observer pour déclencher la vérification lors des changements de stock

namespace App\Observers;

use App\Models\WarehouseStock;
use App\Jobs\CheckStockAlertsJob;

class WarehouseStockObserver
{
    public function updated(WarehouseStock $stock)
    {
        // Déclencher une vérification immédiate quand le stock change
        if ($stock->wasChanged('current_quantity')) {
            CheckStockAlertsJob::dispatch();
        }
    }
}
