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



// =====================================
// NOUVELLES FONCTIONS POUR LES FRANCHISÉS - GESTION DES COMMANDES ET CATALOGUES
// À ajouter à la fin de votre frontend-franchise/src/services/api.js
// =====================================

// =====================================
// FONCTIONS POUR CONSULTER LES ENTREPÔTS ET CATALOGUES
// =====================================

/**
 * Obtenir la liste des entrepôts disponibles
 * @returns {Promise<object>} Liste des entrepôts
 */
export async function getWarehouses() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/warehouses`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des entrepôts`);
    }

    return await response.json();
}

/**
 * Obtenir les détails d'un entrepôt
 * @param {number} id - ID de l'entrepôt
 * @returns {Promise<object>} Détails de l'entrepôt
 */
export async function getWarehouse(id) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/warehouses/${id}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération de l'entrepôt`);
    }

    return await response.json();
}

/**
 * Obtenir le catalogue de produits d'un entrepôt avec stocks disponibles
 * @param {number} warehouseId - ID de l'entrepôt
 * @param {object} filters - Filtres optionnels (category_id, type, available_only)
 * @returns {Promise<object>} Catalogue avec stocks
 */
export async function getWarehouseCatalog(warehouseId, filters = {}) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value);
        }
    });

    const queryString = queryParams.toString();
    const url = `${API_URL}/products/warehouse/${warehouseId}/catalog${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération du catalogue`);
    }

    return await response.json();
}

/**
 * Obtenir la liste des catégories de produits
 * @returns {Promise<object>} Liste des catégories
 */
export async function getProductCategories() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/product-categories?active=true`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des catégories`);
    }

    return await response.json();
}

// =====================================
// FONCTIONS POUR GÉRER SES COMMANDES
// =====================================

/**
 * Obtenir la liste de ses commandes
 * @param {object} filters - Filtres optionnels (status, warehouse_id, date_from, date_to)
 * @returns {Promise<object>} Liste paginée des commandes
 */
export async function getMyOrders(filters = {}) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value);
        }
    });

    const queryString = queryParams.toString();
    const url = `${API_URL}/orders${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des commandes`);
    }

    return await response.json();
}

/**
 * Obtenir les détails d'une de ses commandes
 * @param {number} id - ID de la commande
 * @returns {Promise<object>} Détails de la commande
 */
export async function getMyOrder(id) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/orders/${id}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération de la commande`);
    }

    return await response.json();
}

/**
 * Créer une nouvelle commande (brouillon)
 * @param {object} orderData - {warehouse_id, delivery_date, delivery_address, notes}
 * @returns {Promise<object>} Commande créée
 */
export async function createOrder(orderData) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify(orderData)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la création de la commande`);
    }

    return await response.json();
}

/**
 * Mettre à jour une commande (seulement si en brouillon)
 * @param {number} id - ID de la commande
 * @param {object} orderData - Nouvelles données
 * @returns {Promise<object>} Commande mise à jour
 */
export async function updateOrder(id, orderData) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/orders/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify(orderData)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la mise à jour de la commande`);
    }

    return await response.json();
}

/**
 * Ajouter un produit au panier/commande
 * @param {number} orderId - ID de la commande
 * @param {object} itemData - {product_id, quantity}
 * @returns {Promise<object>} Ligne de commande créée
 */
export async function addItemToOrder(orderId, itemData) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/orders/${orderId}/items`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify(itemData)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de l'ajout du produit`);
    }

    return await response.json();
}

/**
 * Modifier la quantité d'un produit dans le panier
 * @param {number} orderId - ID de la commande
 * @param {number} itemId - ID de la ligne de commande
 * @param {object} itemData - {quantity}
 * @returns {Promise<object>} Ligne de commande mise à jour
 */
