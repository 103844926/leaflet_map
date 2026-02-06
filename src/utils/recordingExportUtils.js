// src/utils/recordingExportUtils.js
// IOS check
export function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// Default export: Download blob as file
export function downloadBlob(blob, ext) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ship-recording-${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
}

// Upload blob to backend and get jobId
export async function uploadAndTranscode(blob) {
    const form = new FormData();
    form.append("video", blob, "recording.webm");

    const BACKEND_BASE =
        window.location.hostname === "localhost"
            ? "http://localhost:3001"
            : `http://${window.location.hostname}:3001`;

    const res = await fetch(`${BACKEND_BASE}/api/transcode`, {
        method: "POST",
        body: form
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error("Transcode failed:", errorText);
        throw new Error(`Transcode failed: ${res.status}`);
    }

    const data = await res.json();

    // ✅ Only validate jobId now
    if (!data?.jobId) {
        throw new Error("Invalid response: missing jobId");
    }

    return { jobId: data.jobId, BACKEND_BASE };
}

// Use said jobId for live update and get final URL
export function waitForTranscodeDone(BACKEND_BASE, jobId) {
    return new Promise((resolve, reject) => {
        const es = new EventSource(
            `${BACKEND_BASE}/api/transcode/progress/${jobId}`
        );

        es.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.done) {
                es.close();
                resolve(data.mp4Url);
            }
        };

        es.onerror = (err) => {
            es.close();
            reject(new Error("Transcode progress connection failed"));
        };
    });
}
