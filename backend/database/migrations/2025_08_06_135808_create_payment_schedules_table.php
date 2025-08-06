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
        Schema::create('payment_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Franchisé
            $table->foreignId('franchise_contract_id')->constrained()->onDelete('cascade');

            // Détails de l'échéance
            $table->enum('schedule_type', ['monthly_royalty', 'quarterly_royalty', 'annual_fee']);
            $table->decimal('amount', 10, 2);
            $table->timestamp('due_date');

            // Calcul automatique (pour les royalties basées sur CA)
            $table->date('revenue_period_start')->nullable(); // Période de référence pour le CA
            $table->date('revenue_period_end')->nullable();
            $table->decimal('calculated_revenue', 12, 2)->nullable(); // CA de la période

            // Statut
            $table->enum('status', ['pending', 'sent', 'paid', 'overdue', 'cancelled'])->default('pending');
            $table->foreignId('transaction_id')->nullable()->constrained('transactions'); // Lien vers transaction une fois payé

            // Relances
            $table->integer('reminder_sent_count')->default(0);
            $table->timestamp('last_reminder_sent_at')->nullable();

            $table->timestamps();

            $table->index('due_date');
            $table->index('status');
            $table->index(['user_id', 'due_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_schedules');
    }
};
