// useRecordingPixi.js - Capture ships overlay for recording 
import { useCallback } from "react";

/**
 * Copies PIXI renderer's view (canvas) into the target ctx at the correct offset.
 *
 * Assumes your pixi overlay renderer is accessible via:
 *   mapInstance.pixiOverlay._renderer (like you had)
 *
 * If your integration differs, adapt the retrieval logic for the pixi canvas.
 */
export function useRecordingPixi() {
    const capture = useCallback(async (mapInstance, ctx, outW, outH, scale = 1) => {
        if (!mapInstance) {
            console.error("mapInstance required for PIXI capture");
            return false;
        }

        // Get pixi renderer view (canvas)
        const pixiOverlay = mapInstance.pixiOverlay || mapInstance._pixiOverlay;
        const pixiRenderer = pixiOverlay?._renderer || pixiOverlay?._pixiRenderer || (pixiOverlay && pixiOverlay._renderer);

        let pixiCanvas = null;
        if (pixiRenderer) {
            // pixiRenderer.view is the canvas element used by PIXI
            pixiCanvas = pixiRenderer.view || pixiRenderer.renderer?.view;
        } else {
            // Some integrations expose _pixiContainer._renderer - fallback
            console.warn("PIXI renderer not found on mapInstance.pixiOverlay");
        }

        if (!pixiCanvas) {
            // nothing to draw, but not an error (maybe no overlay)
            return true;
        }

        // Compute bounding rects to place pixi canvas exactly
        const mapContainer = mapInstance.getContainer();
        const mapRect = mapContainer.getBoundingClientRect();
        const pixiRect = pixiCanvas.getBoundingClientRect();

        const dx = Math.round((pixiRect.left - mapRect.left) * scale);
        const dy = Math.round((pixiRect.top - mapRect.top) * scale);
        const dw = Math.round(pixiRect.width * scale);
        const dh = Math.round(pixiRect.height * scale);

        try {
            // Ensure latest PIXI render flushed (some versions need manual flush)
            if (pixiRenderer && typeof pixiRenderer.render === "function") {
                try {
                    // If you keep a reference to the stage or container, render it first:
                    if (pixiOverlay._pixiContainer && pixiRenderer) {
                        pixiRenderer.render(pixiOverlay._pixiContainer);
                        if (pixiRenderer.gl?.flush) pixiRenderer.gl.flush();
                    }
                } catch (e) { /* ignore render errors */ }
            }

            ctx.drawImage(pixiCanvas, dx, dy, dw, dh);
        } catch (err) {
            console.error("Failed to draw PIXI canvas:", err);
            return false;
        }

        return true;
    }, []);

    return { capture };
}
