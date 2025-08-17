// database/migrations/xxxx_create_warehouses_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 10)->unique(); // Ex: "IDF-01"
            $table->text('address');
            $table->string('city');
            $table->string('postal_code', 10);
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->json('opening_hours')->nullable(); // Horaires d'ouverture
            $table->boolean('is_active')->default(true);
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('warehouses');
    }
};
