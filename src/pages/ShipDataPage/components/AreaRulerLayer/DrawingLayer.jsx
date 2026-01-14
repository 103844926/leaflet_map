import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useMap } from "react-leaflet";
import { clearReviewState } from "@/utils";
import { useDrawingHandlers } from "@/hooks";

/**
 * DrawingLayer
 * -------------
 * Handles temporary drawing state:
 * - Active markers, lines, labels during polygon creation
 * - Preview circles and range rings
 * - Clears completely when drawing stops or completes
 */
export const DrawingLayer = forwardRef(function DrawingLayer(
    { drawingEnabled, onCompletedArea },
    ref
) {
    const map = useMap();
    const refs = useRef(null);

    // -----------------------------
    // Persistent refs (created once)
    // -----------------------------
    if (!refs.current) {
        refs.current = {
            isActive: { current: false },
            hasAnchor: { current: false },
            chainStartIndex: { current: null },

            points: { current: [] },
            lines: { current: [] },
            labels: { current: [] },

            fillCircle: { current: null },
            ringLayer: { current: null },
            ringLabels: { current: null },

            tempLine: { current: null },
            tempLabel: { current: null },
        };
    }

    // -----------------------------
    // Handlers
    // -----------------------------
    const handlers = useDrawingHandlers(map, refs.current, {
        setHasAnchorUI: () => { },
        addCompletedAreaUI: onCompletedArea,
    });

    // -----------------------------
    // Pane setup (once)
    // -----------------------------
    useEffect(() => {
        if (!map) return;

        if (!map.getPane("drawingPane")) {
            map.createPane("drawingPane");
            const pane = map.getPane("drawingPane");
            pane.style.zIndex = 450;
            pane.style.pointerEvents = "none";
        }
    }, [map]);

    // -----------------------------
    // Attach map listeners (once)
    // -----------------------------
    useEffect(() => {
        if (!map) return;

        map.on("click", handlers.onMapClick);
        map.on("mousemove", handlers.onMouseMove);

        return () => {
            map.off("click", handlers.onMapClick);
            map.off("mousemove", handlers.onMouseMove);
        };
    }, [map, handlers]);

    // -----------------------------
    // Toggle active / visibility
    // -----------------------------
    useEffect(() => {
        refs.current.isActive.current = drawingEnabled;

        if (!drawingEnabled) {
            clearReviewState(refs.current, map);
        }
    }, [drawingEnabled, map]);

    // -----------------------------
    // Expose cleanup method
    // -----------------------------
    useImperativeHandle(ref, () => ({
        clearDrawing() {
            handlers.clearPreview();
        }
    }));

    return null;
});