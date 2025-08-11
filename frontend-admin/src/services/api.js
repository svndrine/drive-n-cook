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

    // Correction de l'URL - ajout du / manquant
    const response = await fetch(`${API_URL}/franchisees/${id}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        },
        body: JSON.stringify({ is_active })
    });

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