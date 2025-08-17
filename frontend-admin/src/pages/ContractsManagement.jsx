// frontend-admin/src/pages/ContractsManagement.jsx
import React, { useState, useEffect } from 'react';
import { Eye, Download, Pause, Play, XCircle, Calendar } from 'lucide-react';

const ContractsManagement = ({ theme }) => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});

    const fetchContracts = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch('http://localhost:8000/api/contracts', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            setContracts(data.data.data); // pagination
            setStats(data.stats);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    const getStatusColor = (status) => {
        const colors = {
            'active': 'bg-green-100 text-green-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'suspended': 'bg-red-100 text-red-800',
            'terminated': 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status) => {
        const labels = {
            'active': 'Actif',
            'pending': 'En attente',
            'suspended': 'Suspendu',
            'terminated': 'Terminé'
        };
        return labels[status] || status;
    };

    if (loading) {
        return <div className="p-6">Chargement...</div>;
    }

    return (
        <div className={`p-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestion des Contrats</h1>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-500 text-white p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">Total</h3>
                    <p className="text-2xl font-bold">{stats.total || 0}</p>
                </div>
                <div className="bg-green-500 text-white p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">Actifs</h3>
                    <p className="text-2xl font-bold">{stats.active || 0}</p>
                </div>
                <div className="bg-yellow-500 text-white p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">En attente</h3>
                    <p className="text-2xl font-bold">{stats.pending || 0}</p>
                </div>
                <div className="bg-red-500 text-white p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">Suspendus</h3>
                    <p className="text-2xl font-bold">{stats.suspended || 0}</p>
                </div>
            </div>

            {/* Tableau des contrats */}
            <div className={`shadow-lg rounded-lg overflow-x-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            N° Contrat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Franchisé
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Droit d'entrée
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Royalties
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date création
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                    {contracts.map((contract) => (
                        <tr key={contract.id} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {contract.contract_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {contract.user?.franchisee?.first_name} {contract.user?.franchisee?.last_name}
                                <br />
                                <span className="text-gray-500 text-xs">{contract.user?.email}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                                        {getStatusLabel(contract.status)}
                                    </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: 'EUR'
                                }).format(contract.franchise_fee)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {contract.royalty_rate}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(contract.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                    <button
                                        className="p-2 text-blue-600 hover:text-blue-900"
                                        title="Voir détails"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        className="p-2 text-green-600 hover:text-green-900"
                                        title="Télécharger PDF"
                                    >
                                        <Download size={16} />
                                    </button>
                                    {contract.status === 'active' && (
                                        <button
                                            className="p-2 text-yellow-600 hover:text-yellow-900"
                                            title="Suspendre"
                                        >
                                            <Pause size={16} />
                                        </button>
                                    )}
                                    {contract.status === 'suspended' && (
                                        <button
                                            className="p-2 text-green-600 hover:text-green-900"
                                            title="Réactiver"
                                        >
                                            <Play size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ContractsManagement;