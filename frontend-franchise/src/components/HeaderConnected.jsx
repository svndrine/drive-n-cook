// src/components/HeaderConnected.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFranchisee } from '../context/FranchiseeContext.jsx';
import { User, Truck, ShoppingCart, BarChart } from 'lucide-react';

/**
 * Composant d'en-tête pour les utilisateurs franchisés connectés.
 * Affiche le logo, des liens de navigation vers les différentes vues du tableau de bord
 * et un bouton de déconnexion.
 * Il prend en charge le changement de vue via les props.
 */
function HeaderConnected({ currentView, setCurrentView }) {
    const { handleLogout } = useFranchisee();
    const navigate = useNavigate();

    const onLogout = () => {
        handleLogout();
        navigate('/login');
    };

    return (
        <header className="bg-white text-gray-800 p-4 shadow-md sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between">
                {/* Logo qui redirige vers la vue par défaut */}
                <button onClick={() => setCurrentView('account')} className="flex items-center space-x-2">
                    <img
                        src="/logo-fond-transparent-noir.png"
                        alt="Logo Driv'n Cook"
                        className="h-10 w-auto"
                    />
                </button>

                {/* Navigation principale pour les différentes sections */}
                <nav className="hidden md:flex items-center space-x-4">
                    <button
                        onClick={() => setCurrentView('account')}
                        className={`flex items-center py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-300 ${currentView === 'account' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        <User size={18} className="mr-2" />
                        Mon Compte
                    </button>
                    <button
                        onClick={() => setCurrentView('trucks')}
                        className={`flex items-center py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-300 ${currentView === 'trucks' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        <Truck size={18} className="mr-2" />
                        Mes Camions
                    </button>
                    <button
                        onClick={() => setCurrentView('supplies')}
                        className={`flex items-center py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-300 ${currentView === 'supplies' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        <ShoppingCart size={18} className="mr-2" />
                        Approvisionnement
                    </button>
                    <button
                        onClick={() => setCurrentView('sales')}
                        className={`flex items-center py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-300 ${currentView === 'sales' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        <BarChart size={18} className="mr-2" />
                        Analyse des ventes
                    </button>
                </nav>

                {/* Bouton de déconnexion */}
                <div className="flex items-center">
                    <button
                        onClick={onLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-300 text-sm font-medium"
                    >
                        Déconnexion
                    </button>
                </div>
            </div>
        </header>
    );
}

export default HeaderConnected;
