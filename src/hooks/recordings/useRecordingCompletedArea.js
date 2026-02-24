import { useCallback } from "react";

/**
 * Captures the completed areas PIXI overlay into the recording canvas
 * Uses the same leaflet-pixi-overlay approach as ships
 */
export function useRecordingCompletedAreas() {
    const capture = useCallback(async (mapInstance, ctx, outW, outH, scale = 1) => {
        if (!mapInstance) {
            console.error("mapInstance required for completed areas capture");
            return false;
        }

        // Get the completed areas overlay (same pattern as ship overlay)
        const areasOverlay = mapInstance.completedAreasOverlay;

        if (!areasOverlay) {
            // No overlay mounted yet, skip silently
            return true;
        }

        const pixiRenderer = areasOverlay._renderer;
        const pixiContainer = areasOverlay._pixiContainer;

        if (!pixiRenderer || !pixiContainer) {
            console.warn("Completed areas PIXI renderer not initialized");
            return true;
        }

        const pixiCanvas = pixiRenderer.view;
        if (!pixiCanvas) {
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
            // Force render the latest state
            pixiRenderer.render(pixiContainer);

            // Flush WebGL pipeline to ensure canvas is ready
            if (pixiRenderer.gl?.flush) {
                pixiRenderer.gl.flush();
            }

            // Draw onto composite canvas
            ctx.drawImage(pixiCanvas, dx, dy, dw, dh);
        } catch (err) {
            console.error("Failed to draw completed areas canvas:", err);
            return false;
        }

        return true;
    }, []);

    return { capture };
}