import React from 'react';
import { useFranchisee } from '../context/FranchiseeContext.jsx'; // S'assurer que le chemin est correct
import { LogOut } from 'lucide-react';

/**
 * Composant du tableau de bord pour les franchisés.
 * Affiche un message de bienvenue et un bouton de déconnexion.
 */
function FranchiseeDashboard() {
    const { user, handleLogout } = useFranchisee();

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Chargement...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold">Bienvenue, {user.firstname}</h1>
                    <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition duration-200"
                    >
                        <LogOut size={20} className="mr-2" />
                        Déconnexion
                    </button>
                </div>
                <p className="text-lg text-gray-400">
                    Ceci est votre tableau de bord de franchisé. Vous êtes connecté et vous pouvez voir les informations essentielles ici.
                </p>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-700 p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-2">Informations utilisateur</h2>
                        <p className="text-gray-300">
                            <strong>Nom:</strong> {user.firstname} {user.lastname}
                        </p>
                        <p className="text-gray-300">
                            <strong>Email:</strong> {user.email}
                        </p>
                        <p className="text-gray-300">
                            <strong>Rôle:</strong> {user.role}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FranchiseeDashboard;
