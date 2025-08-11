// src/pages/TruckView.jsx
import React from 'react';
import { MapPin, Wrench, FileText } from 'lucide-react';

/**
 * Vue pour la gestion du parc de camions.
 * Version de maquette avec des sections pour l'emplacement, les pannes et le carnet d'entretien.
 */
function TruckView() {
    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Gestion des camions</h2>
            <div className="grid md:grid-cols-3 gap-6">
                {/* Carte de suivi de l'emplacement */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="flex items-center text-xl font-medium mb-2"><MapPin size={20} className="mr-2" /> Localisation du camion</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        {/* Remplacez par une carte interactive ou des coordonnées dynamiques */}
                        Votre camion est actuellement localisé à : <span className="font-bold">48.8566° N, 2.3522° E (Paris)</span>
                    </p>
                </div>

                {/* Déclaration et gestion des pannes */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="flex items-center text-xl font-medium mb-2"><Wrench size={20} className="mr-2" /> Déclarer une panne</h3>
                    <button className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                        Signaler une panne
                    </button>
                    <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li><span className="font-bold">Panne récente :</span> Fuite d'huile - Signalée le 05/10/2024</li>
                        <li><span className="font-bold">Statut :</span> En attente d'intervention</li>
                    </ul>
                </div>

                {/* Accès au carnet d'entretien */}
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h3 className="flex items-center text-xl font-medium mb-2"><FileText size={20} className="mr-2" /> Carnet d'entretien</h3>
                    <p className="text-gray-600 dark:text-gray-400">Consultez l'historique de toutes les maintenances de votre camion.</p>
                    <button className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                        Voir le carnet d'entretien
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TruckView;
