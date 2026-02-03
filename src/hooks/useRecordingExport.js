import { useState, useCallback } from "react";
import { isIOS, downloadBlob, uploadAndTranscode, waitForTranscodeDone } from "@/utils";

export function useRecordingExport() {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);

    const exportRecording = useCallback(async (blob) => {
        setError(null);

        // iOS-safe navigation
        const openDownload = (url) => {
            const win = window.open(url, "_self");
            if (!win) {
                // fallback if popup blocked
                window.open(url, "_blank");
            }
        };

        // -----------------------------
        // Desktop / Android → WebM
        // -----------------------------
        if (!isIOS()) {
            // Download directly as WebM
            downloadBlob(blob, "webm");
            return;
        }

        // -----------------------------
        // iOS → MP4 (server transcode)
        // -----------------------------
        setIsExporting(true);

        try {
            // Upload Webm blob and get jobId
            const { jobId, BACKEND_BASE } = await uploadAndTranscode(blob);

            // Wait for transcode and get final mp4Url
            const mp4Url = await waitForTranscodeDone(BACKEND_BASE, jobId);

            // Navigate the final URL
            const fullUrl = `${BACKEND_BASE}${mp4Url}`;
            openDownload(fullUrl);

        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to export video");
        } finally {
            setIsExporting(false);
        }
    }, []);

    return {
        exportRecording,
        isExporting,
        exportError: error
    };
}
