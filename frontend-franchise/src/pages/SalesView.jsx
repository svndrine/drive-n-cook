// src/pages/SalesView.jsx
import React from 'react';
import { TrendingUp, FileText } from 'lucide-react';

/**
 * Vue pour l'analyse des ventes.
 * Maquette avec des indicateurs clés et un bouton pour générer un PDF de l'historique.
 */
function SalesView() {
    // Données de maquette
    const salesData = {
        monthlyRevenue: '12 500 €',
        totalRevenue: '150 000 €',
        totalOrders: 1500
    };

    const handleGeneratePdf = () => {
        // Remplacez cette alerte par une modale ou une action plus élégante.
        // C'est juste un exemple pour l'instant.
        alert("Génération du PDF de l'historique des ventes...");
        // Logique de génération de PDF ici
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Analyse des ventes</h2>
            <div className="grid md:grid-cols-3 gap-6">
                {/* Indicateur de revenu mensuel */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="flex items-center text-xl font-medium mb-2"><TrendingUp size={20} className="mr-2" /> Revenu mensuel</h3>
                    <p className="text-3xl font-bold text-indigo-600">{salesData.monthlyRevenue}</p>
                </div>

                {/* Indicateur de revenu total */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="flex items-center text-xl font-medium mb-2"><TrendingUp size={20} className="mr-2" /> Revenu total</h3>
                    <p className="text-3xl font-bold text-green-600">{salesData.totalRevenue}</p>
                </div>

                {/* Indicateur du nombre total de commandes */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="flex items-center text-xl font-medium mb-2"><TrendingUp size={20} className="mr-2" /> Total des commandes</h3>
                    <p className="text-3xl font-bold text-orange-500">{salesData.totalOrders}</p>
                </div>
            </div>

            {/* Bouton pour générer le PDF */}
            <div className="mt-8">
                <button
                    onClick={handleGeneratePdf}
                    className="flex items-center px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                >
                    <FileText size={20} className="mr-2" />
                    Générer l'historique des ventes (PDF)
                </button>
            </div>
        </div>
    );
}

export default SalesView;
