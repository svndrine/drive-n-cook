import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function ContratPublic() {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);
    const [signed, setSigned] = useState(false);
    const [signingInProgress, setSigningInProgress] = useState(false);

    useEffect(() => {
        const run = async () => {
            try {
                console.log('Appel API vers:', `${API}/public/contract/${token}`);
                const r = await fetch(`${API}/public/contract/${token}`);
                const j = await r.json();
                if (!r.ok) throw new Error(j.message || 'Erreur');
                setData(j);
                setSigned(j.status === 'signed');
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
        setSigningInProgress(true);
        try {
            console.log('Acceptation vers:', `${API}/public/contract/${token}/accept`);
            const r = await fetch(`${API}/public/contract/${token}/accept`, { method: 'POST' });
            const j = await r.json();

            if (!r.ok) throw new Error(j.message || 'Erreur lors de la signature');

            if (j.success && j.redirect) {
                // Signature réussie - affichage du succès et redirection
                setSigned(true);
                setMsg(`✅ Contrat signé avec succès le ${j.signed_at} ! Le PDF a été mis à jour avec vos signatures.`);

                // Recharger le PDF après 2 secondes pour voir les signatures
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        } catch (e) {
            console.error('Erreur acceptation:', e);
            setMsg(`❌ ${e.message}`);
        } finally {
            setSigningInProgress(false);
        }
    };

    const downloadPdf = () => {
        const pdfUrl = `${API}/public/contract/${token}/view`;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `contrat_${data.contract_number}_signe.pdf`;
        link.click();
    };

    if (loading) return <div className="p-6">Chargement…</div>;

    if (msg) return (
        <div className="max-w-3xl mx-auto p-6">
            <div className={`mb-4 p-4 rounded-xl ${msg.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {msg}
            </div>

            {signed && (
                <div className="mt-6 space-y-4">
                    <h2 className="text-xl font-semibold">📄 Votre contrat signé</h2>
                    <div className="bg-blue-50 p-4 rounded-xl">
                        <p className="text-blue-800 mb-3">Votre contrat a été signé électroniquement et mis à jour. Vous pouvez maintenant :</p>
                        <div className="space-y-2">
                            <button
                                onClick={downloadPdf}
                                className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
                            >
                                📥 Télécharger le contrat signé (PDF)
                            </button>
                            <p className="text-sm text-blue-600">
                                💳 Prochaine étape : Réglez le droit d'entrée de 50 000€ via le lien reçu par email
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // URL pour le PDF
    const pdfUrl = `${API}/public/contract/${token}/view`;

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Contrat {data.contract_number}</h1>
                {signed && (
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl font-semibold flex items-center gap-2">
                        <span>✓</span>
                        <span>SIGNÉ ÉLECTRONIQUEMENT</span>
                    </div>
                )}
            </div>

            <iframe
                title="Contrat"
                src={pdfUrl}
                className="w-full h-[70vh] border rounded-xl"
            />

            <div className="flex gap-3">
                {!signed ? (
                    <button
                        onClick={accept}
                        disabled={signingInProgress}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                            signingInProgress
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                    >
                        {signingInProgress ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Signature en cours...</span>
                            </div>
                        ) : (
                            '✍️ Accepter & signer'
                        )}
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <div className="text-green-600 font-semibold flex items-center gap-2 px-4 py-3">
                            <span>✅</span>
                            <span>Contrat signé avec succès</span>
                        </div>
                        <button
                            onClick={downloadPdf}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
                        >
                            📥 Télécharger PDF
                        </button>
                    </div>
                )}
            </div>

            {signed && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-yellow-800">
                        <strong>💳 Prochaine étape :</strong> Consultez votre email pour le lien de paiement du droit d'entrée (50 000€)
                    </p>
                </div>
            )}
        </div>
    );
}