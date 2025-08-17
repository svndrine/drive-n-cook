// database/migrations/xxxx_create_franchise_order_items_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('franchise_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('franchise_orders')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products');
            $table->integer('quantity');
            $table->decimal('unit_price_ht', 10, 2); // Prix unitaire HT au moment de la commande
            $table->decimal('total_ht', 10, 2); // Total ligne HT
            $table->decimal('vat_rate', 5, 2); // TVA au moment de la commande
            $table->decimal('total_tva', 10, 2); // Total TVA ligne
            $table->decimal('total_ttc', 10, 2); // Total ligne TTC
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('franchise_order_items');
    }
};
