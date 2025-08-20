<?php
// database/migrations/xxxx_xx_xx_xxxxxx_create_stock_alerts_table.php

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
        Schema::create('stock_alerts', function (Blueprint $table) {
            $table->id();

            // Relations avec les autres tables
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');

            // Type et sévérité de l'alerte
            $table->enum('alert_type', ['out_of_stock', 'low_stock', 'excess_stock']);
            $table->enum('severity', ['critical', 'high', 'medium', 'low']);

            // Données de stock au moment de l'alerte
            $table->integer('current_stock');
            $table->integer('minimum_stock');
            $table->integer('maximum_stock');

            // Statut et gestion de l'alerte
            $table->enum('status', ['active', 'resolved', 'dismissed'])->default('active');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('dismissed_at')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');

            // Notes et commentaires
            $table->text('notes')->nullable();
            $table->text('action_taken')->nullable(); // Action prise pour résoudre l'alerte

            // Métadonnées
            $table->integer('days_since_last_alert')->default(0); // Nombre de jours depuis la dernière alerte similaire
            $table->boolean('notification_sent')->default(false); // Si une notification a été envoyée
            $table->timestamp('last_notification_at')->nullable();

            $table->timestamps();

            // Index pour optimiser les requêtes
            $table->index(['warehouse_id', 'product_id', 'status'], 'warehouse_product_status_idx');
            $table->index(['alert_type', 'severity'], 'type_severity_idx');
            $table->index(['status', 'created_at'], 'status_created_idx');
            $table->index(['severity', 'created_at'], 'severity_created_idx');

            // Index composé pour les requêtes fréquentes
            $table->index(['status', 'alert_type', 'severity'], 'status_type_severity_idx');

            // Contrainte unique pour éviter les doublons d'alertes actives
            $table->unique(['warehouse_id', 'product_id', 'alert_type'], 'unique_active_alert');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_alerts');
    }
};
