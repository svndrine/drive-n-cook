const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function getMyContract() {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_URL}/contracts/my-contract`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erreur contrat");
    return data;
}

export async function sendContractByEmail(id) {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_URL}/contracts/${id}/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erreur envoi email");
    return data;
}

export async function acceptContract(id) {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_URL}/contracts/${id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ accepted_at: new Date().toISOString() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erreur acceptation");
    return data;
}