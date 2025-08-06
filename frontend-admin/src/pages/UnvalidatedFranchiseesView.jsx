// frontend-admin/src/pages/UnvalidatedFranchiseesView.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, Mail, Phone, MapPin, Briefcase, DollarSign, Globe, X } from 'lucide-react';
import { getUnvalidatedFranchisees, validateFranchisee, rejectFranchisee } from '../services/api';

const UnvalidatedFranchiseeDetailsModal = ({ isOpen, onClose, franchisee, theme }) => {
    if (!isOpen || !franchisee) {
        return null;
    }

    // Définition des classes de thème pour le modal
    const isDarkMode = theme === 'dark';
    const modalBgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';
    const textColor = isDarkMode ? 'text-white' : 'text-gray-800';
    const subTextColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
    const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
    const iconColor = isDarkMode ? 'text-gray-400' : 'text-gray-600';

    // Composant utilitaire pour les lignes de détail dans le modal
    const ModalDetailItem = ({ icon, label, value }) => (
        <div className="flex items-start py-2">
            {icon && <span className={`${iconColor} mr-3 mt-1 flex-shrink-0`}>{icon}</span>}
            <div className="flex-1">
                <p className={`text-base font-medium ${subTextColor}`}>{label} :</p>
                <p className={`text-lg ${textColor}`}>{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4">
            <div className={`rounded-lg shadow-xl p-6 w-full max-w-lg ${modalBgColor} ${textColor}`}>
                <div className={`flex justify-between items-center border-b pb-3 mb-4 ${borderColor}`}>
                    <h3 className={`text-xl font-semibold ${textColor}`}>Détails du franchisé non validé</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-100">
                        <X size={24} />
                    </button>
                </div>
                <div className="space-y-4">
                    <ModalDetailItem
                        icon={<Mail size={20} />}
                        label="Nom complet"
                        value={`${franchisee.first_name || ''} ${franchisee.last_name || ''}`}
                    />
                    <ModalDetailItem icon={<Mail size={20} />} label="Email" value={franchisee.email} />
                    <ModalDetailItem icon={<Phone size={20} />} label="Téléphone" value={franchisee.phone} />
                    <ModalDetailItem
                        icon={<MapPin size={20} />}
                        label="Adresse"
                        value={`${franchisee.address || ''}, ${franchisee.zip_code || ''} ${franchisee.city || ''}`}
                    />
                    <ModalDetailItem
                        icon={<Briefcase size={20} />}
                        label="Situation Actuelle"
                        value={franchisee.current_situation}
                    />
                    <ModalDetailItem
                        icon={<Globe size={20} />}
                        label="Zone Souhaitée"
                        value={franchisee.desired_zone}
                    />
                    <ModalDetailItem
                        icon={<DollarSign size={20} />}
                        label="Apport Financier"
                        value={franchisee.financial_contribution}
                    />
                    <ModalDetailItem
                        label="Date de création"
                        value={franchisee.created_at ? new Date(franchisee.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                    />
                </div>
            </div>
        </div>
    );
};

const UnvalidatedFranchiseesView = ({ theme, onViewDetails }) => {
    const [franchisees, setFranchisees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeFranchisee, setActiveFranchisee] = useState(null);
    const [processingIds, setProcessingIds] = useState(new Set());

    useEffect(() => {
        fetchUnvalidatedFranchisees();
    }, []);

    const fetchUnvalidatedFranchisees = async () => {
        try {
            setLoading(true);
            const data = await getUnvalidatedFranchisees();
            setFranchisees(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error("Erreur lors de la récupération des franchisés non validés:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (id) => {
        if (processingIds.has(id)) return;

        try {
            setProcessingIds(prev => new Set([...prev, id]));
            await validateFranchisee(id);

            // Retirer le franchisé de la liste car il est maintenant validé
            setFranchisees(prev => prev.filter(f => f.id !== id));

            // Notification de succès (optionnel)
            console.log(`Franchisé ${id} validé avec succès`);
        } catch (err) {
            console.error("Erreur lors de la validation:", err);
            setError(`Erreur lors de la validation: ${err.message}`);
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    const handleReject = async (id) => {
        if (processingIds.has(id)) return;

        if (!window.confirm('Êtes-vous sûr de vouloir rejeter ce franchisé ?')) {
            return;
        }

        try {
            setProcessingIds(prev => new Set([...prev, id]));
            await rejectFranchisee(id);

            // Retirer le franchisé de la liste car il est rejeté
            setFranchisees(prev => prev.filter(f => f.id !== id));

            // Notification de succès (optionnel)
            console.log(`Franchisé ${id} rejeté avec succès`);
        } catch (err) {
            console.error("Erreur lors du rejet:", err);
            setError(`Erreur lors du rejet: ${err.message}`);
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    const handleViewDetailsInModal = (franchisee) => {
        setActiveFranchisee(franchisee);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setActiveFranchisee(null);
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2">Chargement des franchisés...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-500 mb-4">Erreur : {error}</div>
                <button
                    onClick={fetchUnvalidatedFranchisees}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    return (
        <div className={`p-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Franchisés en attente de validation</h1>
                <button
                    onClick={fetchUnvalidatedFranchisees}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Actualiser
                </button>
            </div>

            <div className={`shadow-lg rounded-lg overflow-x-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nom
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date de demande
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className={`${theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                    {franchisees.length > 0 ? (
                        franchisees.map((f) => {
                            const isProcessing = processingIds.has(f.id);
                            return (
                                <tr key={f.id} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {f.first_name} {f.last_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {f.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {f.created_at ? new Date(f.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleValidate(f.id)}
                                                disabled={isProcessing}
                                                className="p-2 rounded-md text-white bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                                                title="Valider le franchisé"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(f.id)}
                                                disabled={isProcessing}
                                                className="p-2 rounded-md text-white bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                                                title="Rejeter le franchisé"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleViewDetailsInModal(f)}
                                                className="p-2 rounded-md text-white bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200"
                                                title="Voir les détails"
                                            >
                                                <Info size={16} />
                                            </button>
                                            {onViewDetails && (
                                                <button
                                                    onClick={() => onViewDetails(f.id)}
                                                    className="p-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                                                    title="Voir plus de détails"
                                                >
                                                    Voir plus
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                Aucun franchisé en attente de validation.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            <UnvalidatedFranchiseeDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                franchisee={activeFranchisee}
                theme={theme}
            />
        </div>
    );
};

export default UnvalidatedFranchiseesView;