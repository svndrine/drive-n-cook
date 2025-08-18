// frontend-admin/src/services/api.js

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
 * Fonction pour créer un nouvel administrateur.
 * @param {object} adminData - Les données du nouvel administrateur (firstname, lastname, email, password, password_confirmation).
 * @returns {Promise<object>} Les données de réponse de l'API.
 */
export async function createAdmin(adminData) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/admins`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(adminData),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la création de l'administrateur`);
    }

    return await response.json();
}

/**
 * Fonction pour récupérer la liste de tous les administrateurs.
 * @returns {Promise<array>} La liste des administrateurs.
 */
export async function getAdmins() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/admins`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des administrateurs`);
    }

    return await response.json();
}

/**
 * Fonction pour supprimer un administrateur.
 * @param {number} id - L'ID de l'administrateur à supprimer.
 * @returns {Promise<object>} Les données de réponse de l'API.
 */
export async function deleteAdmin(id) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/admins/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la suppression de l'administrateur`);
    }

    return await response.json();
}

/**
 * Fonction pour récupérer la liste des franchisés.
 */
export async function getFranchisees() {
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${API_URL}/franchisees`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || "Erreur lors de la récupération des franchisés");
    }

    return await response.json();
}

/**
 * Fonction pour valider un franchisé - utilise la route existante toggleStatus.
 * @param {number} id - L'ID du franchisé.
 * @returns {Promise<object>} Les données de réponse de l'API.
 */
export async function validateFranchisee(id) {
    console.log('validateFranchisee appelée avec id:', id);
    console.log('Calling toggleFranchiseeStatus with:', id, true);
    return await toggleFranchiseeStatus(id, true);
}

/**
 * Fonction pour rejeter un franchisé - utilise la nouvelle route reject.
 * @param {number} id - L'ID du franchisé.
 * @returns {Promise<object>} Les données de réponse de l'API.
 */
export async function rejectFranchisee(id) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/franchisees/${id}/reject`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || "Erreur lors du rejet du franchisé");
    }

    return await response.json();
}

/**
 * Fonction pour changer le statut actif/inactif d'un franchisé.
 * @param {number} id - L'ID du franchisé.
 * @param {boolean} is_active - Le nouveau statut actif.
 * @returns {Promise<object>} Les données de réponse de l'API.
 */
export async function toggleFranchiseeStatus(id, is_active) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    console.log('toggleFranchiseeStatus appelée');
    console.log('URL:', `${API_URL}/franchisees/${id}/status`);
    console.log('Méthode:', 'PATCH');
    console.log('Body:', JSON.stringify({ is_active }));

    const response = await fetch(`${API_URL}/franchisees/${id}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify({ is_active })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || "Erreur lors de la mise à jour du statut du franchisé");
    }

    return await response.json();
}

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
 * Récupère la liste des franchisés non validés.
 * @returns {Promise<array>} Liste des franchisés en attente de validation.
 */
export async function getUnvalidatedFranchisees() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/franchisees/unvalidated`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des franchisés non validés`);
    }

    return await response.json();
}

/**
 * Récupère la liste des franchisés validés (en attente de paiement).
 * @returns {Promise<array>} Liste des franchisés validés.
 */
export async function getValidatedFranchisees() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/franchisees/validated`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des franchisés validés`);
    }

    return await response.json();
}

/**
 * Récupère les informations détaillées d'un franchisé par son ID.
 * @param {number} id - L'ID du franchisé.
 * @returns {Promise<object>} Données complètes du franchisé.
 */
export async function getFranchiseeById(id) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/franchisees/${id}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération du franchisé`);
    }

    return await response.json();
}






// ===================================
// NOUVELLES FONCTIONS POUR LE SYSTÈME DE PAIEMENTS
// À ajouter dans votre frontend-admin/src/services/api.js
// ===================================

// =====================================
// FONCTIONS POUR LES ADMINISTRATEURS
// =====================================

