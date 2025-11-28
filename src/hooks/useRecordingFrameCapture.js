import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";

export function useRecordingFrameCapture() {
    const recordedFramesRef = useRef([]);
    const animationFrameRef = useRef(null);
    const recordingTimeRef = useRef(0);

    const captureFrame = useCallback(async (mapContainer) => {
        try {
            const canvas = await html2canvas(mapContainer, {
                useCORS: true,
                allowTaint: true,
                logging: false,
                width: mapContainer.offsetWidth,
                height: mapContainer.offsetHeight
            });
            return canvas.toDataURL("image/png");
        } catch (err) {
            console.error("Frame capture failed:", err);
            return null;
        }
    }, []);

    const clearFrames = useCallback(() => {
        recordedFramesRef.current = [];
        recordingTimeRef.current = 0;
        clearTimeout(animationFrameRef.current);
    }, []);

    return {
        recordedFramesRef,
        animationFrameRef,
        recordingTimeRef,
        captureFrame,
        clearFrames
    };
}