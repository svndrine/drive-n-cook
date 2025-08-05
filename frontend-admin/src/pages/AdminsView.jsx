import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import CreateAdminForm from './CreateAdminForm.jsx';
import { getAdmins, deleteAdmin } from '../services/api.js';

/**
 * Composant de la vue "Gestion des administrateurs".
 * @param {object} props - Propriétés du composant.
 * @param {string} props.theme - Thème actuel.
 * @param {object} props.user - Informations de l'utilisateur pour les droits d'accès.
 */
const AdminsView = ({ theme, user }) => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [adminToDelete, setAdminToDelete] = useState(null);

    // Fonction pour rafraîchir la liste des administrateurs
    const fetchAdmins = async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedAdmins = await getAdmins();
            setAdmins(fetchedAdmins);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour supprimer un administrateur
    const handleDeleteAdmin = async () => {
        if (!adminToDelete) return;

        try {
            await deleteAdmin(adminToDelete.id);
            fetchAdmins();
            setShowDeleteModal(false);
            setAdminToDelete(null);
        } catch (err) {
            setError(err.message);
        }
    };

    // Ouvre la modale de confirmation de suppression
    const confirmDelete = (admin) => {
        setAdminToDelete(admin);
        setShowDeleteModal(true);
    };

    // Charge la liste des administrateurs au montage du composant si l'utilisateur est superadmin
    useEffect(() => {
        if (user?.role === 'superadmin') {
            fetchAdmins();
        }
    }, [user]);

    const contentBgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
    const contentTextClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const cardBgClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const tableHeaderBgClass = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200';
    const tableBodyBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const tableDivideClass = theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200';
    const tableTextClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';

    if (loading) {
        return <div className="p-8 text-center text-lg">Chargement des administrateurs...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Erreur : {error}</div>;
    }

    if (user?.role !== 'superadmin') {
        return <div className="p-8 text-center text-red-500">Accès refusé. Seul un super-administrateur peut voir cette page.</div>;
    }

    return (
        <div className={`p-8 space-y-8 ${contentBgClass} ${contentTextClass}`}>
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Gestion des Administrateurs</h1>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 transition-colors duration-200"
                >
                    {showCreateForm ? <X size={20} /> : <Plus size={20} />}
                    <span className="ml-2">{showCreateForm ? 'Annuler' : 'Ajouter un administrateur'}</span>
                </button>
            </div>

            {showCreateForm && (
                <div className={`mt-4 p-6 rounded-xl shadow-md border ${cardBgClass}`}>
                    <CreateAdminForm
                        theme={theme}
                        onAdminCreated={() => {
                            fetchAdmins();
                            setShowCreateForm(false);
                        }}
                    />
                </div>
            )}

            {admins.length === 0 ? (
                <div className="text-center p-12 text-gray-500">
                    <p className="text-lg">Aucun administrateur trouvé.</p>
                </div>
            ) : (
                <div className={`overflow-hidden rounded-lg border ${cardBgClass}`}>
                    <table className={`min-w-full divide-y ${tableDivideClass}`}>
                        <thead className={tableHeaderBgClass}>
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                Nom
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                Rôle
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                        </thead>
                        <tbody className={`divide-y ${tableDivideClass} ${tableBodyBgClass} ${tableTextClass}`}>
                        {admins.map(admin => (
                            <tr key={admin.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{admin.firstname} {admin.lastname}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{admin.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.role === 'superadmin' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-white'}`}>
                                            {admin.role}
                                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {admin.role !== 'superadmin' && (
                                        <button
                                            onClick={() => confirmDelete(admin)}
                                            className="text-red-500 hover:text-red-300 transition-colors duration-200 flex items-center"
                                        >
                                            <Trash2 size={16} className="mr-1" />
                                            Supprimer
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de confirmation de suppression */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                    <div className={`p-8 rounded-lg shadow-xl w-full max-w-sm ${cardBgClass} text-center`}>
                        <h3 className="text-lg font-bold mb-4">Confirmer la suppression</h3>
                        <p className="mb-6">Êtes-vous sûr de vouloir supprimer l'administrateur {adminToDelete?.firstname} {adminToDelete?.lastname}?</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 border rounded-md transition-colors duration-200 hover:bg-gray-700"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteAdmin}
                                className="px-4 py-2 bg-red-600 text-white rounded-md transition-colors duration-200 hover:bg-red-700"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminsView;
