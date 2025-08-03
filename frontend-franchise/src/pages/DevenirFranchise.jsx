import React, { useState } from 'react';

function DevenirFranchise() {
    const [step, setStep] = useState(1);

    const handleNextStep = (e) => {
        e.preventDefault();
        setStep(step + 1);
    };

    const handlePreviousStep = () => {
        setStep(step - 1);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Logique de soumission du formulaire
        console.log("Formulaire soumis !");
        // Remplacer alert() par une modal personnalisée
        // Affichez un message de confirmation dans la console pour le moment
        console.log("Votre demande a été envoyée avec succès !");
    };

    const renderFormStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        {/* Champ Nom */}
                        <div>
                            <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom *</label>
                            <input type="text" id="nom" name="nom" required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        {/* Champ Prénom */}
                        <div>
                            <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">Prénom *</label>
                            <input type="text" id="prenom" name="prenom" required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        {/* Champ Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                            <input type="email" id="email" name="email" required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        {/* Champ Téléphone */}
                        <div>
                            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">Téléphone *</label>
                            <input type="tel" id="telephone" name="telephone" required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                type="button"
                                onClick={handleNextStep}
                                className="bg-black text-white px-6 py-3 rounded-md font-bold text-lg hover:bg-gray-800 transition-colors duration-300"
                            >
                                Étape suivante
                            </button>
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        {/* Champ Adresse */}
                        <div>
                            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">Adresse</label>
                            <input type="text" id="adresse" name="adresse" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        {/* Champ Code Postal */}
                        <div>
                            <label htmlFor="code_postal" className="block text-sm font-medium text-gray-700">Code Postal</label>
                            <input type="text" id="code_postal" name="code_postal" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        {/* Champ Ville */}
                        <div>
                            <label htmlFor="ville" className="block text-sm font-medium text-gray-700">Ville</label>
                            <input type="text" id="ville" name="ville" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        {/* Champ Situation actuelle */}
                        <div>
                            <label htmlFor="situation" className="block text-sm font-medium text-gray-700">Situation actuelle</label>
                            <select id="situation" name="situation" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm">
                                <option>Demandeur d'emploi</option>
                                <option>Salarié</option>
                                <option>Entrepreneur</option>
                                <option>Étudiant</option>
                                <option>Autre</option>
                            </select>
                        </div>
                        <div className="flex justify-between mt-6">
                            <button
                                type="button"
                                onClick={handlePreviousStep}
                                className="bg-gray-400 text-white px-6 py-3 rounded-md font-bold text-lg hover:bg-gray-500 transition-colors duration-300"
                            >
                                Étape précédente
                            </button>
                            <button
                                type="button"
                                onClick={handleNextStep}
                                className="bg-black text-white px-6 py-3 rounded-md font-bold text-lg hover:bg-gray-800 transition-colors duration-300"
                            >
                                Étape suivante
                            </button>
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        {/* Champ Zone souhaitée */}
                        <div>
                            <label htmlFor="zone_souhaitee" className="block text-sm font-medium text-gray-700">Zone restaurant ou région souhaitée *</label>
                            <input type="text" id="zone_souhaitee" name="zone_souhaitee" required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>
                        {/* Champ Apport */}
                        <div>
                            <label htmlFor="apport" className="block text-sm font-medium text-gray-700">Apport (hors emprunt bancaire)</label>
                            <select id="apport" name="apport" className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm">
                                <option>&lt; 60.000 €</option>
                                <option>60.000 - 80.000 €</option>
                                <option>80.000 - 200.000 €</option>
                                <option>&gt; 200.000 €</option>
                                <option>&gt; 500.000 €</option>
                            </select>
                        </div>
                        <div className="flex justify-between mt-6">
                            <button
                                type="button"
                                onClick={handlePreviousStep}
                                className="bg-gray-400 text-white px-6 py-3 rounded-md font-bold text-lg hover:bg-gray-500 transition-colors duration-300"
                            >
                                Étape précédente
                            </button>
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                className="bg-black text-white px-6 py-3 rounded-md font-bold text-lg hover:bg-gray-800 transition-colors duration-300"
                            >
                                Envoyer ma demande
                            </button>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-50 text-gray-800 min-h-screen">
            {/* Section de présentation */}
            <div className="bg-black text-white py-24 text-center">
                <h1 className="text-5xl font-extrabold tracking-tight mb-4">Devenir Franchisé Driv'n Cook</h1>
                <p className="text-xl max-w-3xl mx-auto">
                    Rejoignez notre réseau de food trucks et faites partie d'une aventure culinaire réussie.
                    Nous vous accompagnons à chaque étape pour construire votre succès.
                </p>
            </div>

            <div className="container mx-auto py-16 px-4">
                {/* Section Conditions et avantages */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    {/* Avantages */}
                    <div className="p-8 bg-white rounded-xl shadow-lg">
                        <h2 className="text-3xl font-bold mb-6 text-center">Pourquoi nous rejoindre ?</h2>
                        <ul className="space-y-6 text-lg">
                            <li className="flex items-center">
                                <svg className="w-8 h-8 text-black mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span>Un concept de food trucks avec des plats de qualité, à base de produits frais, bruts et locaux.</span>
                            </li>
                            <li className="flex items-center">
                                <svg className="w-8 h-8 text-black mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span>Un système de franchise déjà en place avec plus de 30 licenciés.</span>
                            </li>
                            <li className="flex items-center">
                                <svg className="w-8 h-8 text-black mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <span>Le soutien d'une entreprise solide et en pleine croissance.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Conditions */}
                    <div className="p-8 bg-white rounded-xl shadow-lg">
                        <h2 className="text-3xl font-bold mb-6 text-center">Nos conditions de franchise</h2>
                        <ul className="space-y-6 text-lg">
                            <li className="flex items-center">
                                <svg className="w-8 h-8 text-black mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4 0V3m0 2v2m0 6h.01M9 16h6"></path></svg>
                                <span>Droit d'entrée de 50 000,00 €.</span>
                            </li>
                            <li className="flex items-center">
                                <svg className="w-8 h-8 text-black mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zM9 16a3 3 0 013-3h.01a3 3 0 013 3v2H9v-2zm-3-2a6 6 0 016-6h.01a6 6 0 016 6v2H6v-2z"></path></svg>
                                <span>Versement de 4% du chiffre d'affaires à la société mère.</span>
                            </li>
                            <li className="flex items-center">
                                <svg className="w-8 h-8 text-black mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.186 1.705.707 1.705H17m0-4h-4m4 0l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.186 1.705.707 1.705H17m0-4h-4m4 0l4-8H5.4M7 13L5.4 5m4.4-4a2.5 2.5 0 00-2.5 2.5v2.5a2.5 2.5 0 002.5 2.5h2.5a2.5 2.5 0 002.5-2.5v-2.5a2.5 2.5 0 00-2.5-2.5H9.4z"></path></svg>
                                <span>Acheter 80% du stock dans nos entrepôts d'Île-de-France.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Section Image et Formulaire */}
                <div className="mt-16 flex flex-col md:flex-row items-center justify-center md:items-start gap-12">
                    {/* Image */}
                    <div className="w-full md:w-1/2 flex justify-center p-8">
                        <img
                            src="/devenir-franchisee.webp"
                            alt="Vue d'un food truck Driv'n Cook"
                            className="w-full max-w-lg h-auto object-cover rounded-full shadow-lg aspect-square"
                        />
                    </div>

                    {/* Section Formulaire */}
                    <div className="w-full md:w-1/2 p-10 bg-white rounded-xl shadow-lg">
                        <h2 className="text-3xl font-bold text-center mb-8">Faire la demande</h2>
                        <form className="space-y-6">
                            {renderFormStep()}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DevenirFranchise;
