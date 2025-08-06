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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Franchisé
            $table->foreignId('payment_type_id')->constrained('payment_types');
            $table->string('transaction_reference', 100)->unique(); // REF unique pour traçabilité
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('EUR');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'])->default('pending');
            $table->enum('payment_method', ['stripe', 'bank_transfer', 'sepa', 'check', 'cash']);

            // Stripe/Payment provider data
            $table->string('stripe_payment_intent_id')->nullable();
            $table->string('stripe_payment_method_id')->nullable();
            $table->string('provider_transaction_id')->nullable();

            // Dates importantes
            $table->timestamp('initiated_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('due_date')->nullable(); // Pour les échéances

            // Métadonnées
            $table->text('description');
            $table->json('metadata')->nullable(); // Stockage flexible pour données spécifiques

            // Liens
            $table->foreignId('parent_transaction_id')->nullable()->constrained('transactions'); // Pour les remboursements
            $table->foreignId('franchise_contract_id')->nullable()->constrained('franchise_contracts');

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('transaction_reference');
            $table->index(['due_date', 'completed_at']);
            $table->index('stripe_payment_intent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
