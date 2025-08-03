import React from 'react';

// Le composant Header prend une prop 'setCurrentPage' pour changer la page actuelle
function Header({ setCurrentPage }) {
    return (
        <header className="bg-white text-gray-800 p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                {/* Bouton qui retourne à la page de connexion, affichant le logo */}
                <button onClick={() => setCurrentPage('login')} className="h-12 w-auto">
                    <img
                        src="/logo-fond-transparent-noir.png"
                        alt="Logo Driv'n Cook"
                        className="h-full w-auto"
                    />
                </button>
                {/* Bouton pour aller à la page "Devenir franchisée" */}
                <button
                    onClick={() => setCurrentPage('franchise')}
                    className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors duration-300"
                >
                    Devenir franchisée
                </button>
            </div>
        </header>
    );
}

export default Header;
