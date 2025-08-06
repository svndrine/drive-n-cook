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
        Schema::create('franchisee_revenues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Franchisé

            // Période de déclaration
            $table->enum('period_type', ['monthly', 'quarterly']);
            $table->year('period_year');
            $table->tinyInteger('period_month')->nullable(); // 1-12 pour mensuel
            $table->tinyInteger('period_quarter')->nullable(); // 1-4 pour trimestriel

            // Chiffres d'affaires
            $table->decimal('declared_revenue', 12, 2);
            $table->decimal('verified_revenue', 12, 2)->nullable(); // Après vérification admin

            // Calculs
            $table->decimal('royalty_rate', 5, 2); // 4.00%
            $table->decimal('calculated_royalty', 12, 2);

            // Statut
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'disputed'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');

            // Documents justificatifs
            $table->json('supporting_documents')->nullable(); // Chemins vers fichiers

            $table->timestamps();

            $table->unique(['user_id', 'period_type', 'period_year', 'period_month', 'period_quarter'], 'unique_franchisee_period');
            $table->index('status');
            $table->index(['period_year', 'period_month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('franchisee_revenues');
    }
};
