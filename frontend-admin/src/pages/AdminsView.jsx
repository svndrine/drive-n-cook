import React from 'react';
import { Plus } from 'lucide-react';

/**
 * Composant de la vue "Gestion des administrateurs".
 * @param {object} props - Propriétés du composant.
 * @param {array} props.admins - Liste des administrateurs.
 * @param {string} props.theme - Thème actuel.
 * @param {object} props.user - Informations de l'utilisateur pour les droits d'accès.
 */
const AdminsView = ({ admins, theme, user }) => {
    const contentBgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
    const contentTextClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const cardBgClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const tableHeaderBgClass = theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200';
    const tableBodyBgClass = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
    const tableDivideClass = theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200';
    const tableTextClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';

    return (
        <div className={`p-8 space-y-8 ${contentBgClass} ${contentTextClass}`}>
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Gestion des administrateurs</h2>
                {user?.role === 'superadmin' && (
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-300 flex items-center">
                        <Plus size={16} className="mr-2" />
                        Nouvel Admin
                    </button>
                )}
            </div>
            {user?.role !== 'superadmin' ? (
                <p className="text-red-400 font-medium">Vous n'avez pas les droits pour accéder à cette section.</p>
            ) : (
                <div className={`overflow-x-auto rounded-xl shadow-md border ${cardBgClass}`}>
                    <table className={`min-w-full divide-y ${tableDivideClass}`}>
                        <thead className={tableHeaderBgClass}>
                        <tr>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>Prénom Nom</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>Email</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>Rôle</th>
                            <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>Actions</th>
                        </tr>
                        </thead>
                        <tbody className={`${tableBodyBgClass} ${tableDivideClass} ${tableTextClass}`}>
                        {admins.map(admin => (
                            <tr key={admin.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{admin.first_name} {admin.last_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{admin.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${admin.role === 'superadmin' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-white'}`}>
                                        {admin.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {admin.role !== 'superadmin' && (
                                        <button
                                            onClick={() => console.log(`Supprimer l'admin ${admin.id}`)}
                                            className="text-red-500 hover:text-red-300 transition-colors duration-200"
                                        >
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
        </div>
    );
};

export default AdminsView;
