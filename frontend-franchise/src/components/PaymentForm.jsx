// frontend-franchise/src/components/PaymentForm.jsx
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Définissez l'URL de votre API backend ici.
// Idéalement, cette URL devrait être configurée via une variable d'environnement (ex: process.env.REACT_APP_API_URL)
const API_URL = "http://localhost:8000/api";

export default function PaymentForm() {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();

    const [clientSecret, setClientSecret] = useState("");
    const [loading, setLoading] = useState(true); // État pour le chargement initial du PaymentIntent
    const [processing, setProcessing] = useState(false); // État pour le traitement du paiement
    const [paymentMessage, setPaymentMessage] = useState(null); // Message de succès/erreur du paiement
    const [isError, setIsError] = useState(false); // Indique si le message est une erreur

    // Effet pour récupérer le clientSecret au chargement du composant
    useEffect(() => {
        const fetchPaymentIntent = async () => {
            setLoading(true);
            setPaymentMessage(null);
            setIsError(false);
            try {
                const token = localStorage.getItem("access_token");
                if (!token) {
                    // Si pas de token, rediriger vers la page de connexion ou afficher une erreur
                    throw new Error("Aucun token d'accès trouvé. Veuillez vous connecter.");
                }

                const response = await fetch(`${API_URL}/franchisees/create-payment-intent`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    // Si la réponse n'est pas OK, c'est une erreur du backend
                    throw new Error(data.message || "Échec de la création de l'intention de paiement.");
                }

                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                } else {
                    throw new Error("Le secret client n'a pas été reçu du serveur.");
                }
            } catch (error) {
                console.error("Erreur lors de la récupération de l'intention de paiement :", error);
                setPaymentMessage(error.message || "Erreur lors de la préparation du paiement. Veuillez réessayer.");
                setIsError(true);
            } finally {
                setLoading(false); // Fin du chargement initial
            }
        };

        fetchPaymentIntent();
    }, []); // Le tableau vide assure que cet effet ne s'exécute qu'une seule fois au montage

    // Gère la soumission du formulaire de paiement
    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true); // Active l'état de traitement
        setPaymentMessage(null); // Réinitialise les messages
        setIsError(false);

        if (!stripe || !elements || !clientSecret) {
            setPaymentMessage("Stripe n'est pas encore chargé ou le secret client est manquant.");
            setIsError(true);
            setProcessing(false);
            return;
        }

        const cardElement = elements.getElement(CardElement);

        // Confirme le paiement avec Stripe
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
            },
        });

        if (error) {
            console.error("Erreur Stripe lors de la confirmation du paiement :", error);
            setPaymentMessage(error.message || "Une erreur est survenue lors du paiement.");
            setIsError(true);
        } else if (paymentIntent.status === "succeeded") {
            setPaymentMessage("Paiement réussi ! Redirection vers le tableau de bord...");
            setIsError(false);
            // Optionnel : Vous pourriez vouloir faire un appel API supplémentaire ici
            // pour confirmer le paiement avec votre backend si votre backend ne gère pas
            // automatiquement les webhooks Stripe.
            setTimeout(() => navigate("/dashboard"), 2000); // Redirige après 2 secondes
        } else {
            // Gère les autres statuts de paiement (ex: requires_action, requires_confirmation)
            setPaymentMessage(`Statut du paiement : ${paymentIntent.status}. Veuillez réessayer.`);
            setIsError(true);
        }
        setProcessing(false); // Désactive l'état de traitement
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Effectuer le paiement
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Veuillez entrer vos informations de carte pour payer les 50 000 €.
                    </p>
                </div>

                {/* Affichage des messages de chargement ou de paiement */}
                {loading ? (
                    <div className="text-center text-gray-600">Chargement du formulaire de paiement...</div>
                ) : paymentMessage && (
                    <div className={`p-3 rounded-md text-sm font-medium text-center ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {paymentMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                            <label htmlFor="card-element" className="sr-only">Informations de carte</label>
                            <CardElement id="card-element" className="py-2" />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                            // Désactive le bouton si Stripe n'est pas chargé, si le paiement est en cours,
                            // si le clientSecret n'est pas prêt, ou s'il y a une erreur bloquante.
                            disabled={!stripe || processing || loading || isError || !clientSecret}
                        >
                            {processing ? "Traitement..." : "Payer les 50 000 €"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
