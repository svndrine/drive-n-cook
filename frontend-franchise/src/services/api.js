// src/services/api.js

const API_URL = "http://localhost:8000/api";

/**
 * Fonction pour la connexion d'un utilisateur (admin, superadmin, franchisé).
 * @param {string} email - L'email de l'utilisateur.
 * @param {string} password - Le mot de passe de l'utilisateur.
 * @returns {Promise<object>} Les données de réponse de l'API.
 */
export async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: `Erreur HTTP ${response.status}`
            }));
            throw new Error(error.message || "Erreur de connexion");
        }

        const data = await response.json();

        // Stocker le token dans localStorage
        if (data.access_token) {
            localStorage.setItem("access_token", data.access_token);
        }

        return data;
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        throw error;
    }
}

/**
 * Fonction pour récupérer les informations de l'utilisateur connecté.
 * @returns {Promise<object>} Les données de l'utilisateur.
 */
export async function getCurrentUser() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    try {
        const response = await fetch(`${API_URL}/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expiré, nettoyer le localStorage
                localStorage.removeItem("access_token");
                throw new Error("Session expirée, veuillez vous reconnecter");
            }
            const error = await response.json().catch(() => ({
                message: `Erreur HTTP ${response.status}`
            }));
            throw new Error(error.message || "Erreur lors de la récupération des données utilisateur");
        }

        return await response.json();
    } catch (error) {
        console.error("Erreur getCurrentUser:", error);
        throw error;
    }
}

/**
 * Fonction pour créer un intention de paiement Stripe.
 * @returns {Promise<object>} Les données de l'intention de paiement.
 */
export async function createPaymentIntent() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    try {
        const response = await fetch(`${API_URL}/franchisees/create-payment-intent`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: `Erreur HTTP ${response.status}`
            }));
            throw new Error(error.message || "Erreur lors de la création de l'intention de paiement");
        }

        return await response.json();
    } catch (error) {
        console.error("Erreur createPaymentIntent:", error);
        throw error;
    }
}

/**
 * Fonction pour soumettre une nouvelle demande de franchisé à l'API.
 * @param {object} formData - Les données du formulaire à envoyer.
 * @returns {Promise<object>} - La réponse de l'API.
 */
export const createFranchisee = async (formData) => {
    try {
        const response = await fetch(`${API_URL}/franchisees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const textResponse = await response.text();
            console.error('Réponse brute du serveur:', textResponse);

            try {
                const errorData = JSON.parse(textResponse);
                throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
            } catch (parseError) {
                throw new Error(`Erreur serveur: ${textResponse.substring(0, 200)}...`);
            }
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erreur dans createFranchisee:', error);
        throw error;
    }
};

/**
 * Fonction pour déconnecter l'utilisateur.
 */
export async function logout() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        return; // Pas de token, déjà déconnecté
    }

    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }
        });

        // Nettoyer le localStorage même si la requête échoue
        localStorage.removeItem("access_token");

        if (!response.ok) {
            console.warn("Erreur lors de la déconnexion côté serveur, mais token supprimé localement");
        }

        return true;
    } catch (error) {
        console.error("Erreur logout:", error);
        // Nettoyer quand même le localStorage
        localStorage.removeItem("access_token");
        throw error;
    }
}