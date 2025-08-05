import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Info, Mail } from 'lucide-react';

// Composant pour afficher les détails d'un franchisé dans une modale
const FranchiseeDetailsModal = ({ isOpen, onClose, franchisee, theme }) => {
    if (!isOpen || !franchisee) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4">
            <div className={`rounded-lg shadow-xl p-6 w-full max-w-lg ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                <div className={`flex justify-between items-center border-b pb-3 mb-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Détails du franchisé</h3>
                    <button onClick={onClose} className={`text-gray-400 hover:text-gray-100`}>
                        <X size={24} />
                    </button>
                </div>
                <div className={`space-y-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p><strong>Nom complet:</strong> {franchisee.first_name} {franchisee.last_name}</p>
                    <p><strong>Email:</strong> {franchisee.email}</p>
                    <p><strong>Téléphone:</strong> {franchisee.phone}</p>
                    <p><strong>Adresse:</strong> {franchisee.address}, {franchisee.zip_code} {franchisee.city}</p>
                    <p><strong>Situation actuelle:</strong> {franchisee.current_situation}</p>
                    <p><strong>Zone souhaitée:</strong> {franchisee.desired_zone}</p>
                    <p><strong>Contribution financière:</strong> {franchisee.financial_contribution}</p>
                    <div className={`mt-4 font-bold text-center p-2 rounded-md ${franchisee.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        Statut : {franchisee.is_active ? 'Actif' : 'Inactif'}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Composant de la vue "Gestion des franchisés".
 * @param {object} props - Propriétés du composant.
 * @param {array} props.franchisees - Liste des franchisés.
 * @param {string} props.theme - Thème actuel.
 * @param {function} props.toggleActiveStatus - Fonction pour changer le statut d'un franchisé.
 */
const FranchiseesView = ({ franchisees, theme, toggleActiveStatus }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeFranchisee, setActiveFranchisee] = useState(null);

    const handleViewDetails = (franchisee) => {
        setActiveFranchisee(franchisee);
        setIsModalOpen(true);
    };

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
                <h2 className="text-3xl font-bold">Gestion des franchisés</h2>
            </div>
            <div className={`overflow-x-auto rounded-xl shadow-md border ${cardBgClass}`}>
                <table className={`min-w-full divide-y ${tableDivideClass}`}>
                    <thead className={tableHeaderBgClass}>
                    <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>Prénom Nom</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>Email</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>Statut</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>Actions</th>
                    </tr>
                    </thead>
                    <tbody className={`${tableBodyBgClass} ${tableDivideClass} ${tableTextClass}`}>
                    {franchisees.map(f => (
                        <tr key={f.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{f.first_name} {f.last_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{f.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${f.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                                    {f.is_active ? 'Actif' : 'Inactif'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => toggleActiveStatus(f.id, f.is_active)}
                                        className={`p-2 rounded-md text-white transition-colors duration-200 ${f.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                                    >
                                        {f.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                    </button>
                                    <button
                                        onClick={() => handleViewDetails(f)}
                                        className="p-2 rounded-md text-white bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200"
                                    >
                                        <Info size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            <FranchiseeDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} franchisee={activeFranchisee} theme={theme} />
        </div>
    );
};

export default FranchiseesView;
