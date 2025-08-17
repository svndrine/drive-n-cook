// frontend-admin/src/components/SidebarDashboard.jsx
import React, { useState } from 'react';
import { Home, Users, Bell, User, Menu, X, ChevronDown, ChevronUp, DollarSign, Settings, Warehouse, ShoppingCart } from 'lucide-react';

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
    // Local state for dropdown menus
    const [isFranchiseeMenuOpen, setIsFranchiseeMenuOpen] = useState(false);
    const [isFinancialMenuOpen, setIsFinancialMenuOpen] = useState(false);
    const [isWarehouseMenuOpen, setIsWarehouseMenuOpen] = useState(false);
    const [isOrdersMenuOpen, setIsOrdersMenuOpen] = useState(false);
    const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

    const sidebarBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const textColorClass = theme === 'dark' ? 'text-white' : 'text-gray-800';
    const borderColorClass = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';
    const hoverBgClass = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
    const activeBgClass = 'bg-blue-600';

    // Function to toggle the visibility of the franchisee menu
    const toggleFranchiseeMenu = () => {
        setIsFranchiseeMenuOpen(prev => !prev);
    };

    // Function to toggle the visibility of the financial management menu
    const toggleFinancialMenu = () => {
        setIsFinancialMenuOpen(prev => !prev);
    };

    // Function to toggle the visibility of the warehouse menu
    const toggleWarehouseMenu = () => {
        setIsWarehouseMenuOpen(prev => !prev);
    };

    // Function to toggle the visibility of the orders menu
    const toggleOrdersMenu = () => {
        setIsOrdersMenuOpen(prev => !prev);
    };

    // Function to toggle the visibility of the administration menu
    const toggleAdminMenu = () => {
        setIsAdminMenuOpen(prev => !prev);
    };

    const handleViewChange = (view) => {
        setCurrentView(view);
        if (window.innerWidth < 1024) toggleSidebar();
    };

    return (
        <>
            {/* Overlay for mobile mode */}
            {isSidebarOpen && window.innerWidth < 1024 && (
                <div onClick={toggleSidebar} className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"></div>
            )}

            {/* Sidebar */}
                <aside
                    className={`fixed inset-y-0 left-0 z-40 flex-shrink-0 transition-all duration-300 ease-in-out ${sidebarBgClass} ${textColorClass} ${isSidebarOpen ? 'w-64' : 'w-20'} lg:static lg:translate-x-0 ${!isSidebarOpen ? '-translate-x-full lg:w-20' : 'w-64'}`}
                >
                    {/* Sidebar header */}
                    <div className={`flex items-center justify-center h-20 border-b ${borderColorClass}`}>
                        <h1 className={`text-2xl font-bold truncate ${!isSidebarOpen && 'hidden'}`}>Admin</h1>
                    </div>

                    {/* Main navigation */}
                    <nav className="flex-1 overflow-y-auto p-4">
                        <ul className="space-y-2">
                            {/* Dashboard */}
                            <li>
                                <a
                                    href="#"
                                    onClick={() => handleViewChange('dashboard')}
                                    className={`flex items-center py-2 px-3 rounded-lg ${hoverBgClass} ${currentView === 'dashboard' ? activeBgClass + ' text-white' : ''}`}
                                >
                                    <Home size={24} />
                                    <span className={`ml-4 text-sm font-medium whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>Tableau de bord</span>
                                </a>
                            </li>

                            {/* Franchisees dropdown menu */}
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
                                                onClick={() => handleViewChange('franchisees')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'franchisees' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Tous
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('pendingFranchisees')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'pendingFranchisees' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Validés
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('disabledFranchisees')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'disabledFranchisees' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                En attente
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('contracts')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'contracts' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Contrats
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('onboarding')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'onboarding' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Onboarding
                                            </button>
                                        </li>
                                    </ul>
                                )}
                            </li>

                            {/* Financial Management dropdown menu */}
                            <li>
                                <button
                                    onClick={toggleFinancialMenu}
                                    className={`w-full flex items-center justify-between py-2 px-3 rounded-lg ${hoverBgClass}`}
                                >
                                    <div className="flex items-center">
                                        <DollarSign size={24} />
                                        <span className={`ml-4 text-sm font-medium whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>Gestion Financière</span>
                                    </div>
                                    {isSidebarOpen && (
                                        isFinancialMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />
                                    )}
                                </button>
                                {isFinancialMenuOpen && isSidebarOpen && (
                                    <ul className="ml-8 mt-2 space-y-1">
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('transactions')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'transactions' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Transactions
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('franchiseeAccounts')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'franchiseeAccounts' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Comptes franchisés
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('royalties')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'royalties' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Royalties
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('financialStats')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'financialStats' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Statistiques
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('financialReports')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'financialReports' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Rapports
                                            </button>
                                        </li>
                                    </ul>
                                )}
                            </li>

                            {/* NOUVEAU: Section Entrepôts et Stocks */}
                            <li>
                                <button
                                    onClick={toggleWarehouseMenu}
                                    className={`w-full flex items-center justify-between py-2 px-3 rounded-lg ${hoverBgClass}`}
                                >
                                    <div className="flex items-center">
                                        <Warehouse size={24} />
                                        <span className={`ml-4 text-sm font-medium whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>Entrepôts & Stocks</span>
                                    </div>
                                    {isSidebarOpen && (
                                        isWarehouseMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />
                                    )}
                                </button>
                                {isWarehouseMenuOpen && isSidebarOpen && (
                                    <ul className="ml-8 mt-2 space-y-1">
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('warehouseOverview')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'warehouseOverview' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Vue d'ensemble
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('stockManagement')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'stockManagement' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Gestion stocks
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('stockAlerts')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'stockAlerts' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Alertes stocks
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('stockMovements')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'stockMovements' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Mouvements
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('productCatalog')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'productCatalog' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Catalogue produits
                                            </button>
                                        </li>
                                    </ul>
                                )}
                            </li>

                            {/* NOUVEAU: Section Commandes Franchisés */}
                            <li>
                                <button
                                    onClick={toggleOrdersMenu}
                                    className={`w-full flex items-center justify-between py-2 px-3 rounded-lg ${hoverBgClass}`}
                                >
                                    <div className="flex items-center">
                                        <ShoppingCart size={24} />
                                        <span className={`ml-4 text-sm font-medium whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>Commandes</span>
                                    </div>
                                    {isSidebarOpen && (
                                        isOrdersMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />
                                    )}
                                </button>
                                {isOrdersMenuOpen && isSidebarOpen && (
                                    <ul className="ml-8 mt-2 space-y-1">
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('allOrders')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'allOrders' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Toutes les commandes
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('pendingOrders')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'pendingOrders' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                En attente validation
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('preparingOrders')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'preparingOrders' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                En préparation
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('deliveredOrders')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'deliveredOrders' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Livrées
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                onClick={() => handleViewChange('orderStats')}
                                                className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'orderStats' ? activeBgClass + ' text-white' : ''}`}
                                            >
                                                Statistiques
                                            </button>
                                        </li>
                                    </ul>
                                )}
                            </li>

                            {/* Notifications */}
                            <li>
                                <a
                                    href="#"
                                    onClick={() => handleViewChange('notifications')}
                                    className={`flex items-center py-2 px-3 rounded-lg ${hoverBgClass} ${currentView === 'notifications' ? activeBgClass + ' text-white' : ''}`}
                                >
                                    <Bell size={24} />
                                    <span className={`ml-4 text-sm font-medium whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>Notifications</span>
                                </a>
                            </li>

                            {/* Administration dropdown menu (visible only for superadmins) */}
                            {user?.role === 'superadmin' && (
                                <li>
                                    <button
                                        onClick={toggleAdminMenu}
                                        className={`w-full flex items-center justify-between py-2 px-3 rounded-lg ${hoverBgClass}`}
                                    >
                                        <div className="flex items-center">
                                            <Settings size={24} />
                                            <span className={`ml-4 text-sm font-medium whitespace-nowrap ${!isSidebarOpen && 'hidden'}`}>Administration</span>
                                        </div>
                                        {isSidebarOpen && (
                                            isAdminMenuOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />
                                        )}
                                    </button>
                                    {isAdminMenuOpen && isSidebarOpen && (
                                        <ul className="ml-8 mt-2 space-y-1">
                                            <li>
                                                <button
                                                    onClick={() => handleViewChange('admins')}
                                                    className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'admins' ? activeBgClass + ' text-white' : ''}`}
                                                >
                                                    Utilisateurs Admin
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    onClick={() => handleViewChange('systemSettings')}
                                                    className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'systemSettings' ? activeBgClass + ' text-white' : ''}`}
                                                >
                                                    Paramètres système
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    onClick={() => handleViewChange('logsAudit')}
                                                    className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'logsAudit' ? activeBgClass + ' text-white' : ''}`}
                                                >
                                                    Logs & Audit
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    onClick={() => handleViewChange('systemNotifications')}
                                                    className={`block py-2 px-3 rounded-lg text-sm ${hoverBgClass} ${currentView === 'systemNotifications' ? activeBgClass + ' text-white' : ''}`}
                                                >
                                                    Notifications système
                                                </button>
                                            </li>
                                        </ul>
                                    )}
                                </li>
                            )}
                        </ul>
                    </nav>
                </aside>
        </>
    );
};

export default SidebarDashboard;