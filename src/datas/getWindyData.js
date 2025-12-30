export async function getWindyData({ lat, lon }) {
    const BACKEND_BASE =
        window.location.hostname === "localhost"
            ? "http://localhost:3001"
            : `http://${window.location.hostname}:3001`;

    const response = await fetch(`${BACKEND_BASE}/api/wind-grid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon }),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch wind grid");
    }

    return response.json();
}
