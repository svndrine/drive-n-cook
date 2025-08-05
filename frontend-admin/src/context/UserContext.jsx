import React, { createContext, useState, useContext, useEffect } from 'react';
// Correction du chemin d'importation
import { logout } from '../services/api';

const UserContext = createContext();

export const useUser = () => {
    return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Effet pour vérifier le statut de connexion au chargement de l'application
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user_data');
        if (token && userData) {
            setIsLoggedIn(true);
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData, token) => {
        setLoading(true);
        setError(null);
        try {
            localStorage.setItem('access_token', token);
            localStorage.setItem('user_data', JSON.stringify(userData));
            setIsLoggedIn(true);
            setUser(userData);
            console.log('Connexion réussie', userData);
        } catch (err) {
            setError('Impossible de se connecter. Veuillez réessayer plus tard.');
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        setError(null);
        try {
            await logout();
            console.log("Déconnexion de l'API réussie.");
        } catch (err) {
            console.error('Erreur lors de la déconnexion de l\'API:', err);
            setError('La déconnexion côté serveur a échoué, mais vous avez été déconnecté localement.');
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_data');
            setIsLoggedIn(false);
            setUser(null);
            setLoading(false);
            console.log('Déconnexion locale réussie. L\'application va maintenant afficher la page de connexion.');
        }
    };

    const value = {
        isLoggedIn,
        user,
        loading,
        error,
        handleLogin,
        handleLogout,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
