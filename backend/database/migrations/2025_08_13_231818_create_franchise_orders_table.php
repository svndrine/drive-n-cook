// database/migrations/xxxx_create_franchise_orders_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('franchise_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique(); // Ex: CMD-2025-001
            $table->foreignId('user_id')->constrained('users'); // Franchisé
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->enum('status', ['draft', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
                ->default('draft');
            $table->decimal('total_ht', 12, 2)->default(0);
            $table->decimal('total_tva', 12, 2)->default(0);
            $table->decimal('total_ttc', 12, 2)->default(0);
            $table->decimal('mandatory_percentage', 5, 2)->nullable(); // % produits obligatoires
            $table->boolean('ratio_80_20_respected')->default(false);
            $table->datetime('delivery_date')->nullable();
            $table->text('delivery_address')->nullable();
            $table->text('notes')->nullable();
            $table->datetime('confirmed_at')->nullable();
            $table->datetime('delivered_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('franchise_orders');
    }
};
