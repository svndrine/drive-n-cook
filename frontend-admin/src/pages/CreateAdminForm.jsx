import React, { useState } from 'react';
import { createAdmin } from '../services/api.js'; // Import de la fonction d'API

const CreateAdminForm = ({ theme, onAdminCreated, onCancel }) => {
    // États pour gérer les champs du formulaire, avec les noms corrigés
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    // États pour gérer l'affichage des messages de statut (chargement, erreur, succès)
    const [status, setStatus] = useState({
        loading: false,
        message: null,
        isError: false,
    });

    // Classes CSS basées sur le thème
    const cardBgClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const inputBgClass = theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900';
    const labelTextClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';

    // Gestion de la modification des champs du formulaire
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Gestion de la soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, message: null, isError: false });

        try {
            // Appelle la fonction d'API pour créer l'administrateur
            const response = await createAdmin(formData);
            setStatus({
                loading: false,
                message: response.message || "Administrateur créé avec succès.",
                isError: false,
            });
            // Réinitialise le formulaire après un succès
            setFormData({
                firstname: '',
                lastname: '',
                email: '',
                password: '',
                password_confirmation: '',
            });
            // Appelle la fonction parent pour rafraîchir la liste des admins
            if (onAdminCreated) {
                onAdminCreated();
            }
        } catch (error) {
            console.error('Erreur de création d\'admin:', error);
            setStatus({
                loading: false,
                message: error.message || "Erreur lors de la création de l'administrateur.",
                isError: true,
            });
        }
    };

    return (
        <div className={`p-6 rounded-xl shadow-md border ${cardBgClass}`}>
            <h3 className="text-2xl font-semibold mb-6">Créer un nouvel administrateur</h3>
            {status.message && (
                <div className={`p-4 rounded-md font-medium text-center mb-4 ${status.isError ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {status.message}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="firstname" className={`block text-sm font-medium ${labelTextClass}`}>
                        Prénom
                    </label>
                    <input
                        type="text"
                        id="firstname"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleChange}
                        required
                        className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputBgClass}`}
                    />
                </div>
                <div>
                    <label htmlFor="lastname" className={`block text-sm font-medium ${labelTextClass}`}>
                        Nom
                    </label>
                    <input
                        type="text"
                        id="lastname"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleChange}
                        required
                        className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputBgClass}`}
                    />
                </div>
                <div>
                    <label htmlFor="email" className={`block text-sm font-medium ${labelTextClass}`}>
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputBgClass}`}
                    />
                </div>
                <div>
                    <label htmlFor="password" className={`block text-sm font-medium ${labelTextClass}`}>
                        Mot de passe
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength="8"
                        className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputBgClass}`}
                    />
                </div>
                <div>
                    <label htmlFor="password_confirmation" className={`block text-sm font-medium ${labelTextClass}`}>
                        Confirmer le mot de passe
                    </label>
                    <input
                        type="password"
                        id="password_confirmation"
                        name="password_confirmation"
                        value={formData.password_confirmation}
                        onChange={handleChange}
                        required
                        minLength="8"
                        className={`mt-1 block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputBgClass}`}
                    />
                </div>
                <button
                    type="submit"
                    disabled={status.loading}
                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-300 ${status.loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {status.loading ? 'Création...' : 'Créer l\'administrateur'}
                </button>
            </form>
        </div>
    );
};

export default CreateAdminForm;