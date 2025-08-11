import React, { useState } from 'react'; // useEffect n'est plus nécessaire
import { Truck, ShoppingCart, BarChart2, MapPin, Wrench, FileText } from 'lucide-react';
// L'import de l'API est supprimé

// Les données sont maintenant définies directement dans le fichier.
const staticFranchiseeData = {
    user: {
        firstname: 'Jean',
        lastname: 'Dupont'
    },
    today_sales: '457,50',
    pending_orders: 2,
    truck_status: 'Opérationnel',
    truck_location: 'Paris 15e',
    account: {
        balance: '3,120.75'
    }
};

// Composant simple pour afficher une carte de données
const DataCard = ({ icon, title, value }) => (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer">
        {icon}
        <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        <p className="mt-2 text-2xl font-bold text-black dark:text-white">{value}</p>
    </div>
);

// Composant principal du tableau de bord du franchisé
function Home() {
    // On utilise directement les données statiques, plus besoin de setFranchiseeData
    const [franchiseeData] = useState(staticFranchiseeData);
    const [view, setView] = useState('overview');

    // Toute la logique de chargement (useEffect, loading, error) est supprimée

    const renderView = () => {
        switch (view) {
            case 'truck':
                return (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50">Gestion du camion</h2>
                        <p className="text-center text-gray-600 dark:text-gray-300">
                            Gérez votre camion : localisez-le, déclarez une panne ou consultez son carnet d'entretien.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <DataCard icon={<MapPin size={48} className="text-blue-500" />} title="Localisation" value={franchiseeData.truck_location} />
                            <button className="flex flex-col items-center justify-center p-6 bg-red-100 dark:bg-red-800 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
                                <Wrench size={48} className="text-red-500" />
                                <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-100">Déclarer une panne</h3>
                            </button>
                            <button className="flex flex-col items-center justify-center p-6 bg-yellow-100 dark:bg-yellow-800 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
                                <FileText size={48} className="text-yellow-500" />
                                <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-100">Carnet d'entretien</h3>
                            </button>
                        </div>
                    </div>
                );
            case 'stock':
                return (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50">Gestion du stock</h2>
                        <p className="text-center text-gray-600 dark:text-gray-300">
                            Passez des commandes de réapprovisionnement et consultez votre historique de commandes.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <DataCard icon={<ShoppingCart size={48} className="text-green-500" />} title="Commandes en attente" value={franchiseeData.pending_orders} />
                            <button className="flex flex-col items-center justify-center p-6 bg-green-100 dark:bg-green-800 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
                                <ShoppingCart size={48} className="text-green-500" />
                                <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-100">Nouvelle commande</h3>
                            </button>
                        </div>
                    </div>
                );
            case 'sales':
                return (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50">Analyse des ventes</h2>
                        <p className="text-center text-gray-600 dark:text-gray-300">
                            Consultez vos statistiques de vente et générez des rapports.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <DataCard icon={<BarChart2 size={48} className="text-purple-500" />} title="Ventes du jour" value={`€ ${franchiseeData.today_sales}`} />
                            <button className="flex flex-col items-center justify-center p-6 bg-purple-100 dark:bg-purple-800 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
                                <FileText size={48} className="text-purple-500" />
                                <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-100">Historique des ventes</h3>
                            </button>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="space-y-8">
                        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-50">Bonjour, {franchiseeData.user.firstname} !</h2>
                        <p className="text-xl text-center text-gray-600 dark:text-gray-300">
                            Bienvenue sur votre tableau de bord. Ici, vous pouvez gérer votre activité quotidienne.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                            <DataCard icon={<BarChart2 size={48} className="text-purple-500" />} title="Ventes du jour" value={`€ ${franchiseeData.today_sales}`} />
                            <DataCard icon={<ShoppingCart size={48} className="text-green-500" />} title="Solde actuel" value={`€ ${franchiseeData.account.balance}`} />
                            <DataCard icon={<Truck size={48} className="text-blue-500" />} title="Statut du camion" value={franchiseeData.truck_status} />
                        </div>

                        <div className="flex justify-center mt-12 space-x-4">
                            <button onClick={() => setView('truck')} className="flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300">
                                <Truck size={20} className="mr-2" />
                                Camion
                            </button>
                            <button onClick={() => setView('stock')} className="flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-300">
                                <ShoppingCart size={20} className="mr-2" />
                                Stock
                            </button>
                            <button onClick={() => setView('sales')} className="flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-300">
                                <BarChart2 size={20} className="mr-2" />
                                Ventes
                            </button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {view !== 'overview' && (
                    <button onClick={() => setView('overview')} className="mb-8 flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Retour
                    </button>
                )}
                {renderView()}
            </div>
        </div>
    );
}

export default Home;