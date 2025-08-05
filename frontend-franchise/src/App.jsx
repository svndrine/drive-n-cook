import React, { useState } from 'react';
import Header from "./components/Header.jsx";
import Login from "./pages/Login.jsx";
import DevenirFranchise from "./pages/DevenirFranchise.jsx";
import FranchiseeDashboard from "./pages/FranchiseeDashboard.jsx"; // Le tableau de bord du franchisé
import { FranchiseeProvider, useFranchisee } from './context/FranchiseeContext.jsx';

// Composant interne pour gérer l'affichage conditionnel
const AppContent = () => {
    // Utilisation du hook pour accéder à l'état global du franchisé
    const { isLoggedIn, loading } = useFranchisee();
    const [currentPage, setCurrentPage] = useState('login'); // 'login' ou 'franchise'

    // Affiche un écran de chargement pendant la vérification initiale de l'authentification
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-800">
                Chargement...
            </div>
        );
    }

    // Si l'utilisateur est connecté, affiche le tableau de bord
    if (isLoggedIn) {
        return <FranchiseeDashboard />;
    }

    // Si l'utilisateur n'est pas connecté, affiche la page de connexion ou de demande de franchise
    const renderPage = () => {
        if (currentPage === 'login') {
            return <Login />;
        }
        return <DevenirFranchise />;
    };

    return (
        <div className="App">
            <Header setCurrentPage={setCurrentPage} />
            {renderPage()}
        </div>
    );
};

function App() {
    return (
        // Fournit le contexte à toute l'application
        <FranchiseeProvider>
            <AppContent />
        </FranchiseeProvider>
    );
}

export default App;
