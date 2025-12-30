// In useRecordingCapture.js
import { useRef, useCallback } from "react";
import { useRecordingMapTiles } from "./useRecordingMapTiles";
import { useRecordingPixi } from "./useRecordingPixi";
import { useRecordingWindPixi } from "./useRecordingWindPixi";
import { useRecordingTimestamp } from "./useRecordingTimestamp";
import { useRecordingWindParticles } from "./useRecordingWindParticles";

export function useRecordingCapture() {
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const compositeCanvasRef = useRef(null);
    const rafRef = useRef(null);
    const capturingRef = useRef(false);
    const lastFrameRef = useRef(0);

    const { capture: captureTiles } = useRecordingMapTiles();
    const { capture: capturePixi } = useRecordingPixi();
    const { capture: captureWindPixi } = useRecordingWindPixi();
    const { capture: captureWindParticles } = useRecordingWindParticles();
    const { drawTimestamp } = useRecordingTimestamp();

    const startRecording = useCallback(async (mapInstance, {
        fps = 24,
        scale = 1,
        videoBitsPerSecond = 8_000_000,
        getCurrentTime
    } = {}) => {
        const mapContainer = mapInstance?.getContainer();
        if (!mapContainer) { console.error("Map container not found"); return null; }

        const rect = mapContainer.getBoundingClientRect();
        const outW = Math.round(rect.width * scale);
        const outH = Math.round(rect.height * scale);

        // create composite canvas
        const compositeCanvas = document.createElement("canvas");
        compositeCanvas.width = outW;
        compositeCanvas.height = outH;
        compositeCanvasRef.current = compositeCanvas;
        const ctx = compositeCanvas.getContext("2d", { alpha: false, desynchronized: true });

        // init background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, outW, outH);

        chunksRef.current = [];

        // Start MediaRecorder on composite canvas stream
        const stream = compositeCanvas.captureStream(fps);
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8", videoBitsPerSecond });
        recorder.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
        recorder.start(200);
        recorderRef.current = recorder;

        capturingRef.current = true;

        // Frame loop (synchronized capture)
        const minFrameDelta = 1000 / fps;
        let lastTs = performance.now();

        const frameLoop = async (ts) => {
            if (!capturingRef.current) return;

            if (ts - lastTs < minFrameDelta) {
                rafRef.current = requestAnimationFrame(frameLoop);
                return;
            }
            lastTs = ts;

            // 1) draw tiles into composite ctx
            const tilesOk = await captureTiles(mapInstance, ctx, outW, outH, scale);

            // 2) draw pixi on top
            const pixiOk = await capturePixi(mapInstance, ctx, outW, outH, scale);

            // 3) draw wind pixi on top
            const windPixiOk = await captureWindPixi(mapInstance, ctx, outW, outH, scale);

            // 4) draw wind particles on top
            const windParticlesOk = await captureWindParticles(mapInstance, ctx, outW, outH, scale);

            // 5) draw timestamp overlay
            if (getCurrentTime) {
                const currentTime = getCurrentTime();
                drawTimestamp(ctx, currentTime, outW, outH, scale);
            } else {
                console.warn("⚠️ Frame capture - getCurrentTime is undefined!");
            }


            if (!tilesOk || !pixiOk || !windPixiOk || !windParticlesOk) {
                console.warn("Frame capture had issues (CORS / missing canvases).");
            }

            // Next frame
            rafRef.current = requestAnimationFrame(frameLoop);
        };

        rafRef.current = requestAnimationFrame(frameLoop);

        return stream;
    }, [captureTiles, capturePixi, captureWindPixi, captureWindParticles, drawTimestamp]); // ← Remember callbacks

    const stopRecording = useCallback(() => {
        return new Promise((resolve) => {
            capturingRef.current = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);

            setTimeout(() => {
                const recorder = recorderRef.current;
                if (!recorder || recorder.state === "inactive") {
                    resolve(null);
                    return;
                }

                recorder.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: "video/webm" });
                    compositeCanvasRef.current = null;
                    chunksRef.current = [];
                    resolve(blob);
                };

                recorder.stop();
            }, 300);
        });
    }, []);

    return { startRecording, stopRecording, getCompositeCanvas: () => compositeCanvasRef.current };
}
