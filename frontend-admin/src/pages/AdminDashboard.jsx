import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import HeaderDashboard from '../components/HeaderDashboard.jsx';
import SidebarDashboard from '../components/SidebarDashboard.jsx';
import DashboardView from './DashboardView.jsx';
import FranchiseesView from './FranchiseesView.jsx';
import NotificationsView from './NotificationsView.jsx';
import AdminsView from './AdminsView.jsx';
import ValidatedFranchiseesView from "./ValidatedFranchiseesView.jsx";
import UnvalidatedFranchiseesView from "./UnvalidatedFranchiseesView.jsx";
import FranchiseeDetails from './FranchiseeDetails.jsx';
import { getFranchisees } from '../services/api.js';
import { useUser } from '../context/UserContext.jsx';
import WarehouseOverviewView from './WarehouseOverviewView.jsx';
// import StockManagementView from './StockManagementView.jsx';
// import StockAlertsView from './StockAlertsView.jsx';
// import StockMovementsView from './StockMovementsView.jsx';
// import ProductCatalogView from './ProductCatalogView.jsx';
import AllOrdersView from './AllOrdersView.jsx';
 import PendingOrdersView from './PendingOrdersView.jsx';
// import PreparingOrdersView from './PreparingOrdersView.jsx';
// import DeliveredOrdersView from './DeliveredOrdersView.jsx';
// import OrderStatsView from './OrderStatsView.jsx';


// Composant wrapper pour FranchiseeDetails avec paramètres
function FranchiseeDetailsWrapper({ theme, onBackToList }) {
    const { id } = useParams();
    return (
        <FranchiseeDetails
            franchiseeId={id}
            onBackToList={onBackToList}
            theme={theme}
        />
    );
}

function AdminDashboard() {
    const { user, handleLogout } = useUser();
    const location = useLocation();
    const navigate = useNavigate();

    const [theme, setTheme] = useState('dark');
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const [franchisees, setFranchisees] = useState([]);

    // Déterminer la vue actuelle basée sur l'URL
    const getCurrentView = () => {
        const path = location.pathname;
        if (path.includes('/dashboard')) return 'dashboard';
        if (path.includes('/franchisees/details/')) return 'franchiseeDetails';
        if (path.includes('/franchisees/validated')) return 'pendingFranchisees';
        if (path.includes('/franchisees/unvalidated')) return 'disabledFranchisees';
        if (path.includes('/franchisees')) return 'franchisees';

        // Entrepôts
        if (path.includes('/warehouse/overview')) return 'warehouseOverview';
        if (path.includes('/warehouse/stock-management')) return 'stockManagement';
        if (path.includes('/warehouse/alerts')) return 'stockAlerts';
        if (path.includes('/warehouse/movements')) return 'stockMovements';
        if (path.includes('/warehouse/catalog')) return 'productCatalog';

        // Commandes
        if (path.includes('/orders/all')) return 'allOrders';
        if (path.includes('/orders/pending')) return 'pendingOrders';
        if (path.includes('/orders/preparing')) return 'preparingOrders';
        if (path.includes('/orders/delivered')) return 'deliveredOrders';
        if (path.includes('/orders/statistics')) return 'orderStats';

        if (path.includes('/notifications')) return 'notifications';
        if (path.includes('/admins')) return 'admins';
        return 'dashboard';
    };

    const currentView = getCurrentView();

    useEffect(() => {
        const fetchFranchisees = async () => {
            try {
                const data = await getFranchisees();
                setFranchisees(data);
            } catch (error) {
                console.error('Erreur de chargement des franchisés', error);
            }
        };
        fetchFranchisees();
    }, []);

    // Rediriger si pas connecté
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    if (!user) return null;

    const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

    const handleViewFranchiseeDetails = (id) => {
        navigate(`/admin/franchisees/details/${id}`);
    };

    const handleBackToFranchiseesList = () => {
        navigate('/admin/franchisees');
    };

    // Fonction pour naviguer vers une vue spécifique
    const setCurrentView = (view) => {
        const routes = {
            'dashboard': '/admin/dashboard',
            'franchisees': '/admin/franchisees',
            'notifications': '/admin/notifications',
            'admins': '/admin/admins',
            'pendingFranchisees': '/admin/franchisees/validated',
            'disabledFranchisees': '/admin/franchisees/unvalidated',
            'contracts': '/admin/contracts',
            'onboarding': '/admin/onboarding',

            // Gestion Financière
            'transactions': '/admin/financial/transactions',
            'franchiseeAccounts': '/admin/financial/accounts',
            'royalties': '/admin/financial/royalties',
            'financialStats': '/admin/financial/stats',
            'financialReports': '/admin/financial/reports',

            // Routes Entrepôts
            'warehouseOverview': '/admin/warehouse/overview',
            'stockManagement': '/admin/warehouse/stock-management',
            'stockAlerts': '/admin/warehouse/alerts',
            'stockMovements': '/admin/warehouse/movements',
            'productCatalog': '/admin/warehouse/catalog',

            //  Routes Commandes
            'allOrders': '/admin/orders/all',
            'pendingOrders': '/admin/orders/pending',
            'preparingOrders': '/admin/orders/preparing',
            'deliveredOrders': '/admin/orders/delivered',
            'orderStats': '/admin/orders/statistics'
        };

        if (routes[view]) {
            navigate(routes[view]);
        }
    };

    return (
        <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
            <SidebarDashboard
                isSidebarOpen={isSidebarOpen}
                currentView={currentView}
                setCurrentView={setCurrentView}
                toggleSidebar={toggleSidebar}
                user={user}
                theme={theme}
            />

            <div className="flex flex-col flex-1 transition-all duration-300 ease-in-out">
                <HeaderDashboard
                    user={user}
                    theme={theme}
                    isProfileMenuOpen={isProfileMenuOpen}
                    setIsProfileMenuOpen={setIsProfileMenuOpen}
                    toggleTheme={toggleTheme}
                    handleLogout={handleLogout}
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                />
                <main className="flex-1 overflow-y-auto">
                    <Routes>
                        {/* Route par défaut qui redirige vers dashboard */}
                        <Route index element={<DashboardView theme={theme} franchisees={franchisees} />} />

                        <Route path="dashboard" element={
                            <DashboardView theme={theme} franchisees={franchisees} />
                        } />

                        <Route path="franchisees" element={
                            <FranchiseesView theme={theme} onViewDetails={handleViewFranchiseeDetails} />
                        } />

                        <Route path="franchisees/validated" element={
                            <ValidatedFranchiseesView theme={theme} onViewDetails={handleViewFranchiseeDetails} />
                        } />

                        <Route path="franchisees/unvalidated" element={
                            <UnvalidatedFranchiseesView theme={theme} onViewDetails={handleViewFranchiseeDetails} />
                        } />

                        <Route path="franchisees/details/:id" element={
                            <FranchiseeDetailsWrapper
                                theme={theme}
                                onBackToList={handleBackToFranchiseesList}
                            />
                        } />

                        <Route path="notifications" element={
                            <NotificationsView theme={theme} />
                        } />

                        <Route path="admins" element={
                            <AdminsView admins={[]} theme={theme} user={user} />
                        } />

                        {/* : Routes Entrepôts */}
                        <Route path="warehouse/overview" element={
                            <WarehouseOverviewView theme={theme} />
                        } />



                        {/* NOUVEAU: Routes Commandes */}
                        <Route path="orders/all" element={
                            <AllOrdersView theme={theme} />
                        } />

                        <Route path="orders/pending" element={
                            <PendingOrdersView theme={theme} />
                        } />



                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default AdminDashboard;