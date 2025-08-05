import React, { useState } from 'react';
import { useFranchisee } from './../context/FranchiseeContext.jsx';

function Login() {
    // Utilisation du hook useFranchisee pour accéder au contexte
    const { handleLogin, error, loading } = useFranchisee();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        handleLogin(email, password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
                    Connexion Franchisé
                </h1>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
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
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 rounded-md transition-colors duration-300 ${loading ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-black text-white hover:bg-gray-800'}`}
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