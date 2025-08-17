import { useEffect, useState } from "react";

export default function PaiementSuccess() {
    const [count, setCount] = useState(3);
    useEffect(() => {
        const id = setInterval(() => setCount((c) => c - 1), 1000);
        const go = setTimeout(() => {
            window.location.href = "/dashboard";
        }, 3000);
        return () => { clearInterval(id); clearTimeout(go); };
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow text-center space-y-2">
                <h1 className="text-2xl font-semibold">Paiement confirmé ✅</h1>
                <p className="text-gray-600">Retour au tableau de bord dans {count}s…</p>
            </div>
        </div>
    );
}