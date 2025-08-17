import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function PaymentForm({ type = "entry_fee", contractId, scheduleId, amount }) {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();

    const [clientSecret, setClientSecret] = useState("");
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState(null);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const createIntent = async () => {
            setLoading(true);
            setPaymentMessage(null);
            setIsError(false);
            try {
                const token = localStorage.getItem("access_token");
                if (!token) throw new Error("Aucun token. Veuillez vous connecter.");
                const res = await fetch(`${API_URL}/payments/create-payment-intent`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ type, contract_id: contractId ?? null, schedule_id: scheduleId ?? null, amount: amount ?? null }),
                });
                const data = await res.json();
                if (!res.ok || !data.clientSecret) throw new Error(data.message || "Échec de création de l'intention de paiement.");
                setClientSecret(data.clientSecret);
            } catch (e) {
                setPaymentMessage(e.message);
                setIsError(true);
            } finally {
                setLoading(false);
            }
        };
        createIntent();
    }, [type, contractId, scheduleId, amount]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setPaymentMessage(null);
        setIsError(false);

        try {
            if (!stripe || !elements || !clientSecret) throw new Error("Stripe non prêt ou secret manquant.");
            const cardElement = elements.getElement(CardElement);
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: { card: cardElement },
                return_url: `${window.location.origin}/paiements/success`,
            });
            if (error) throw new Error(error.message || "Erreur lors du paiement.");
            if (paymentIntent?.status === "succeeded") {
                setPaymentMessage("Paiement réussi !");
                setTimeout(() => navigate("/paiements/success"), 1200);
            } else {
                setPaymentMessage(`Statut du paiement : ${paymentIntent?.status}`);
                setIsError(true);
            }
        } catch (e) {
            setPaymentMessage(e.message);
            setIsError(true);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-2xl shadow">
                <div className="space-y-1 text-center">
                    <h2 className="text-2xl font-bold">Paiement</h2>
                    <p className="text-sm text-gray-500">Type : {type}{contractId ? ` • Contrat #${contractId}` : ""}{scheduleId ? ` • Échéance ${scheduleId}` : ""}</p>
                </div>

                {loading ? (
                    <div className="text-center text-gray-600">Préparation du paiement…</div>
                ) : paymentMessage ? (
                    <div className={`p-3 rounded-md text-sm text-center ${isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {paymentMessage}
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-3 border rounded-lg">
                        <CardElement id="card-element" className="py-2" />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                        disabled={!stripe || processing || loading || !clientSecret}
                    >{processing ? "Traitement…" : "Payer"}</button>
                </form>
            </div>
        </div>
    );
}