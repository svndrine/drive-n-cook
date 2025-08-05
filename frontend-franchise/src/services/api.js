// src/services/api.js

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
 * Cette action est réservée aux superadmins.
 * @param {object} adminData - Les données du nouvel administrateur.
 * @returns {Promise<object>} Les données de réponse de l'API.
 */
export async function createAdmin(adminData) {
    // Utilise le token stocké dans UserContext.jsx
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${API_URL}/admins`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(adminData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la création de l'admin");
    }

    return await response.json();
}

/**
 * Fonction pour supprimer un administrateur.
 * ATTENTION : Il n'y a pas de route correspondante dans le backend.
 * Cette fonction ne fonctionnera pas tant que la route et la méthode du contrôleur n'auront pas été ajoutées.
 * @param {number} adminId - L'ID de l'administrateur à supprimer.
 * @returns {Promise<object>} Les données de réponse de l'API.
 */
export async function deleteAdmin(adminId) {
    // Utilise le token stocké dans UserContext.jsx
    const token = localStorage.getItem("access_token");

    const response = await fetch(`${API_URL}/admins/${adminId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la suppression de l'admin");
    }

    return await response.json();
}


/**
 * Fonction pour soumettre une nouvelle demande de franchisé à l'API.
 * @param {object} formData - Les données du formulaire à envoyer.
 * @returns {Promise<object>} - La réponse de l'API.
 */
export const createFranchisee = async (formData) => {
    try {
        const response = await fetch('http://localhost:8000/api/franchisees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        // Parse la réponse JSON
        const data = await response.json();

        // Si la réponse n'est pas "ok" (statut HTTP >= 400), lance une erreur
        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de la soumission du formulaire');
        }

        return data; // Retourne la réponse en cas de succès
    } catch (error) {
        // Renvoie l'erreur pour qu'elle soit gérée par le composant appelant
        throw error;
    }
};
