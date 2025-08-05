import React, { createContext, useState, useContext, useEffect } from 'react';

// Crée le contexte utilisateur
const UserContext = createContext();

// Crée un hook personnalisé pour utiliser le contexte
export const useUser = () => {
    return useContext(UserContext);
};

// Le fournisseur de contexte qui gère toute la logique
export const UserProvider = ({ children }) => {
    // États pour gérer l'authentification et les informations utilisateur
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Effet pour vérifier le statut de connexion au chargement de l'application
    // Il s'exécute une seule fois grâce au tableau de dépendances vide []
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user_data');
        if (token && userData) {
            setIsLoggedIn(true);
            setUser(JSON.parse(userData));
        }
        setLoading(false); // Le chargement initial est terminé
    }, []);

    // Fonction de connexion à l'API
    const handleLogin = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/login', { // Remplacez l'URL si nécessaire
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('user_data', JSON.stringify(data.user));

                setIsLoggedIn(true);
                setUser(data.user);
                console.log('Connexion réussie', data);
            } else {
                setError(data.message || 'Erreur de connexion');
                console.error('Erreur de connexion:', data.message);
            }
        } catch (err) {
            setError('Impossible de se connecter au serveur. Veuillez réessayer plus tard.');
            console.error('Erreur réseau:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fonction de déconnexion
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        setIsLoggedIn(false);
        setUser(null);
        console.log('Déconnexion réussie');
    };

    // Les valeurs qui seront fournies à l'ensemble de l'application
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
