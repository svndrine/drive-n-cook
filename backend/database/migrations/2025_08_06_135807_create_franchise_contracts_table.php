<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('franchise_contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Lien vers users (franchisés)
            $table->string('contract_number', 100)->unique();

            // Détails financiers du contrat
            $table->decimal('franchise_fee', 10, 2)->default(50000.00);
            $table->decimal('royalty_rate', 5, 2)->default(4.00); // 4%
            $table->decimal('stock_requirement_rate', 5, 2)->default(80.00); // 80%

            // Dates du contrat
            $table->timestamp('signed_at')->nullable();
            $table->timestamp('start_date');
            $table->timestamp('end_date')->nullable();

            // Statut
            $table->enum('status', ['draft', 'sent', 'signed', 'active', 'suspended', 'terminated'])->default('draft');

            // Documents
            $table->string('contract_pdf_path', 500)->nullable();
            $table->json('signature_data')->nullable(); // Signature électronique

            // Informations sur le camion assigné
            $table->string('truck_model', 100)->nullable();
            $table->string('truck_registration', 50)->nullable();
            $table->date('truck_delivery_date')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('contract_number');
            $table->index(['start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('franchise_contracts');
    }
};
