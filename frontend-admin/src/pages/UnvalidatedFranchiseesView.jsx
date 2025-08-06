// frontend-admin/src/pages/UnvalidatedFranchiseesView.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, Mail, Phone, MapPin, Briefcase, DollarSign, Globe } from 'lucide-react';
import { getUnvalidatedFranchisees, toggleFranchiseeStatus } from '../services/api';

const UnvalidatedFranchiseeDetailsModal = ({ isOpen, onClose, franchisee, theme }) => {
    if (!isOpen || !franchisee) {
        console.log("Unvalidated Modal: Not open or no franchisee data.", { isOpen, franchisee });
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
                <p className={`text-lg ${textColor}`}>{value}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75 p-4">
            <div className={`rounded-lg shadow-xl p-6 w-full max-w-lg ${modalBgColor} ${textColor}`}>
                <div className={`flex justify-between items-center border-b pb-3 mb-4 ${borderColor}`}>
                    <h3 className={`text-xl font-semibold ${textColor}`}>Détails du franchisé non validé</h3>
                    <button onClick={onClose} className={`text-gray-400 hover:text-gray-100`}>
                        <X size={24} />
                    </button>
                </div>
                <div className="space-y-4">
                    <ModalDetailItem icon={<Mail size={20} />} label="Email" value={franchisee.email} />
                    <ModalDetailItem icon={<Phone size={20} />} label="Téléphone" value={franchisee.phone || 'N/A'} />
                    <ModalDetailItem icon={<MapPin size={20} />} label="Adresse" value={`${franchisee.address || 'N/A'}, ${franchisee.zip_code || ''} ${franchisee.city || ''}`} />
                    <ModalDetailItem icon={<Briefcase size={20} />} label="Situation Actuelle" value={franchisee.current_situation || 'N/A'} />
                    <ModalDetailItem icon={<Globe size={20} />} label="Zone Souhaitée" value={franchisee.desired_zone || 'N/A'} />
                    <ModalDetailItem icon={<DollarSign size={20} />} label="Apport Financier" value={franchisee.financial_contribution || 'N/A'} />
                    <ModalDetailItem label="Statut" value={franchisee.is_active ? 'Actif' : 'Inactif'} />
                </div>
            </div>
        </div>
    );
};

// Ajout de onViewDetails dans les props du composant
const UnvalidatedFranchiseesView = ({ theme, onViewDetails }) => {
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
            // Mettre à jour l'état local en filtrant le franchisé validé
            setFranchisees(prev => prev.filter(f => f.id !== id));
        } catch (err) {
            console.error("Erreur lors de la mise à jour du statut:", err);
            // Gérer l'erreur côté UI
        }
    };

    // Fonction pour l'ouverture du MODAL de détails (bouton "Info")
    const handleViewDetailsInModal = (franchisee) => {
        console.log("Unvalidated: handleViewDetailsInModal called with:", franchisee); // LOG 1
        setActiveFranchisee(franchisee);
        setIsModalOpen(true);
        console.log("Unvalidated: Modal state after setting:", { isModalOpen: true, activeFranchisee: franchisee }); // LOG 2
    };

    if (loading) return <div className="p-6 text-center">Chargement des franchisés...</div>;
    if (error) return <div className="p-6 text-center text-red-500">Erreur : {error}</div>;

    console.log("Rendering UnvalidatedFranchiseesView. Modal status:", { isModalOpen, activeFranchisee }); // LOG 3

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
                                            // Ce bouton ouvre le MODAL de détails
                                            onClick={() => handleViewDetailsInModal(f)}
                                            className="p-2 rounded-md text-white bg-indigo-500 hover:bg-indigo-600 transition-colors duration-200"
                                        >
                                            <Info size={16} />
                                        </button>
                                        {/* Bouton "Voir plus" qui appelle onViewDetails(f.id) uniquement si la prop est fournie */}
                                        {onViewDetails && (
                                            <button
                                                onClick={() => {
                                                    console.log("UnvalidatedFranchiseesView - ID passé:", f.id, "Objet complet:", f);
                                                    onViewDetails(f.id);
                                                }}
                                                className="p-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
                                            >
                                                Voir plus
                                            </button>
                                        )}
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
            {/* Le modal de détails est toujours présent pour le bouton "Info" */}
            <UnvalidatedFranchiseeDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} franchisee={activeFranchisee} theme={theme} />
        </div>
    );
};

export default UnvalidatedFranchiseesView;