export async function updateOrderItem(orderId, itemId, itemData) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/orders/${orderId}/items/${itemId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify(itemData)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la modification de la quantité`);
    }

    return await response.json();
}

/**
 * Supprimer un produit du panier
 * @param {number} orderId - ID de la commande
 * @param {number} itemId - ID de la ligne de commande
 * @returns {Promise<object>} Confirmation de suppression
 */
export async function removeItemFromOrder(orderId, itemId) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/orders/${orderId}/items/${itemId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la suppression du produit`);
    }

    return await response.json();
}

/**
 * Soumettre une commande pour validation (passage de draft à pending)
 * @param {number} id - ID de la commande
 * @returns {Promise<object>} Commande soumise
 */
export async function submitOrder(id) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/orders/${id}/submit`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la soumission de la commande`);
    }

    return await response.json();
}

/**
 * Annuler une commande
 * @param {number} id - ID de la commande
 * @returns {Promise<object>} Commande annulée
 */
export async function cancelOrder(id) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/orders/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de l'annulation de la commande`);
    }

    return await response.json();
}

/**
 * Obtenir ses statistiques de commandes
 * @param {object} filters - Filtres optionnels (date_from, date_to)
 * @returns {Promise<object>} Statistiques
 */
export async function getMyOrdersStats(filters = {}) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const queryParams = new URLSearchParams(filters);
    const queryString = queryParams.toString();
    const url = `${API_URL}/orders/stats/summary${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des statistiques`);
    }

    return await response.json();
}

// =====================================
// FONCTIONS DE CONSULTATION (LECTURE SEULE)
// =====================================

/**
 * Obtenir les alertes de stock (consultation)
 * @param {object} filters - Filtres optionnels (warehouse_id)
 * @returns {Promise<object>} Alertes de stock
 */
export async function getStockAlerts(filters = {}) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const queryParams = new URLSearchParams(filters);
    const queryString = queryParams.toString();
    const url = `${API_URL}/stock/alerts${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des alertes`);
    }

    return await response.json();
}

/**
 * Obtenir un aperçu des stocks (consultation)
 * @param {object} filters - Filtres optionnels
 * @returns {Promise<object>} Aperçu des stocks
 */
export async function getStockOverview(filters = {}) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const queryParams = new URLSearchParams(filters);
    const queryString = queryParams.toString();
    const url = `${API_URL}/stock/overview${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération de l'aperçu`);
    }

    return await response.json();
}

// =====================================
// FONCTIONS UTILITAIRES POUR LES FRANCHISÉS
// =====================================

/**
 * Obtenir la couleur du badge selon le statut de commande
 * @param {string} status - Statut de la commande
 * @returns {string} Classe CSS pour la couleur
 */
