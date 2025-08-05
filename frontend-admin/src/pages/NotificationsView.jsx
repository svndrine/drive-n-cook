import React from 'react';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

/**
 * Composant de la vue "Notifications".
 * @param {object} props - Propriétés du composant.
 * @param {string} props.theme - Thème actuel.
 */
const NotificationsView = ({ theme }) => {
    const contentBgClass = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
    const contentTextClass = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
    const cardBgClass = theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

    return (
        <div className={`p-8 space-y-8 ${contentBgClass} ${contentTextClass}`}>
            <h2 className="text-3xl font-bold">Notifications</h2>
            <p className={`text-gray-400`}>Cette section affichera les nouvelles demandes et l'historique des actions.</p>
            <div className={`p-6 rounded-xl shadow-md border ${cardBgClass}`}>
                <ul className="space-y-4">
                    <li className="flex items-center">
                        <Mail size={20} className="text-indigo-400 mr-3 flex-shrink-0" />
                        <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nouvelle demande de franchisé de Jean Dupont.</span>
                    </li>
                    <li className="flex items-center">
                        <CheckCircle size={20} className="text-green-500 mr-3 flex-shrink-0" />
                        <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Compte de Marie Curie a été activé.</span>
                    </li>
                    <li className="flex items-center">
                        <XCircle size={20} className="text-red-500 mr-3 flex-shrink-0" />
                        <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Compte de Pierre Martin a été refusé.</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default NotificationsView;
