import React from 'react';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { UserProvider, useUser } from './context/UserContext.jsx'; // Import du UserProvider et du hook

// Crée un composant interne pour gérer l'affichage conditionnel
const AppContent = () => {
    const { isLoggedIn, loading } = useUser();

    // Affiche un écran de chargement pendant la vérification initiale
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Chargement...</div>;
    }

    // Affiche le tableau de bord si l'utilisateur est connecté, sinon la page de connexion
    return (
        <>
            {isLoggedIn ? (
                <AdminDashboard />
            ) : (
                <Login />
            )}
        </>
    );
};

function App() {
    return (
        <UserProvider>
            <AppContent />
        </UserProvider>
    );
}

export default App;