/**
 * Obtenir les statistiques de paiements (admin uniquement)
 * @param {string} period - 'month', 'year' ou 'all'
 * @returns {Promise<object>} Statistiques des paiements
 */
export async function getPaymentStats(period = 'month') {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/admin/payments/stats?period=${period}`, {
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

/**
 * Obtenir toutes les transactions (admin uniquement)
 * @param {object} filters - Filtres optionnels (status, franchisee_id, per_page)
 * @returns {Promise<object>} Liste paginée des transactions
 */
export async function getAllTransactions(filters = {}) {
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
    const url = `${API_URL}/admin/payments/all-transactions${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des transactions`);
    }

    return await response.json();
}

/**
 * Obtenir tous les comptes franchisés (admin uniquement)
 * @param {object} filters - Filtres optionnels (status, per_page)
 * @returns {Promise<object>} Liste paginée des comptes
 */
export async function getAllFranchiseeAccounts(filters = {}) {
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
    const url = `${API_URL}/admin/payments/all-accounts${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des comptes`);
    }

    return await response.json();
}

/**
 * Calculer les royalties pour un franchisé (admin uniquement)
 * @param {number} franchiseeId - ID du franchisé
 * @param {number} declaredRevenue - Chiffre d'affaires déclaré
 * @param {string} period - Période (ex: "2025-01")
 * @returns {Promise<object>} Transaction de royalties créée
 */
export async function calculateRoyalties(franchiseeId, declaredRevenue, period) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/admin/payments/calculate-royalties`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify({
            franchisee_id: franchiseeId,
            declared_revenue: declaredRevenue,
            period: period
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors du calcul des royalties`);
    }

    return await response.json();
}

/**
 * Annuler une transaction (admin uniquement)
 * @param {number} transactionId - ID de la transaction
 * @returns {Promise<object>} Transaction annulée
 */
export async function cancelTransaction(transactionId) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/admin/payments/transactions/${transactionId}/cancel`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de l'annulation de la transaction`);
    }

    return await response.json();
}

/**
 * Créer un ajustement manuel de compte (admin uniquement)
 * @param {number} franchiseeId - ID du franchisé
 * @param {number} amount - Montant (positif)
 * @param {string} type - 'credit' ou 'debit'
 * @param {string} description - Description de l'ajustement
 * @returns {Promise<object>} Mouvement créé
 */
export async function createAccountAdjustment(franchiseeId, amount, type, description) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/admin/payments/account-adjustments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify({
            franchisee_id: franchiseeId,
            amount: amount,
            type: type,
            description: description
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de l'ajustement de compte`);
    }

    return await response.json();
}

// =====================================
// FONCTIONS POUR VOIR LES DONNÉES DES FRANCHISÉS
// (Accessibles aux admins pour consulter les données)
// =====================================

/**
 * Obtenir le dashboard d'un franchisé spécifique (admin regardant les données d'un franchisé)
 * @param {number} franchiseeId - ID du franchisé
 * @returns {Promise<object>} Dashboard du franchisé
 */
export async function getFranchiseeDashboard(franchiseeId) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/franchisees/${franchiseeId}/dashboard`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération du dashboard`);
    }

    return await response.json();
}

/**
 * Obtenir les transactions d'un franchisé spécifique
 * @param {number} franchiseeId - ID du franchisé
 * @param {object} filters - Filtres optionnels
 * @returns {Promise<object>} Transactions du franchisé
 */
export async function getFranchiseeTransactions(franchiseeId, filters = {}) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const queryParams = new URLSearchParams(filters);
    queryParams.append('franchisee_id', franchiseeId);

    const response = await fetch(`${API_URL}/admin/payments/all-transactions?${queryParams.toString()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des transactions`);
    }

    return await response.json();
}

/**
 * Obtenir les détails d'une transaction spécifique
 * @param {number} transactionId - ID de la transaction
 * @returns {Promise<object>} Détails de la transaction
 */
