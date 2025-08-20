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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique(); // FAC-202501-001
            $table->foreignId('transaction_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Montants
            $table->decimal('amount_ht', 10, 2); // Montant hors taxes
            $table->decimal('vat_amount', 10, 2); // Montant TVA
            $table->decimal('amount_ttc', 10, 2); // Montant TTC
            $table->decimal('vat_rate', 5, 2)->default(20.00); // Taux TVA (20%)

            // Dates
            $table->date('issue_date'); // Date d'émission
            $table->date('due_date'); // Date d'échéance
            $table->timestamp('paid_at')->nullable(); // Date de paiement
            $table->timestamp('sent_at')->nullable(); // Date d'envoi par email

            // Statut et fichiers
            $table->enum('status', ['pending', 'paid', 'cancelled'])->default('pending');
            $table->string('pdf_path')->nullable(); // Chemin vers le PDF
            $table->text('notes')->nullable(); // Notes additionnelles

            $table->timestamps();
            $table->softDeletes();

            // Index pour les recherches fréquentes
            $table->index(['user_id', 'status']);
            $table->index(['issue_date']);
            $table->index(['due_date']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
