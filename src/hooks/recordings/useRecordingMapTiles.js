// useRecordingMapTiles.js - Capture map tiles for recording
import { useCallback } from "react";

/**
 * Draws all <img> tiles from leaflet tilePane into target ctx.
 * Relies on reading each tile's boundingClientRect relative to mapContainer.
 *
 * NOTE: tile images must be served with CORS (crossOrigin="anonymous") or drawing may taint canvas.
 */
export function useRecordingMapTiles() {
    const capture = useCallback(async (mapInstance, ctx, outW, outH, scale = 1) => {
        const mapContainer = mapInstance?.getContainer?.();
        if (!mapContainer) {
            console.error("Map container not found for tile capture");
            return false;
        }

        const tilePane = mapContainer.querySelector?.(".leaflet-tile-pane, .leaflet-layer");
        if (!tilePane) {
            console.error("Tile pane not found");
            return false;
        }

        // Clear target
        ctx.clearRect(0, 0, outW, outH);

        // Get reference rects
        const mapRect = mapContainer.getBoundingClientRect();

        // Draw background (optional)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, outW, outH);

        // Grab all tile images
        const imgs = Array.from(tilePane.querySelectorAll("img"));

        // Draw each image at its current position (transforms included)
        for (let img of imgs) {
            // skip hidden / zero-size
            const imgRect = img.getBoundingClientRect();
            if (imgRect.width === 0 || imgRect.height === 0) continue;

            // Destination position relative to the map container
            const dx = Math.round((imgRect.left - mapRect.left) * scale);
            const dy = Math.round((imgRect.top - mapRect.top) * scale);
            const dw = Math.round(imgRect.width * scale);
            const dh = Math.round(imgRect.height * scale);

            try {
                ctx.drawImage(img, dx, dy, dw, dh);
            } catch (err) {
                // drawImage failures are often CORS/taint related
                console.error("Failed to draw tile image (CORS?):", err);
                // Early return false so caller can fallback
                return false;
            }
        }

        return true;
    }, []);

    return { capture };
}