// src/pages/AccountView.jsx
import React, { useState } from 'react';

/**
 * Vue pour la gestion du compte personnel du franchisé.
 * Cette version est une maquette pour la consultation et la modification
 * des informations personnelles.
 */
function AccountView() {
    // État pour gérer le mode d'édition
    const [isEditing, setIsEditing] = useState(false);
    // État pour les données du franchisé (remplacez par les données réelles de l'API)
    const [franchiseeData, setFranchiseeData] = useState({
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@franchise.fr',
        phone: '06 12 34 56 78',
        address: '123 Rue de la Franchise',
        city: 'Paris',
        zipCode: '75001'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFranchiseeData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSave = () => {
        // Logique pour sauvegarder les données via l'API
        console.log('Sauvegarde des données:', franchiseeData);
        setIsEditing(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Mon Compte</h2>
            <div className="space-y-4">
                {/* Affichage des informations */}
                {!isEditing ? (
                    <>
                        <p><strong>Nom :</strong> {franchiseeData.firstName}</p>
                        <p><strong>Prénom :</strong> {franchiseeData.lastName}</p>
                        <p><strong>Email :</strong> {franchiseeData.email}</p>
                        <p><strong>Téléphone :</strong> {franchiseeData.phone}</p>
                        <p><strong>Adresse :</strong> {franchiseeData.address}, {franchiseeData.zipCode} {franchiseeData.city}</p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            Modifier mes informations
                        </button>
                    </>
                ) : (
                    <>
                        {/* Formulaire de modification */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
                            <input
                                type="text"
                                name="lastName"
                                value={franchiseeData.lastName}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</label>
                            <input
                                type="text"
                                name="firstName"
                                value={franchiseeData.firstName}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        {/* Ajoutez les autres champs ici */}
                        <div className="flex space-x-4 mt-4">
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                Enregistrer
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AccountView;
