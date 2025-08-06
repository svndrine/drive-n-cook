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
        Schema::create('account_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Franchisé
            $table->foreignId('transaction_id')->nullable()->constrained('transactions'); // Lien vers transaction si applicable

            // Détails du mouvement
            $table->enum('movement_type', ['debit', 'credit']);
            $table->decimal('amount', 12, 2);
            $table->decimal('balance_before', 12, 2);
            $table->decimal('balance_after', 12, 2);

            // Description
            $table->text('description');
            $table->string('category', 100)->nullable(); // 'royalty', 'stock_purchase', 'credit_adjustment', etc.

            // Traçabilité
            $table->foreignId('created_by')->nullable()->constrained('users'); // Admin qui a fait l'opération manuelle
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index('transaction_id');
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_movements');
    }
};
