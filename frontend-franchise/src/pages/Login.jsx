import React, { useState } from 'react';
import axios from 'axios';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://localhost:8000/api/login', {
                email,
                password
            });

            // On suppose que tu veux stocker un token plus tard ici
            // localStorage.setItem('token', response.data.token); // à activer quand tu enverras un token

            alert(response.data.message); // "Connexion réussie"
        } catch (err) {
            if (err.response) {
                setError(err.response.data.message);
            } else {
                setError("Erreur de connexion");
            }
        }
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
                        className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800"
                    >
                        Se connecter
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
