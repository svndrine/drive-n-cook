// src/pages/Home.jsx
import React, { useState } from 'react';
import HeaderConnected from '../components/HeaderConnected.jsx';
// Importez vos composants de vue ici
import AccountView from './AccountView.jsx';
import TruckView from './TruckView.jsx';
import SuppliesView from './SuppliesView.jsx';
import SalesView from './SalesView.jsx';

function FranchiseeDashboard() {
    const [currentView, setCurrentView] = useState('account');

    const renderContent = () => {
        switch (currentView) {
            case 'account':
                return <AccountView />;
            case 'trucks':
                return <TruckView />;
            case 'supplies':
                return <SuppliesView />;
            case 'sales':
                return <SalesView />;
            default:
                return <AccountView />;
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
            <HeaderConnected currentView={currentView} setCurrentView={setCurrentView} />
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="container mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

export default FranchiseeDashboard;
