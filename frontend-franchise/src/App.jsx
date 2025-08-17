// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
// Importe les deux en-têtes
import PublicHeader from "./components/Header.jsx";
import HeaderConnected from "./components/HeaderConnected.jsx";
import Login from "./pages/Login.jsx";
import DevenirFranchise from "./pages/DevenirFranchise.jsx";
import Home from "./pages/Home.jsx";
import PaiementFranchise from "./pages/PaiementFranchise.jsx";
import { FranchiseeProvider, useFranchisee } from './context/FranchiseeContext.jsx';
import FranchiseeDashboard from "./pages/FranchiseeDashboard.jsx";
import ContratPublic from "./pages/public/ContratPublic.jsx";
import EntryFeePublic from "./pages/public/EntryFeePublic.jsx";
import PaiementSuccess from "./pages/PaiementSuccess.jsx";
import PaiementNouveau from "./pages/PaiementNouveau.jsx";
import PaiementFailed from "./pages/PaiementFailed.jsx";
import MonContrat from "./pages/MonContrat.jsx";


const AppContent = () => {
    const { isLoggedIn, loading } = useFranchisee();
    const navigate = useNavigate();
    const location = useLocation();

    // Pages publiques accessibles sans connexion
    const publicRoutes = ['/login', '/devenir-franchise'];
    const isPublicRoute = publicRoutes.includes(location.pathname);

    useEffect(() => {
        if (!loading) {
            // Si utilisateur connecté et sur une page de connexion, rediriger vers home
            if (isLoggedIn && location.pathname === '/login') {
                navigate("/home", { replace: true });
            }
            // Si utilisateur non connecté et sur une page protégée, rediriger vers login
            else if (!isLoggedIn && !isPublicRoute && location.pathname !== '/') {
                navigate("/login", { replace: true });
            }
            // Si utilisateur non connecté sur la racine, rediriger vers login
            else if (!isLoggedIn && location.pathname === '/') {
                navigate("/login", { replace: true });
            }
        }
    }, [isLoggedIn, loading, navigate, location.pathname, isPublicRoute]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="App">
            {/* Rendu conditionnel de l'en-tête */}
            {isLoggedIn ? <HeaderConnected /> : <PublicHeader />}

            <Routes>
                {/* Routes publiques - accessibles sans connexion */}
                <Route path="/login" element={<Login />} />
                <Route path="/devenir-franchise" element={<DevenirFranchise />} />
                <Route path="/paiements/success" element={<PaiementSuccess />} />
                <Route path="/paiements/failed" element={<PaiementFailed />} />
                <Route path="/public/contrat/:token" element={<ContratPublic />} />
                <Route path="/public/paiement/entry-fee/:token" element={<EntryFeePublic />} />


                {/* Routes protégées - nécessitent une connexion */}
                {isLoggedIn && (
                    <>
                        <Route path="/home" element={<Home />} />
                        <Route path="/dashbord" element={<FranchiseeDashboard />} />
                        <Route path="/franchisee/paiement" element={<PaiementFranchise />} />
                        <Route path="/mon-contrat" element={<MonContrat />} />
                        <Route path="/paiements/nouveau" element={<PaiementNouveau />} />
                    </>
                )}

                {/* Route par défaut */}
                <Route path="/" element={
                    isLoggedIn ? <Home /> : <Login />
                } />
            </Routes>
        </div>
    );
};

function App() {
    return (
        <FranchiseeProvider>
            <Router>
                <AppContent />
            </Router>
        </FranchiseeProvider>
    );
}

export default App;