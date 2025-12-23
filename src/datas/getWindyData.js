export async function getWindyData({ lat, lon }) {
    const response = await fetch("http://localhost:3001/api/wind-grid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon }),
    });

    if (!response.ok) throw new Error("Failed to fetch wind grid");

    return response.json();
}
