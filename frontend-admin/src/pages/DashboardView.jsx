import React from 'react';
import { Users, Mail, Briefcase, TrendingUp } from 'lucide-react';

/**
 * Composant de la vue "Tableau de bord".
 * @param {object} props - Propriétés du composant.
 * @param {array} props.franchisees - Liste des franchisés.
 * @param {string} props.theme - Thème actuel.
 */
const DashboardView = ({ franchisees, theme }) => {
    const pendingFranchisees = franchisees.filter(f => !f.is_active).length;
    const contentBgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
    const contentTextClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const cardBgClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const cardTextClass = theme === 'dark' ? 'text-white' : 'text-gray-800';

    return (
        <div className={`p-8 space-y-8 ${contentBgClass} ${contentTextClass}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className={`p-6 rounded-lg shadow-md border ${cardBgClass} ${cardTextClass}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Franchisés</p>
                            <p className="text-4xl font-bold mt-2">{franchisees.length}</p>
                        </div>
                        <div className="bg-indigo-600 p-3 rounded-full text-white">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-green-400 flex items-center">
                        <TrendingUp size={16} className="mr-1" />
                        <span>+1.5% depuis le mois dernier</span>
                    </div>
                </div>
                <div className={`p-6 rounded-lg shadow-md border ${cardBgClass} ${cardTextClass}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Demandes en attente</p>
                            <p className="text-4xl font-bold mt-2">{pendingFranchisees}</p>
                        </div>
                        <div className="bg-amber-600 p-3 rounded-full text-white">
                            <Mail size={24} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-red-400 flex items-center">
                        <TrendingUp size={16} className="mr-1 transform rotate-180" />
                        <span>-0.8% depuis le mois dernier</span>
                    </div>
                </div>
                <div className={`p-6 rounded-lg shadow-md border ${cardBgClass} ${cardTextClass}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>CA Estimé</p>
                            <p className="text-4xl font-bold mt-2">1.2M €</p>
                        </div>
                        <div className="bg-green-600 p-3 rounded-full text-white">
                            <Briefcase size={24} />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-green-400 flex items-center">
                        <TrendingUp size={16} className="mr-1" />
                        <span>+4.2% depuis le mois dernier</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-6 rounded-lg shadow-md border ${cardBgClass}`}>
                    <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Ventes mensuelles</h3>
                    <div className={`w-full h-64 rounded-lg mt-4 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                        Graphique de ventes (à implémenter)
                    </div>
                </div>
                <div className={`p-6 rounded-lg shadow-md border ${cardBgClass}`}>
                    <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>Objectif mensuel</h3>
                    <div className={`w-full h-64 rounded-lg mt-4 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                        Graphique de progression (à implémenter)
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;