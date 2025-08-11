import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, getCurrentUser, logout } from '../services/api'; // Assurez-vous que les chemins d'importation sont corrects

const FranchiseeContext = createContext();

export const useFranchisee = () => {
    return useContext(FranchiseeContext);
};

export const FranchiseeProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fonction pour vérifier le statut de connexion au chargement de l'application
    const checkLoginStatus = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (token) {
                // Tente de récupérer l'utilisateur avec le token
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    setIsLoggedIn(true);
                    setUser(currentUser);
                } else {
                    // Token invalide ou expiré
                    handleLogout();
                }
            }
        } catch (err) {
            console.error("Erreur lors de la vérification de la connexion:", err);
            handleLogout();
        } finally {
            setLoading(false);
        }
    };

    // Gère la connexion
    const handleLogin = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await login(email, password);
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                // Récupère les informations de l'utilisateur après la connexion
                const currentUser = await getCurrentUser();
                setUser(currentUser);
                setIsLoggedIn(true);
            }
        } catch (err) {
            setError(err.message || "Erreur de connexion. Veuillez vérifier vos informations.");
        } finally {
            setLoading(false);
        }
    };

    // Gère la déconnexion
    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
        } catch (err) {
            console.error("Erreur lors de la déconnexion:", err);
        } finally {
            localStorage.removeItem('access_token');
            setIsLoggedIn(false);
            setUser(null);
            setLoading(false);
        }
    };

    // Exécute la vérification au premier rendu
    useEffect(() => {
        checkLoginStatus();
    }, []);

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
