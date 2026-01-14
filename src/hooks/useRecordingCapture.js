// ============================================================================
// useRecordingCapture.js
// Handles canvas composition + MediaRecorder lifecycle
// ============================================================================

import { useRef, useCallback, useEffect } from "react";
import {
    useRecordingMapTiles,
    useRecordingPixi,
    useRecordingTimestamp,
    useRecordingWindParticles,
    useRecordingWindPixi,
} from "./recordings";

export function useRecordingCapture() {
    const recorderRef = useRef(null);
    const streamRef = useRef(null);          // 🔧 FIX: track MediaStream
    const chunksRef = useRef([]);
    const compositeCanvasRef = useRef(null);
    const rafRef = useRef(null);
    const capturingRef = useRef(false);

    const { capture: captureTiles } = useRecordingMapTiles();
    const { capture: capturePixi } = useRecordingPixi();
    const { capture: captureWindPixi } = useRecordingWindPixi();
    const { capture: captureWindParticles } = useRecordingWindParticles();
    const { drawTimestamp } = useRecordingTimestamp();

    // -------------------------------------------------------------------------
    // Helper: fully destroy canvas memory
    // -------------------------------------------------------------------------
    const cleanupCanvas = () => {
        const canvas = compositeCanvasRef.current;
        if (canvas) {
            // 🧹 CLEANUP: force GPU + backing store release
            canvas.width = 0;
            canvas.height = 0;
        }
        compositeCanvasRef.current = null;
    };

    // -------------------------------------------------------------------------
    // START RECORDING
    // -------------------------------------------------------------------------
    const startRecording = useCallback(async (mapInstance, {
        fps = 24,
        scale = 1,
        videoBitsPerSecond = 8_000_000,
        getCurrentTime,
    } = {}) => {
        const mapContainer = mapInstance?.getContainer();
        if (!mapContainer) {
            console.error("Map container not found");
            return null;
        }

        const rect = mapContainer.getBoundingClientRect();
        const outW = Math.round(rect.width * scale);
        const outH = Math.round(rect.height * scale);

        // create composite canvas
        const compositeCanvas = document.createElement("canvas");
        compositeCanvas.width = outW;
        compositeCanvas.height = outH;
        compositeCanvasRef.current = compositeCanvas;

        const ctx = compositeCanvas.getContext("2d", {
            alpha: false,
            desynchronized: true,
        });

        // Init background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, outW, outH);

        chunksRef.current = [];

        // Store stream reference for later cleanup
        const stream = compositeCanvas.captureStream(fps);
        streamRef.current = stream;

        const recorder = new MediaRecorder(stream, {
            mimeType: "video/webm;codecs=vp8",
            videoBitsPerSecond,
        });

        recorder.ondataavailable = (e) => {
            if (e.data?.size) chunksRef.current.push(e.data);
        };

        // ⚠️ IMPORTANT: larger timeslice = less memory pressure
        recorder.start(1000);

        recorderRef.current = recorder;
        capturingRef.current = true;

        const minFrameDelta = 1000 / fps;
        let lastTs = performance.now();

        const frameLoop = async (ts) => {
            if (!capturingRef.current) return;

            if (ts - lastTs < minFrameDelta) {
                rafRef.current = requestAnimationFrame(frameLoop);
                return;
            }

            lastTs = ts;

            await captureTiles(mapInstance, ctx, outW, outH, scale);             // Draw Map Tiles: Always render first!
            await capturePixi(mapInstance, ctx, outW, outH, scale);              // Draw Entire Ship Map Layer
            await captureWindPixi(mapInstance, ctx, outW, outH, scale);          // Draw Wind heatmap
            await captureWindParticles(mapInstance, ctx, outW, outH, scale);     // Draw Wind particles

            if (getCurrentTime) {
                drawTimestamp(ctx, getCurrentTime(), outW, outH, scale);
            }

            rafRef.current = requestAnimationFrame(frameLoop);
        };

        rafRef.current = requestAnimationFrame(frameLoop);
        return stream;
    }, [
        captureTiles,
        capturePixi,
        captureWindPixi,
        captureWindParticles,
        drawTimestamp,
    ]);

    // -------------------------------------------------------------------------
    // STOP RECORDING
    // -------------------------------------------------------------------------
    const stopRecording = useCallback(() => {
        return new Promise((resolve) => {
            capturingRef.current = false;

            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }

            const recorder = recorderRef.current;
            const stream = streamRef.current;

            // 🔧 FIX: stop all media tracks
            if (stream) {
                stream.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
            }

            if (!recorder || recorder.state === "inactive") {
                cleanupCanvas();
                resolve(null);
                return;
            }

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, {
                    type: "video/webm",
                });

                // 🧹 CLEANUP: remove references
                recorder.ondataavailable = null;
                recorder.onstop = null;
                recorderRef.current = null;
                chunksRef.current = [];

                cleanupCanvas();
                resolve(blob);
            };

            if (recorder && recorder.state !== "inactive") {
                recorder.stop();
            }
        });
    }, []);

    // -------------------------------------------------------------------------
    // Cleanup on unmount 
    // -------------------------------------------------------------------------
    useEffect(() => {
        return () => {
            const recorder = recorderRef.current;
            capturingRef.current = false;

            if (rafRef.current) cancelAnimationFrame(rafRef.current);

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }

            if (recorder && recorder.state !== "inactive") {
                try {
                    recorder.stop();
                } catch (e) {
                    console.warn("Recorder already stopped", e);
                }
            }
            cleanupCanvas();
        };
    }, []);

    return {
        startRecording,
        stopRecording,
        getCompositeCanvas: () => compositeCanvasRef.current,
    };
}
