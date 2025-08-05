import React, { useState, useEffect } from 'react';
// Import des composants réutilisables avec les nouveaux noms
import HeaderDashboard from '../components/HeaderDashboard.jsx';
import SidebarDashboard from '../components/SidebarDashboard.jsx';
// Import des vues (pages)
import DashboardView from './DashboardView.jsx';
import FranchiseesView from './FranchiseesView.jsx';
import NotificationsView from './NotificationsView.jsx';
import AdminsView from './AdminsView.jsx';

// Importation du contexte utilisateur (décommenter si nécessaire)
// import { useUser } from '../context/UserContext.jsx';

// Mock du hook useUser pour un exemple autonome
const useUser = () => {
    // État utilisateur simulé
    const user = {
        firstname: "Admin",
        lastname: "Principal",
        email: "admin@drivncook.fr",
        role: "superadmin"
    };
    // Fonction de déconnexion simulée
    const handleLogout = () => {
        alert('Déconnexion...');
    };
    return { user, handleLogout };
};

function AdminDashboard() {
    const { user, handleLogout } = useUser();
    const [currentView, setCurrentView] = useState('dashboard');
    const [theme, setTheme] = useState('dark');
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

    // Données fictives pour les franchisés et les administrateurs
    const [franchisees, setFranchisees] = useState([
        {
            id: 1, first_name: "Jean", last_name: "Dupont", email: "jean.dupont@email.com", phone: "0612345678", is_active: false,
            address: "123 Rue de la Paix", zip_code: "75001", city: "Paris", current_situation: "Demandeur d'emploi",
            desired_zone: "Île-de-France", financial_contribution: "60.000 - 80.000 €",
        },
        {
            id: 2, first_name: "Marie", last_name: "Curie", email: "marie.curie@email.com", phone: "0789123456", is_active: true,
            address: "456 Avenue des Champs", zip_code: "69002", city: "Lyon", current_situation: "Salarié",
            desired_zone: "Rhône-Alpes", financial_contribution: "> 200.000 €",
        },
        {
            id: 3, first_name: "Pierre", last_name: "Martin", email: "pierre.martin@email.com", phone: "0698765432", is_active: false,
            address: "789 Boulevard Saint-Michel", zip_code: "33000", city: "Bordeaux", current_situation: "Entrepreneur",
            desired_zone: "Aquitaine", financial_contribution: "80.000 - 200.000 €",
        },
    ]);

    const [admins, setAdmins] = useState([
        { id: 1, first_name: "Admin", last_name: "Principal", email: "admin@drivncook.fr", role: "superadmin" },
        { id: 2, first_name: "Modo", last_name: "Junior", email: "modo@drivncook.fr", role: "admin" },
    ]);

    // Gère la barre latérale en fonction de la taille de l'écran
    useEffect(() => {
        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Gère l'ouverture/fermeture du menu
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Gère le basculement du thème
    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    // Gère le statut d'activation d'un franchisé
    const toggleActiveStatus = (id, currentStatus) => {
        setFranchisees(franchisees.map(f =>
            f.id === id ? { ...f, is_active: !currentStatus } : f
        ));
    };

    // Rendu du contenu principal en fonction de la vue
    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView franchisees={franchisees} theme={theme} />;
            case 'franchisees':
                return <FranchiseesView franchisees={franchisees} theme={theme} toggleActiveStatus={toggleActiveStatus} />;
            case 'notifications':
                return <NotificationsView theme={theme} />;
            case 'admins':
                return <AdminsView admins={admins} theme={theme} user={user} />;
            default:
                return null;
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

            {/* Contenu principal */}
            <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out`}>
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
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}

export default AdminDashboard;
