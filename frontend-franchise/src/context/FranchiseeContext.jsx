import React, { createContext, useState, useContext, useEffect } from 'react';
import { login } from '../services/api.js'; // Assurez-vous d'avoir une fonction login dans votre api.js

// Crée le contexte franchisé
const FranchiseeContext = createContext();

// Crée un hook personnalisé pour utiliser le contexte
export const useFranchisee = () => {
    return useContext(FranchiseeContext);
};

// Le fournisseur de contexte qui gère toute la logique
export const FranchiseeProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token_franchisee');
        const userData = localStorage.getItem('user_data_franchisee');
        if (token && userData) {
            setIsLoggedIn(true);
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const handleLogin = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await login(email, password);
            localStorage.setItem('access_token_franchisee', data.access_token);
            localStorage.setItem('user_data_franchisee', JSON.stringify(data.user));

            setIsLoggedIn(true);
            setUser(data.user);
            console.log('Connexion franchisé réussie', data.user);
        } catch (err) {
            setError(err.message || 'Impossible de se connecter. Veuillez réessayer plus tard.');
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token_franchisee');
        localStorage.removeItem('user_data_franchisee');
        setIsLoggedIn(false);
        setUser(null);
        console.log('Déconnexion franchisé réussie');
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
        <FranchiseeContext.Provider value={value}>
            {children}
        </FranchiseeContext.Provider>
    );
};