export function getOrderStatusColor(status) {
    const colors = {
        'draft': 'bg-gray-100 text-gray-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'confirmed': 'bg-blue-100 text-blue-800',
        'preparing': 'bg-indigo-100 text-indigo-800',
        'ready': 'bg-green-100 text-green-800',
        'delivered': 'bg-emerald-100 text-emerald-800',
        'cancelled': 'bg-red-100 text-red-800'
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtenir le libellé français du statut de commande
 * @param {string} status - Statut de la commande
 * @returns {string} Libellé en français
 */
export function getOrderStatusLabel(status) {
    const labels = {
        'draft': 'Brouillon',
        'pending': 'En attente de validation',
        'confirmed': 'Confirmée',
        'preparing': 'En préparation',
        'ready': 'Prête à récupérer',
        'delivered': 'Livrée',
        'cancelled': 'Annulée'
    };

    return labels[status] || 'Inconnu';
}

/**
 * Obtenir le libellé français du type de produit
 * @param {string} type - Type de produit
 * @returns {string} Libellé en français
 */
export function getProductTypeLabel(type) {
    const labels = {
        'ingredient': 'Ingrédient',
        'prepared_dish': 'Plat préparé',
        'beverage': 'Boisson'
    };

    return labels[type] || 'Inconnu';
}

/**
 * Calculer le pourcentage de produits obligatoires dans une commande
 * @param {array} orderItems - Liste des articles de commande
 * @returns {number} Pourcentage de produits obligatoires
 */
export function calculateMandatoryPercentage(orderItems) {
    if (!orderItems || orderItems.length === 0) return 0;

    const totalValue = orderItems.reduce((sum, item) => sum + (item.total_ht || 0), 0);
    const mandatoryValue = orderItems
        .filter(item => item.product?.is_mandatory)
        .reduce((sum, item) => sum + (item.total_ht || 0), 0);

    return totalValue > 0 ? (mandatoryValue / totalValue) * 100 : 0;
}

/**
 * Vérifier si le ratio 80/20 est respecté
 * @param {array} orderItems - Liste des articles de commande
 * @returns {boolean} True si le ratio est respecté
 */
export function isRatio8020Respected(orderItems) {
    return calculateMandatoryPercentage(orderItems) >= 80;
}

/**
 * Obtenir le message d'état du ratio 80/20
 * @param {array} orderItems - Liste des articles de commande
 * @returns {object} {isValid, percentage, message, color}
 */
export function getRatio8020Status(orderItems) {
    const percentage = calculateMandatoryPercentage(orderItems);
    const isValid = percentage >= 80;

    return {
        isValid,
        percentage: Math.round(percentage * 100) / 100,
        message: isValid
            ? `✅ Ratio respecté (${percentage.toFixed(1)}% de produits obligatoires)`
            : `⚠️ Ratio non respecté (${percentage.toFixed(1)}% de produits obligatoires, minimum 80%)`,
        color: isValid ? 'text-green-600' : 'text-red-600'
    };
}

/**
 * Formater un montant en euros
 * @param {number} amount - Montant à formater
 * @returns {string} Montant formaté
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

/**
 * Formater une date pour l'affichage français
 * @param {string|Date} date - Date à formater
 * @returns {string} Date formatée
 */
export function formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

/**
 * Formater une date et heure pour l'affichage français
 * @param {string|Date} date - Date à formater
 * @returns {string} Date et heure formatées
 */
export function formatDateTime(date) {
    return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

/**
 * Formater une quantité avec son unité
 * @param {number} quantity - Quantité
 * @param {string} unit - Unité
 * @returns {string} Quantité formatée
 */
export function formatQuantity(quantity, unit) {
    return `${quantity} ${unit}${quantity > 1 && !unit.endsWith('s') ? 's' : ''}`;
}

/**
 * Vérifier si une commande peut être modifiée
 * @param {string} status - Statut de la commande
 * @returns {boolean} True si modifiable
 */
export function canEditOrder(status) {
    return ['draft', 'pending'].includes(status);
}

/**
 * Vérifier si une commande peut être annulée
 * @param {string} status - Statut de la commande
 * @returns {boolean} True si annulable
 */
export function canCancelOrder(status) {
    return ['draft', 'pending', 'confirmed'].includes(status);
}

/**
 * Obtenir les actions possibles pour une commande
 * @param {object} order - Objet commande
 * @returns {array} Liste des actions possibles
 */
export function getOrderActions(order) {
    const actions = [];

    if (canEditOrder(order.status)) {
        actions.push({ key: 'edit', label: 'Modifier', color: 'blue' });
    }

    if (order.status === 'draft' && order.items?.length > 0) {
        actions.push({ key: 'submit', label: 'Soumettre', color: 'green' });
    }

    if (canCancelOrder(order.status)) {
        actions.push({ key: 'cancel', label: 'Annuler', color: 'red' });
    }

    actions.push({ key: 'view', label: 'Voir détails', color: 'gray' });

    return actions;
}






/**
 * Obtenir ses factures d'achat de stocks
 */
export async function getStockPurchases(filters = {}) {
    const token = localStorage.getItem("access_token");
    const queryParams = new URLSearchParams(filters);
    const url = `${API_URL}/payments/stock-purchases${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    return await response.json();
}

/**
 * Payer une facture de stock
 */
export async function payStockInvoice(transactionId) {
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${API_URL}/payments/pay-stock-invoice/${transactionId}`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    return await response.json();
}