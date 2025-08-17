import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function ContratPublic() {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);

    // DEBUG TEMPORAIRE
    console.log('Token reçu:', token);
    console.log('URL complète:', window.location.href);

    useEffect(() => {
        const run = async () => {
            try {
                console.log('Appel API vers:', `${API}/public/contract/${token}`);
                const r = await fetch(`${API}/public/contract/${token}`);
                const j = await r.json();
                if (!r.ok) throw new Error(j.message || 'Erreur');
                setData(j);
            } catch (e) {
                console.error('Erreur API:', e);
                setMsg(e.message);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [token]);

    const accept = async () => {
        try {
            console.log('Acceptation vers:', `${API}/public/contract/${token}/accept`);
            const r = await fetch(`${API}/public/contract/${token}/accept`, { method: 'POST' });
            const j = await r.json();
            if (!r.ok) throw new Error(j.message || '');
            setMsg("Contrat accepté. Vous pouvez maintenant régler le droit d'entrée via le lien reçu par email.");
        } catch (e) {
            console.error('Erreur acceptation:', e);
            setMsg(e.message);
        }
    };

    if (loading) return <div className="p-6">Chargement…</div>;
    if (msg) return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="mb-4 p-3 rounded bg-gray-100">{msg}</div>
            {data?.pdf_url && (
                <iframe title="Contrat" src={data.pdf_url} className="w-full h-[70vh] border rounded-xl" />
            )}
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Contrat {data.contract_number}</h1>
            {data.pdf_url ? (
                <iframe title="Contrat" src={data.pdf_url} className="w-full h-[70vh] border rounded-xl" />
            ) : (
                <div className="p-4 border rounded">Aperçu indisponible</div>
            )}
            <div className="flex gap-3">
                <button onClick={accept} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
                    Accepter & signer
                </button>
            </div>
        </div>
    );
}