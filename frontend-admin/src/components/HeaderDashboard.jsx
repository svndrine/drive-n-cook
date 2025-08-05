// frontend-admin/src/components/HeaderDashboard.jsx
import React from 'react';
import {
    Bell,
    UserCircle,
    Settings,
    Edit,
    LogOut,
    Sun,
    Moon,
    Search,
    Menu,
    X,
} from 'lucide-react';

/**
 * Composant de l'en-tête de l'interface d'administration.
 * @param {object} props - Propriétés du composant.
 * @param {object} props.user - Informations de l'utilisateur connecté.
 * @param {string} props.theme - Thème actuel ('dark' ou 'light').
 * @param {boolean} props.isProfileMenuOpen - État du menu de profil.
 * @param {function} props.setIsProfileMenuOpen - Fonction pour changer l'état du menu de profil.
 * @param {function} props.toggleTheme - Fonction pour basculer le thème.
 * @param {function} props.handleLogout - Fonction de déconnexion.
 * @param {boolean} props.isSidebarOpen - État de la barre latérale.
 * @param {function} props.toggleSidebar - Fonction pour basculer la barre latérale.
 */
const HeaderDashboard = ({ user, theme, isProfileMenuOpen, setIsProfileMenuOpen, toggleTheme, handleLogout, isSidebarOpen, toggleSidebar }) => {
    return (
        <header className={`h-20 flex items-center justify-between px-6 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center space-x-4">
                {/* Bouton pour basculer le menu (visible sur tous les écrans) */}
                <button onClick={toggleSidebar} className={`p-2 rounded-md hover:bg-gray-700 ${theme === 'dark' ? 'text-white' : 'text-gray-800 hover:bg-gray-200'}`}>
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                {/* Barre de recherche */}
                <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className={`pl-10 pr-4 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-800'}`}
                    />
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <button onClick={toggleTheme} className={`p-2 rounded-md hover:bg-gray-700 ${theme === 'dark' ? 'text-white' : 'text-gray-800 hover:bg-gray-200'}`}>
                    {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
                </button>
                <button className={`p-2 rounded-md hover:bg-gray-700 ${theme === 'dark' ? 'text-white' : 'text-gray-800 hover:bg-gray-200'}`}>
                    <Bell size={24} />
                </button>
                <div className="relative">
                    <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className={`p-2 rounded-full hover:bg-gray-700 ${theme === 'dark' ? 'text-white' : 'text-gray-800 hover:bg-gray-200'}`}>
                        <UserCircle size={24} />
                    </button>
                    {isProfileMenuOpen && (
                        <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className="px-4 py-2 text-sm">
                                <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{user.firstname} {user.lastname}</p>
                            </div>
                            <div className={`border-t my-1 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>
                            <a href="#" className={`flex items-center px-4 py-2 text-sm hover:bg-gray-700 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}>
                                <Edit size={16} className="mr-2" />
                                Modifier le profil
                            </a>
                            <a href="#" className={`flex items-center px-4 py-2 text-sm hover:bg-gray-700 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'}`}>
                                <Settings size={16} className="mr-2" />
                                Paramètres
                            </a>
                            <div className={`border-t my-1 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>
                            <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                                <LogOut size={16} className="mr-2" />
                                Déconnexion
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default HeaderDashboard;
