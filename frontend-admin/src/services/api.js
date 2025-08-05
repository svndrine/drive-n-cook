// services/api.js

const API_URL = "http://localhost:8000/api";

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
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la récupération des franchisés");
    }

    return await response.json();
}

/**
 * Fonction pour changer le statut (actif/inactif) d'un franchisé.
 */
export async function toggleFranchiseeStatus(id, is_active) {
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${API_URL}/franchisees/${id}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active })
    });

    if (!response.ok) {
        const error = await response.json();
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
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la déconnexion");
    }

    return true;
}

/**
 * Récupère la liste des franchisés non activés.
 * @returns {Promise<array>} Liste des franchisés en attente de validation.
 */
export async function getUnvalidatedFranchisees() {
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${API_URL}/franchisees/unvalidated`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des franchisés non activés`);
    }

    return await response.json();
}


/**
 * Récupère la liste des franchisés activés (en attente de paiement).
 * @returns {Promise<array>} Liste des franchisés activés.
 */
export async function getValidatedFranchisees() {
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${API_URL}/franchisees/validated`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Erreur ${response.status} lors de la récupération des franchisés activés`);
    }

    return await response.json();
}
