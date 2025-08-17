export default function PaiementFailed() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow text-center space-y-2">
                <h1 className="text-2xl font-semibold">Paiement non abouti ❌</h1>
                <p className="text-gray-600">Veuillez réessayer ou contacter le support.</p>
            </div>
        </div>
    );
}