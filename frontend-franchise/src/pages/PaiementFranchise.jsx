// frontend-franchise/src/pages/PaiementFranchise.jsx
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "../components/PaymentForm";


const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY);

export default function PaiementFranchise() {
    return (
        <Elements stripe={stripePromise}>
            <PaymentForm />
        </Elements>
    );
}
