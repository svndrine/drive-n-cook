// database/migrations/xxxx_create_products_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique(); // Code produit
            $table->text('description')->nullable();
            $table->foreignId('category_id')->constrained('product_categories');
            $table->enum('type', ['ingredient', 'prepared_dish', 'beverage']);
            $table->decimal('purchase_price', 10, 2); // Prix d'achat HT
            $table->decimal('selling_price', 10, 2); // Prix de vente aux franchisés HT
            $table->string('unit', 20); // kg, L, pièce, etc.
            $table->decimal('vat_rate', 5, 2)->default(20.00); // TVA en %
            $table->boolean('is_mandatory')->default(false); // Produit obligatoire (80%)
            $table->boolean('is_active')->default(true);
            $table->integer('minimum_stock')->default(0); // Stock minimum
            $table->integer('maximum_stock')->nullable(); // Stock maximum
            $table->json('allergens')->nullable(); // Allergènes
            $table->string('image_url')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('products');
    }
};
