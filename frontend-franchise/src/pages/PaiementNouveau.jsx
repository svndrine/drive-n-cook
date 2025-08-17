import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useSearchParams } from "react-router-dom";
import PaymentForm from "../components/PaymentForm";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY);

export default function PaiementNouveau() {
    const [params] = useSearchParams();
    const type = params.get("type") || "entry_fee"; // entry_fee | monthly_royalty | penalty | stock_purchase
    const contractId = params.get("contract_id");
    const scheduleId = params.get("schedule_id");
    const amount = params.get("amount"); // optionnel (centimes)

    return (
        <Elements stripe={stripePromise}>
            <PaymentForm
                type={type}
                contractId={contractId || undefined}
                scheduleId={scheduleId || undefined}
                amount={amount ? Number(amount) : undefined}
            />
        </Elements>
    );
}