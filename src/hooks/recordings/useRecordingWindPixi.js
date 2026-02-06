// useRecordingWindPixi.js - Capture wind heatmap for recording
import { useCallback } from "react";

export function useRecordingWindPixi() {
    const capture = useCallback((mapInstance, ctx, outW, outH, scale = 1) => {
        // Get wind heatmap 
        const app = mapInstance?._windPixiApp;
        if (!app || !app.renderer?.view) return true;

        const windCanvas = app.renderer.view;

        // Compute bounding rects to place heatmap correctly
        const mapRect = mapInstance.getContainer().getBoundingClientRect();
        const windRect = windCanvas.getBoundingClientRect();

        const dx = Math.round((windRect.left - mapRect.left) * scale);
        const dy = Math.round((windRect.top - mapRect.top) * scale);
        const dw = Math.round(windRect.width * scale);
        const dh = Math.round(windRect.height * scale);

        try {
            // Render PIXI heatmap
            app.renderer.render(app.stage);
            app.renderer.gl?.flush?.();
            ctx.drawImage(windCanvas, dx, dy, dw, dh);
        } catch (e) {
            console.warn("Wind PIXI capture failed", e);
            return false;
        }

        return true;
    }, []);

    return { capture };
}
