// frontend-franchise/src/services/api.js

// Configuration pour les appels API
const API_CONFIG = {
    development: {
        baseURL: 'http://localhost:8000/api',
        timeout: 10000,
    },
    production: {
        baseURL: 'http://193.70.0.27:8000/api',
        timeout: 10000,
    }
};

// Détection automatique de l'environnement
const isDevelopment =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

export const apiConfig = isDevelopment
    ? API_CONFIG.development
    : API_CONFIG.production;

// URL de base pour compatibilité avec le code existant
export const API_URL = apiConfig.baseURL;

// Client API configuré
export const apiClient = {
    baseURL: apiConfig.baseURL,

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            timeout: apiConfig.timeout,
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, finalOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    },

    // Méthodes utilitaires
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },

    post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    },
};

// Variables d'environnement pour Vite
export const ENV = {
    API_BASE_URL: apiConfig.baseURL,
    IS_DEVELOPMENT: isDevelopment,
    APP_URL: isDevelopment
        ? `http://localhost:${window.location.port}`
        : `http://193.70.0.27:${window.location.port}`,
};




/**
 * Fonction pour la connexion d'un utilisateur (admin, superadmin, franchisé).
 * @param {string} email - L'email de l'utilisateur.
 * @param {string} password - Le mot de passe de l'utilisateur.
 * @returns {Promise<object>} Les données de réponse de l'API.
 */
export async function login(email, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur de connexion");
    }

    return await response.json();
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

/**
 * Fonction pour déconnecter l'utilisateur.
 */
export async function logout() {
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || "Erreur lors de la déconnexion");
    }

    return true;
}


/**
 * Récupère les données du tableau de bord pour le franchisé connecté.
 * @returns {Promise<object>}
 */
export async function getFranchiseeDashboardData() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/payments/dashboard`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `Erreur HTTP ${response.status}` }));
        throw new Error(error.message || "Erreur lors de la récupération des données du tableau de bord.");
    }

    return await response.json();
}