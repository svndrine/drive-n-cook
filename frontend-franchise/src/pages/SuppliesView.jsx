// src/pages/SuppliesView.jsx
import React from 'react';
import { Package, List, RefreshCcw } from 'lucide-react';

/**
 * Vue pour l'approvisionnement en stock.
 * Maquette avec des sections pour passer une nouvelle commande et suivre les commandes passées.
 */
function SuppliesView() {
    const orders = [
        { id: 1, date: '10/10/2024', status: 'En cours', total: '250.00 €' },
        { id: 2, date: '01/10/2024', status: 'Livrée', total: '320.50 €' },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Gestion de l'approvisionnement</h2>

            {/* Section pour passer une nouvelle commande */}
            <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <h3 className="flex items-center text-xl font-medium mb-2"><Package size={20} className="mr-2" /> Nouvelle commande</h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Passez une commande de stock auprès des entrepôts pour votre food truck.
                </p>
                <button className="mt-4 px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
                    Passer une commande
                </button>
            </div>

            {/* Section de suivi des commandes */}
            <div>
                <h3 className="flex items-center text-xl font-medium mb-4"><List size={20} className="mr-2" /> Suivi de mes commandes</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID Commande</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{order.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{order.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'Livrée' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {order.status}
                                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{order.total}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default SuppliesView;
