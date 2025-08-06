import React from 'react';
import { Link } from 'react-router-dom'; // Importez Link depuis react-router-dom

// Le composant Header ne prend plus la prop 'setCurrentPage'
function Header() {
    return (
        <header className="bg-white text-gray-800 p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                {/* Bouton qui retourne à la page de connexion, affichant le logo */}
                {/* Utilise Link pour naviguer vers la route /login */}
                <Link to="/login" className="h-12 w-auto flex items-center">
                    <img
                        src="/logo-fond-transparent-noir.png"
                        alt="Logo Driv'n Cook"
                        className="h-full w-auto"
                    />
                </Link>
                {/* Bouton pour aller à la page "Devenir franchisée" */}
                {/* Utilise Link pour naviguer vers la route /devenir-franchise */}
                <Link
                    to="/devenir-franchise"
                    className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors duration-300"
                >
                    Devenir franchisée
                </Link>
            </div>
        </header>
    );
}

export default Header;
