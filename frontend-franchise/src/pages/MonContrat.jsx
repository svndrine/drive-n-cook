import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function MonContrat() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [contract, setContract] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchContract = async () => {
            setLoading(true);
            setError("");
            try {
                const token = localStorage.getItem("access_token");
                if (!token) throw new Error("Veuillez vous connecter.");
                const res = await fetch(`${API_URL}/contracts/my-contract`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "Impossible de charger le contrat.");
                setContract(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchContract();
    }, []);

    const handleSendEmail = async () => {
        if (!contract?.id) return;
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_URL}/contracts/${contract.id}/send`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Échec de l'envoi par email.");
            alert("Contrat envoyé par email.");
        } catch (e) {
            alert(e.message);
        }
    };

    const handleAccept = async () => {
        if (!contract?.id) return;
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${API_URL}/contracts/${contract.id}/accept`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ accepted_at: new Date().toISOString() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Échec de l'acceptation du contrat.");
            setContract((c) => ({ ...c, status: "accepted" }));
            alert("Contrat accepté.");
        } catch (e) {
            alert(e.message);
        }
    };

    const goToEntryFeePayment = () => {
        if (!contract?.id) return;
        navigate(`/paiements/nouveau?type=entry_fee&contract_id=${contract.id}`);
    };

    if (loading) return <div className="p-6">Chargement…</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;
    if (!contract) return <div className="p-6">Aucun contrat.</div>;

    const showPayEntry = contract.entry_fee_status !== "paid";

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Mon contrat</h1>
                    <p className="text-sm text-gray-500">N° {contract.contract_number}</p>
                    <p className="text-sm mt-1">Statut : <span className="font-medium">{contract.status}</span></p>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={contract.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
                    >Télécharger PDF</a>
                    <button
                        onClick={handleSendEmail}
                        className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
                    >Envoyer par email</button>
                </div>
            </header>

            <section>
                {contract.pdf_url ? (
                    <iframe
                        title="Contrat PDF"
                        src={contract.pdf_url}
                        className="w-full h-[70vh] border rounded-xl"
                    />
                ) : (
                    <div className="p-4 border rounded-xl bg-white">Aperçu du contrat indisponible.</div>
                )}
            </section>

            <section className="flex flex-wrap gap-3">
                {contract.status !== "accepted" && (
                    <button
                        onClick={handleAccept}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                    >Accepter & signer</button>
                )}
                {showPayEntry && (
                    <button
                        onClick={goToEntryFeePayment}
                        className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
                    >Payer le droit d'entrée</button>
                )}
            </section>
        </div>
    );
}