// frontend-admin/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { UserProvider, useUser } from './context/UserContext.jsx';

const AppContent = () => {
    const { isLoggedIn, loading } = useUser();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Chargement...</div>;
    }

    return (
        <Routes>
            {/* Route de connexion */}
            <Route
                path="/login"
                element={isLoggedIn ? <Navigate to="/admin/dashboard" replace /> : <Login />}
            />

            {/* Routes admin - protection par authentification */}
            <Route
                path="/admin/*"
                element={isLoggedIn ? <AdminDashboard /> : <Navigate to="/login" replace />}
            />

            {/* Redirection par défaut */}
            <Route
                path="/"
                element={<Navigate to={isLoggedIn ? "/admin/dashboard" : "/login"} replace />}
            />

            {/* Route 404 - redirection vers login ou dashboard */}
            <Route
                path="*"
                element={<Navigate to={isLoggedIn ? "/admin/dashboard" : "/login"} replace />}
            />
        </Routes>
    );
};

function App() {
    return (
        <UserProvider>
            <Router>
                <AppContent />
            </Router>
        </UserProvider>
    );
}

export default App;