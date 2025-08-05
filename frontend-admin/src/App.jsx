// frontend-admin/src/App.jsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { UserProvider, useUser } from './context/UserContext.jsx';

const AppContent = () => {
    const { isLoggedIn, loading } = useUser();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Chargement...</div>;
    }

    return isLoggedIn ? <AdminDashboard /> : <Login />;
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
