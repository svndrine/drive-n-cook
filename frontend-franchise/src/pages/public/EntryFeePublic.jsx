import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY);
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function EntryFeeForm({ token }) {
    const stripe = useStripe();
    const elements = useElements();
    const [secret, setSecret] = useState('');
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const run = async () => {
            try {
                const r = await fetch(`${API}/public/entry-fee/${token}/create-payment-intent`, { method: 'POST' });
                const j = await r.json();
                if (!r.ok || !j.clientSecret) throw new Error(j.message || 'Création du paiement impossible');
                setSecret(j.clientSecret);
            } catch (e) {
                setMsg(e.message);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [token]);

    const pay = async (e) => {
        e.preventDefault();
        if (!stripe || !elements || !secret) return;
        setProcessing(true);
        setMsg('');
        const card = elements.getElement(CardElement);
        const { error, paymentIntent } = await stripe.confirmCardPayment(secret, {
            payment_method: { card },
            return_url: `${window.location.origin}/paiements/success`,
        });
        if (error) setMsg(error.message);
        else setMsg(`Statut: ${paymentIntent?.status}`);
        setProcessing(false);
    };

    if (loading) return <div className="p-6">Préparation du paiement…</div>;
    return (
        <form onSubmit={pay} className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow space-y-4">
            {msg && <div className="p-3 bg-gray-100 rounded">{msg}</div>}
            <div className="p-3 border rounded"><CardElement /></div>
            <button disabled={!secret || processing} className="w-full py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">
                Payer 50 000 €
            </button>
        </form>
    );
}

export default function EntryFeePublic() {
    const { token } = useParams();
    return (
        <Elements stripe={stripePromise}>
            <EntryFeeForm token={token} />
        </Elements>
    );
}