export async function getTransactionDetails(transactionId) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/payments/transactions/${transactionId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération de la transaction`);
    }

    return await response.json();
}

/**
 * Obtenir l'historique des mouvements de compte d'un franchisé
 * @param {number} franchiseeId - ID du franchisé
 * @param {object} filters - Filtres optionnels
 * @returns {Promise<object>} Historique des mouvements
 */
export async function getFranchiseeAccountMovements(franchiseeId, filters = {}) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    // Note: Cette route devra être ajoutée côté backend pour les admins
    const queryParams = new URLSearchParams(filters);

    const response = await fetch(`${API_URL}/admin/franchisees/${franchiseeId}/account-movements?${queryParams.toString()}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des mouvements`);
    }

    return await response.json();
}

// =====================================
// FONCTIONS UTILITAIRES
// =====================================

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
 * Obtenir la couleur du badge selon le statut
 * @param {string} status - Statut de la transaction
 * @returns {string} Classe CSS pour la couleur
 */
export function getTransactionStatusColor(status) {
    const colors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'processing': 'bg-blue-100 text-blue-800',
        'completed': 'bg-green-100 text-green-800',
        'failed': 'bg-red-100 text-red-800',
        'cancelled': 'bg-gray-100 text-gray-800',
        'refunded': 'bg-purple-100 text-purple-800'
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Obtenir le libellé français du statut
 * @param {string} status - Statut de la transaction
 * @returns {string} Libellé en français
 */
export function getTransactionStatusLabel(status) {
    const labels = {
        'pending': 'En attente',
        'processing': 'En cours',
        'completed': 'Terminé',
        'failed': 'Échoué',
        'cancelled': 'Annulé',
        'refunded': 'Remboursé'
    };

    return labels[status] || 'Inconnu';
}

// =====================================
// NOUVELLES FONCTIONS POUR LA GESTION DES ENTREPÔTS ET PRODUITS
// À ajouter à la fin de votre frontend-admin/src/services/api.js
// =====================================

// =====================================
// FONCTIONS POUR LES ENTREPÔTS
// =====================================

/**
 * Obtenir la liste des entrepôts
 * @param {object} filters - Filtres optionnels (active, search, with_stats)
 * @returns {Promise<object>} Liste des entrepôts
 */
export async function getWarehouses(filters = {}) {
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
    const url = `${API_URL}/warehouses${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
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
 * @param {object} options - Options (with_stocks, with_orders)
 * @returns {Promise<object>} Détails de l'entrepôt
 */
export async function getWarehouse(id, options = {}) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const queryParams = new URLSearchParams(options);
    const queryString = queryParams.toString();
    const url = `${API_URL}/warehouses/${id}${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
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
 * Créer un nouvel entrepôt (admin uniquement)
 * @param {object} warehouseData - Données de l'entrepôt
 * @returns {Promise<object>} Entrepôt créé
 */
export async function createWarehouse(warehouseData) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/warehouses`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify(warehouseData)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la création de l'entrepôt`);
    }

    return await response.json();
}

/**
 * Mettre à jour un entrepôt (admin uniquement)
 * @param {number} id - ID de l'entrepôt
 * @param {object} warehouseData - Nouvelles données
 * @returns {Promise<object>} Entrepôt mis à jour
 */
export async function updateWarehouse(id, warehouseData) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/warehouses/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify(warehouseData)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la mise à jour de l'entrepôt`);
    }

    return await response.json();
}

/**
 * Supprimer un entrepôt (admin uniquement)
 * @param {number} id - ID de l'entrepôt
 * @returns {Promise<object>} Confirmation de suppression
 */
export async function deleteWarehouse(id) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/warehouses/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la suppression de l'entrepôt`);
    }

    return await response.json();
}

/**
 * Obtenir les stocks d'un entrepôt
 * @param {number} warehouseId - ID de l'entrepôt
 * @param {object} filters - Filtres optionnels
 * @returns {Promise<object>} Stocks de l'entrepôt
 */
export async function getWarehouseStocks(warehouseId, filters = {}) {
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
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération de l'aperçu des stocks`);
    }

    return await response.json();
}

