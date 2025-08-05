// frontend-admin/src/pages/UnvalidatedFranchiseesView.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { getUnvalidatedFranchisees, toggleFranchiseeStatus } from '../services/api';

const UnvalidatedFranchiseeDetailsModal = ({ isOpen, onClose, franchisee, theme }) => {
    if (!isOpen || !franchisee) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4">
            <div className={`rounded-lg shadow-xl p-6 w-full max-w-lg ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
                <div className={`flex justify-between items-center border-b pb-3 mb-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Détails du franchisé non validé</h3>
                    <button onClick={onClose} className={`text-gray-400 hover:text-gray-100`}>
                        <X size={24} />
                    </button>
                </div>
                <div className={`space-y-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p><strong>Nom complet:</strong> {franchisee.first_name} {franchisee.last_name}</p>
                    <p><strong>Email:</strong> {franchisee.email}</p>
                    <p><strong>Statut:</strong> {franchisee.is_active ? 'Actif' : 'Inactif'}</p>
                    {/* Ajouter d'autres détails spécifiques si nécessaire */}
                </div>
            </div>
        </div>
    );
};

const UnvalidatedFranchiseesView = ({ theme }) => {
    const [franchisees, setFranchisees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeFranchisee, setActiveFranchisee] = useState(null);

    useEffect(() => {
        const fetchUnvalidatedFranchisees = async () => {
            try {
                const data = await getUnvalidatedFranchisees();
                setFranchisees(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUnvalidatedFranchisees();
    }, []);

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await toggleFranchiseeStatus(id, !currentStatus);
            // Mettre à jour l'état local ou recharger les données
            setFranchisees(prev => prev.filter(f => f.id !== id));
        } catch (err) {
            console.error("Erreur lors de la mise à jour du statut:", err);
            // Gérer l'erreur côté UI
        }
    };

    const handleViewDetails = (franchisee) => {
        setActiveFranchisee(franchisee);
        setIsModalOpen(true);
    };

    if (loading) return <div className="p-6 text-center">Chargement des franchisés...</div>;
    if (error) return <div className="p-6 text-center text-red-500">Erreur : {error}</div>;

    return (
        <div className={`p-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <h1 className="text-3xl font-bold mb-6">Franchisés en attente de validation</h1>
            <div className={`shadow-lg rounded-lg overflow-x-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                    {franchisees.length > 0 ? (
                        franchisees.map((f) => (
                            <tr key={f.id} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{f.first_name} {f.last_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{f.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleToggleStatus(f.id, f.is_active)}
                                            className="p-2 rounded-md text-white bg-green-500 hover:bg-green-600 transition-colors duration-200"
                                        >
                                            <CheckCircle size={16} />
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
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                Aucun franchisé en attente.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
            <UnvalidatedFranchiseeDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} franchisee={activeFranchisee} theme={theme} />
        </div>
    );
};

export default UnvalidatedFranchiseesView;