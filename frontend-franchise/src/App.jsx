import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from "./components/Header.jsx";
import Login from "./pages/Login.jsx";
import DevenirFranchise from "./pages/DevenirFranchise.jsx";
import FranchiseeDashboard from "./pages/FranchiseeDashboard.jsx";
import PaiementFranchise from "./pages/PaiementFranchise.jsx"; // Importez la page de paiement
import { FranchiseeProvider, useFranchisee } from './context/FranchiseeContext.jsx';

// Composant interne pour gérer l'affichage conditionnel
const AppContent = () => {
    const { isLoggedIn, loading } = useFranchisee();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-800">
                Chargement...
            </div>
        );
    }

    return (
        <div className="App">
            {/* Le Header peut être ici ou à l'intérieur de certaines routes si nécessaire */}
            <Header />
            <Routes>
                {/* Routes publiques */}
                <Route path="/login" element={<Login />} />
                <Route path="/devenir-franchise" element={<DevenirFranchise />} />

                {/* Route de paiement (peut être publique ou protégée selon votre logique métier) */}
                <Route path="/franchisee/paiement" element={<PaiementFranchise />} />

                {/* Route protégée : tableau de bord du franchisé */}
                {isLoggedIn ? (
                    <Route path="/dashboard" element={<FranchiseeDashboard />} />
                ) : (
                    // Rediriger vers la page de connexion si non connecté et tente d'accéder au dashboard
                    <Route path="/dashboard" element={<Login />} />
                )}

                {/* Route par défaut si aucune autre ne correspond */}
                <Route path="*" element={isLoggedIn ? <FranchiseeDashboard /> : <Login />} />
            </Routes>
        </div>
    );
};

function App() {
    return (
        <FranchiseeProvider>
            <Router> {/* BrowserRouter doit envelopper les Routes */}
                <AppContent />
            </Router>
        </FranchiseeProvider>
    );
}

export default App;
