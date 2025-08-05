// frontend-admin/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import HeaderDashboard from '../components/HeaderDashboard.jsx';
import SidebarDashboard from '../components/SidebarDashboard.jsx';
import DashboardView from './DashboardView.jsx';
import FranchiseesView from './FranchiseesView.jsx';
import NotificationsView from './NotificationsView.jsx';
import AdminsView from './AdminsView.jsx';
import ValidatedFranchiseesView from "./ValidatedFranchiseesView.jsx";
import UnvalidatedFranchiseesView from "./UnvalidatedFranchiseesView.jsx";

import { useUser } from '../context/UserContext.jsx';

function AdminDashboard() {
    const { user, handleLogout } = useUser();
    const [currentView, setCurrentView] = useState('dashboard');
    const [theme, setTheme] = useState('dark');
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

    if (!user) {
        return null;
    }

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView franchisees={[]} theme={theme} />;
            case 'franchisees':
                return <FranchiseesView theme={theme} />;
            case 'notifications':
                return <NotificationsView theme={theme} />;
            case 'admins':
                return <AdminsView admins={[]} theme={theme} user={user} />;
            case 'pendingFranchisees':
                return <ValidatedFranchiseesView admins={[]} theme={theme} />;
            case 'disabledFranchisees':
                return <UnvalidatedFranchiseesView theme={theme} />;
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