/**
 * Obtenir les alertes de stock globales
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
 * Effectuer un ajustement de stock (admin uniquement)
 * @param {object} adjustmentData - {warehouse_id, product_id, new_quantity, reason}
 * @returns {Promise<object>} Résultat de l'ajustement
 */
export async function adjustStock(adjustmentData) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/stock/adjustment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify(adjustmentData)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de l'ajustement de stock`);
    }

    return await response.json();
}

/**
 * Entrée de stock (réapprovisionnement) (admin uniquement)
 * @param {object} stockData - {warehouse_id, product_id, quantity, reason, reference}
 * @returns {Promise<object>} Résultat de l'entrée
 */
export async function stockIn(stockData) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/stock/stock-in`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify(stockData)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de l'entrée de stock`);
    }

    return await response.json();
}

/**
 * Sortie de stock manuelle (admin uniquement)
 * @param {object} stockData - {warehouse_id, product_id, quantity, reason}
 * @returns {Promise<object>} Résultat de la sortie
 */
export async function stockOut(stockData) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/stock/stock-out`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify(stockData)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la sortie de stock`);
    }

    return await response.json();
}

/**
 * Transfert de stock entre entrepôts (admin uniquement)
 * @param {object} transferData - {from_warehouse_id, to_warehouse_id, product_id, quantity, reason}
 * @returns {Promise<object>} Résultat du transfert
 */
export async function transferStock(transferData) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/stock/transfer`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify(transferData)
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors du transfert de stock`);
    }

    return await response.json();
}

/**
 * Obtenir la valorisation des stocks
 * @param {object} filters - Filtres optionnels (warehouse_id)
 * @returns {Promise<object>} Valorisation des stocks
 */
export async function getStockValuation(filters = {}) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const queryParams = new URLSearchParams(filters);
    const queryString = queryParams.toString();
    const url = `${API_URL}/stock/valuation${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération de la valorisation`);
    }

    return await response.json();
}






/**
 * Obtenir la liste des commandes franchisés (admin)
 * @param {object} filters - Filtres optionnels (status, warehouse_id, franchisee_id, date_from, date_to)
 * @returns {Promise<object>} Liste des commandes
 */
export async function getFranchiseOrders(filters = {}) {
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

    console.log('URL appelée:', url); // DEBUG

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
 * Obtenir les détails d'une commande
 * @param {number} orderId - ID de la commande
 * @returns {Promise<object>} Détails de la commande
 */
export async function getFranchiseOrder(orderId) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/orders/${orderId}`, {
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
 * Confirmer une commande (admin uniquement)
 * @param {number} orderId - ID de la commande
 * @returns {Promise<object>} Commande confirmée
 */
export async function confirmOrder(orderId) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/orders/${orderId}/confirm`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la confirmation de la commande`);
    }

    return await response.json();
}

/**
 * Mettre à jour le statut d'une commande (admin uniquement)
 * @param {number} orderId - ID de la commande
 * @param {string} status - Nouveau statut (confirmed, preparing, ready, delivered)
 * @returns {Promise<object>} Commande mise à jour
 */
export async function updateOrderStatus(orderId, status) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify({ status })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la mise à jour du statut`);
    }

    return await response.json();
}

/**
 * Annuler une commande (admin uniquement)
 * @param {number} orderId - ID de la commande
 * @param {string} reason - Raison de l'annulation
 * @returns {Promise<object>} Commande annulée
 */
export async function cancelOrder(orderId, reason = '') {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify({ reason })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de l'annulation de la commande`);
    }

    return await response.json();
}

/**
 * Obtenir les statistiques des commandes (admin uniquement)
 * @param {object} filters - Filtres optionnels (date_from, date_to, warehouse_id)
 * @returns {Promise<object>} Statistiques des commandes
 */
export async function getOrderStats(filters = {}) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        throw new Error("Aucun token d'accès trouvé.");
    }

    const queryParams = new URLSearchParams(filters);
    const queryString = queryParams.toString();
    const url = `${API_URL}/orders/stats${queryString ? '?' + queryString : ''}`;

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