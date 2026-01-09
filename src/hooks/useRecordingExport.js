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
            downloadBlob(blob, "webm");
            return;
        }

        // -----------------------------
        // iOS → MP4 (server transcode)
        // -----------------------------
        setIsExporting(true);

        try {
            const { jobId, BACKEND_BASE } = await uploadAndTranscode(blob);

            // ⏳ WAIT for FFmpeg to fully finish
            const mp4Url = await waitForTranscodeDone(BACKEND_BASE, jobId);

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
