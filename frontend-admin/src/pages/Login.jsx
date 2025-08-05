import React, { useState } from 'react';
import { useUser } from '../context/UserContext.jsx';

function Login() {
    // Utilisation du hook useUser pour accéder au contexte
    const { handleLogin, error, loading } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Appel de la fonction handleLogin du contexte
        handleLogin(email, password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-10 rounded-lg shadow-xl w-full max-w-md border-t-8 border-indigo-600">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
                    Connexion Administrateur
                </h1>
                {/* Affiche l'erreur si elle existe */}
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-center mb-4">{error}</p>}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading} // Désactive le bouton pendant le chargement
                        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors duration-300 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                    <a href="#" className="block text-center text-sm text-gray-600 hover:text-gray-500 mt-4">
                        Mot de passe oublié ?
                    </a>
                </form>
            </div>
        </div>
    );
}

export default Login;
