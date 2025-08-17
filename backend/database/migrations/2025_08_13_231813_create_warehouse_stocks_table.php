// database/migrations/xxxx_create_warehouse_stocks_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('warehouse_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->integer('quantity')->default(0);
            $table->integer('reserved_quantity')->default(0); // Quantité réservée pour commandes
            $table->date('last_restock_date')->nullable();
            $table->timestamps();

            // Une seule ligne par produit/entrepôt
            $table->unique(['warehouse_id', 'product_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('warehouse_stocks');
    }
};
