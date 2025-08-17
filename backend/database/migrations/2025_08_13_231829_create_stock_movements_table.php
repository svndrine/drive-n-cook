// database/migrations/xxxx_create_stock_movements_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses');
            $table->foreignId('product_id')->constrained('products');
            $table->enum('type', ['in', 'out', 'adjustment', 'transfer']);
            $table->integer('quantity'); // Positif pour entrée, négatif pour sortie
            $table->integer('quantity_before'); // Stock avant mouvement
            $table->integer('quantity_after'); // Stock après mouvement
            $table->string('reference')->nullable(); // Référence (commande, bon de livraison, etc.)
            $table->foreignId('order_id')->nullable()->constrained('franchise_orders'); // Si lié à une commande
            $table->text('reason')->nullable(); // Motif du mouvement
            $table->foreignId('user_id')->nullable()->constrained('users'); // Qui a fait le mouvement
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('stock_movements');
    }
};
