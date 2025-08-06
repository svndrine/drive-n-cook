import React, { useState, useEffect } from 'react';
import { getFranchiseeById } from '../services/api.js'; // Chemin vers votre fichier api.js
import { Mail, Phone, MapPin, Briefcase, DollarSign, Globe } from 'lucide-react'; // Icônes pour les détails

function FranchiseeDetails({ franchiseeId, onBackToList, theme }) { // Ajout de la prop 'theme'
    const id = franchiseeId;

    const [franchisee, setFranchisee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFranchisee = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getFranchiseeById(id);
                setFranchisee(data);
            } catch (err) {
                console.error("Erreur lors de la récupération du franchisé:", err);
                setError(err.message || "Impossible de charger les détails du franchisé.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchFranchisee();
        } else {
            setLoading(false);
            setError("Aucun ID de franchisé fourni.");
        }
    }, [id]);

    // Définition des classes de thème
    const isDarkMode = theme === 'dark';
    const bgColor = isDarkMode ? 'bg-gray-950' : 'bg-gray-100'; // Fond très sombre pour le mode nuit
    const cardBgColor = isDarkMode ? 'bg-gray-800' : 'bg-white'; // Couleur des cartes
    const sectionBgColor = isDarkMode ? 'bg-gray-700' : 'bg-gray-50'; // Couleur des sections internes
    const textColor = isDarkMode ? 'text-white' : 'text-gray-900'; // Couleur du texte principal
    const subTextColor = isDarkMode ? 'text-gray-200' : 'text-gray-700'; // Couleur du texte secondaire
    const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200'; // Couleur des bordures principales
    const itemBorderColor = isDarkMode ? 'border-gray-600' : 'border-gray-200'; // Couleur des bordures des DetailItem
    const iconColor = isDarkMode ? 'text-gray-400' : 'text-gray-600'; // Couleur des icônes
    const buttonBgColor = isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 hover:bg-gray-900'; // Couleur du bouton "Retour"
    const buttonFocusRing = isDarkMode ? 'focus:ring-gray-600' : 'focus:ring-gray-700';


    if (loading) {
        return (
            <div className={`flex justify-center items-center min-h-screen ${bgColor}`}>
                <p className={`text-xl font-semibold ${subTextColor}`}>Chargement des détails du franchisé...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex justify-center items-center min-h-screen ${bgColor}`}>
                <p className="text-xl font-semibold text-red-500">Erreur: {error}</p>
            </div>
        );
    }

    if (!franchisee) {
        return (
            <div className={`flex justify-center items-center min-h-screen ${bgColor}`}>
                <p className={`text-xl font-semibold ${subTextColor}`}>Franchisé non trouvé.</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${bgColor} py-8 px-4 sm:px-6 lg:px-8`}>
            <div className={`max-w-6xl mx-auto ${cardBgColor} shadow-xl rounded-lg p-8`}>
                {/* En-tête de la page de détails */}
                <div className={`flex justify-between items-center mb-8 pb-4 border-b ${borderColor}`}>
                    <h1 className={`text-4xl font-extrabold ${textColor}`}>
                        {franchisee.first_name} {franchisee.last_name}
                    </h1>
                    <button
                        onClick={onBackToList}
                        className={`inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${buttonBgColor} focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonFocusRing} transition-colors duration-300`}
                    >
                        Retour à la liste
                    </button>
                </div>

                {/* Section principale des détails */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
                    {/* Colonne de gauche: Informations de contact et statut */}
                    <div className={`${sectionBgColor} p-6 rounded-lg shadow-sm`}>
                        <h2 className={`text-2xl font-bold ${textColor} mb-6`}>Informations de contact</h2>
                        <div className="space-y-4">
                            <DetailItem icon={<Mail size={20} className={iconColor} />} label="Email" value={franchisee.email} textColor={subTextColor} iconColor={iconColor} itemBorderColor={itemBorderColor} />
                            <DetailItem icon={<Phone size={20} className={iconColor} />} label="Téléphone" value={franchisee.phone || 'N/A'} textColor={subTextColor} iconColor={iconColor} itemBorderColor={itemBorderColor} />
                            <DetailItem icon={<MapPin size={20} className={iconColor} />} label="Adresse" value={`${franchisee.address || 'N/A'}, ${franchisee.zip_code || ''} ${franchisee.city || ''}`} textColor={subTextColor} iconColor={iconColor} itemBorderColor={itemBorderColor} />
                            <DetailItem label="Statut" value={franchisee.is_active ? 'Actif' : 'Inactif'}
                                        valueClassName={franchisee.is_active ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'} // Ajustement des couleurs de statut pour le mode nuit
                                        textColor={subTextColor}
                                        iconColor={iconColor}
                                        itemBorderColor={itemBorderColor}
                            />
                        </div>
                    </div>

                    {/* Colonne de droite: Informations de candidature */}
                    <div className={`${sectionBgColor} p-6 rounded-lg shadow-sm`}>
                        <h2 className={`text-2xl font-bold ${textColor} mb-6`}>Détails de la candidature</h2>
                        <div className="space-y-4">
                            <DetailItem icon={<Briefcase size={20} className={iconColor} />} label="Situation Actuelle" value={franchisee.current_situation || 'N/A'} textColor={subTextColor} iconColor={iconColor} itemBorderColor={itemBorderColor} />
                            <DetailItem icon={<Globe size={20} className={iconColor} />} label="Zone Souhaitée" value={franchisee.desired_zone || 'N/A'} textColor={subTextColor} iconColor={iconColor} itemBorderColor={itemBorderColor} />
                            <DetailItem icon={<DollarSign size={20} className={iconColor} />} label="Apport Financier" value={franchisee.financial_contribution || 'N/A'} textColor={subTextColor} iconColor={iconColor} itemBorderColor={itemBorderColor} />
                        </div>
                    </div>
                </div>

                {/* Section pour les informations futures (ex: paiements, historique) */}
                <div className={`${sectionBgColor} p-6 rounded-lg shadow-sm`}>
                    <h2 className={`text-2xl font-bold ${textColor} mb-6`}>Historique et Gestion</h2>
                    <div className={`${subTextColor}`}>
                        <p className="mb-4">
                            Cette section pourra contenir à l'avenir des informations détaillées sur les paiements,
                            l'historique des activités, les documents liés au franchisé, etc.
                        </p>
                        <ul className={`list-disc list-inside space-y-2 ${subTextColor}`}>
                            <li>Historique des paiements (à venir)</li>
                            <li>Performance du food truck (à venir)</li>
                            <li>Documents contractuels (à venir)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Composant utilitaire pour afficher une ligne de détail avec icône
// Ajout de textColor et iconColor pour la gestion du thème
const DetailItem = ({ icon, label, value, valueClassName = '', textColor, iconColor, itemBorderColor }) => (
    <div className={`flex items-start py-2 border-b ${itemBorderColor} last:border-b-0`}>
        {icon && <span className={`${iconColor} mr-3 mt-1 flex-shrink-0`}>{icon}</span>}
        <div className="flex-1">
            <p className={`text-base font-medium ${textColor}`}>{label} :</p>
            <p className={`text-lg ${textColor} ${valueClassName}`}>{value}</p>
        </div>
    </div>
);

export default FranchiseeDetails;
