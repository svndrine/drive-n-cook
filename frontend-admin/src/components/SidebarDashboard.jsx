// frontend-admin/src/components/SidebarDashboard.jsx
import React, { useState } from 'react';
import { Home, Users, Bell, User, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Composant de la barre latérale de navigation.
 * @param {object} props - Propriétés du composant.
 * @param {boolean} props.isSidebarOpen - État de la barre latérale (ouverte ou fermée).
 * @param {string} props.currentView - La vue actuelle de l'application.
 * @param {function} props.setCurrentView - Fonction pour changer la vue.
 * @param {function} props.toggleSidebar - Fonction pour basculer la barre latérale.
 * @param {object} props.user - Informations de l'utilisateur pour les droits d'accès.
 * @param {string} props.theme - Thème actuel.
 */
const SidebarDashboard = ({ isSidebarOpen, currentView, setCurrentView, toggleSidebar, user, theme }) => {
    // État local pour le menu déroulant des franchisés
    const [isFranchiseeMenuOpen, setIsFranchiseeMenuOpen] = useState(false);

    const sidebarBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const textColorClass = theme === 'dark' ? 'text-white' : 'text-gray-800';
    const borderColorClass = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
    const hoverBgClass = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
    const activeBgClass = 'bg-blue-600';

    // Fonction pour basculer la visibilité du menu des franchisés
    const toggleFranchiseeMenu = () => {
        setIsFranchiseeMenuOpen(prev => !prev);
    };

    return (
        <>
            {/* Overlay pour le mode mobile */}
            {isSidebarOpen && window.innerWidth < 1024 && (
                <div onClick={toggleSidebar} className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"></div>
            )}

            {/* Barre latérale */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex-shrink-0 transition-all duration-300 ease-in-out ${sidebarBgClass} ${textColorClass} ${isSidebarOpen ? 'w-64' : 'w-20'} lg:static lg:translate-x-0 ${!isSidebarOpen ? '-translate-x-full lg:w-20' : 'w-64'}`}
            >
                {/* En-tête de la barre latérale */}
                <div className={`flex items-center justify-center h-20 border-b ${borderColorClass}`}>
                    <h1 className={`text-2xl font-bold truncate ${!isSidebarOpen && 'hidden'}`}>Admin</h1>
                </div>

                {/* Navigation principale */}
                <nav className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-2">
                        {/* Tableau de bord */}
                        <li>
                            <a
                                href="#"
                                onClick={() => { setCurrentView('dashboard'); if (window.innerWidth < 1024) toggleSidebar(); }}
                                className={`flex items-center py-2 px-3 rounded-lg ${hoverBgClass} ${currentView === 'dashboard' ? activeBgClass + ' text-white' : ''}`}
                            >
                                <Home size={24} />
                                <span className={`ml-4 text-sm font-medium whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>Tableau de bord</span>
                            </a>
                        </li>

                        {/* Menu déroulant des franchisés */}
                        <li>
                            <button
                                onClick={toggleFranchiseeMenu}
                                className={`w-full flex items-center justify-between py-2 px-3 rounded-lg ${hoverBgClass}`}
                            >
                                <div className="flex items-center">
                                    <Users size={24} />
                                    <span className={`ml-4 text-sm font-medium whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>Franchisés</span>
                                </div>
                                {isSidebarOpen && (
                                    isFranchiseeMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />
                                )}
                            </button>
                            {isFranchiseeMenuOpen && isSidebarOpen && (
                                <ul className="ml-8 mt-2 space-y-1">
                                    <li>
                                        <button
                                            onClick={() => { setCurrentView('franchisees'); if (window.innerWidth < 1024) toggleSidebar(); }}
                                            className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'franchisees' ? activeBgClass + ' text-white' : ''}`}
                                        >
                                            View
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => { setCurrentView('pendingFranchisees'); if (window.innerWidth < 1024) toggleSidebar(); }}
                                            className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'pendingFranchisees' ? activeBgClass + ' text-white' : ''}`}
                                        >
                                            Tous les franchisés
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => { setCurrentView('disabledFranchisees'); if (window.innerWidth < 1024) toggleSidebar(); }}
                                            className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'disabledFranchisees' ? activeBgClass + ' text-white' : ''}`}
                                        >
                                            En attente
                                        </button>
                                    </li>
                                </ul>
                            )}
                        </li>

                        {/* Notifications */}
                        <li>
                            <a
                                href="#"
                                onClick={() => { setCurrentView('notifications'); if (window.innerWidth < 1024) toggleSidebar(); }}
                                className={`flex items-center py-2 px-3 rounded-lg ${hoverBgClass} ${currentView === 'notifications' ? activeBgClass + ' text-white' : ''}`}
                            >
                                <Bell size={24} />
                                <span className={`ml-4 text-sm font-medium whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>Notifications</span>
                            </a>
                        </li>

                        {/* Administrateurs (visible uniquement pour les superadmins) */}
                        {user?.role === 'superadmin' && (
                            <li>
                                <a
                                    href="#"
                                    onClick={() => { setCurrentView('admins'); if (window.innerWidth < 1024) toggleSidebar(); }}
                                    className={`flex items-center py-2 px-3 rounded-lg ${hoverBgClass} ${currentView === 'admins' ? activeBgClass + ' text-white' : ''}`}
                                >
                                    <User size={24} />
                                    <span className={`ml-4 text-sm font-medium whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>Administrateurs</span>
                                </a>
                            </li>
                        )}
                    </ul>
                </nav>
            </aside>
        </>
    );
};

export default SidebarDashboard;
