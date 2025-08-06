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
        Schema::create('franchisee_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Franchisé

            // Soldes
            $table->decimal('current_balance', 12, 2)->default(0.00); // Solde actuel
            $table->decimal('available_credit', 12, 2)->default(0.00); // Crédit disponible
            $table->decimal('total_spent', 12, 2)->default(0.00); // Total dépensé historique
            $table->decimal('total_royalties_paid', 12, 2)->default(0.00);

            // Statut financier
            $table->enum('account_status', ['active', 'suspended', 'blocked'])->default('active');
            $table->decimal('credit_limit', 12, 2)->default(0.00);

            // Dernière mise à jour
            $table->timestamp('last_transaction_at')->nullable();
            $table->timestamps();

            $table->unique('user_id'); // Un seul compte par franchisé
            $table->index('account_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('franchisee_accounts');
    }
};
