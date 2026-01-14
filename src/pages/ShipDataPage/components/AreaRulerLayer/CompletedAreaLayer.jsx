import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { useMap } from "react-leaflet";
import { useCompletedAreaHandlers } from "@/hooks";

/**
 * CompletedAreaLayer
 * -------------------
 * Handles persistent completed polygons:
 * - Finalized polygon areas with edges and labels
 * - Visibility toggling
 * - Position editing
 * - Deletion
 * - Never clears automatically
 */
export const CompletedAreaLayer = forwardRef(function CompletedAreasLayer(
    { initialAreas = [] },
    ref
) {
    const map = useMap();
    const refs = useRef(null);

    // -----------------------------
    // Persistent refs (created once)
    // -----------------------------
    if (!refs.current) {
        refs.current = {
            completedAreas: { current: [] },
        };
    }

    // -----------------------------
    // Handlers
    // -----------------------------
    const handlers = useCompletedAreaHandlers(map, refs.current);

    // -----------------------------
    // Pane setup (once)
    // -----------------------------
    useEffect(() => {
        if (!map) return;

        if (!map.getPane("completedAreasPane")) {
            map.createPane("completedAreasPane");
            const pane = map.getPane("completedAreasPane");
            pane.style.zIndex = 400;
            pane.style.pointerEvents = "none";
        }
    }, [map]);

    // -----------------------------
    // Load initial areas
    // -----------------------------
    useEffect(() => {
        if (!initialAreas.length) return;

        initialAreas.forEach(area => {
            handlers.createAreaFromData(area);
        });
    }, [initialAreas, handlers]);

    // -----------------------------
    // Expose API methods
    // -----------------------------
    useImperativeHandle(ref, () => ({
        createAreaFromData(area) {
            handlers.createAreaFromData(area);
        },

        updateArea(id, newPoints) {
            handlers.updateArea(id, newPoints);
        },

        renameArea(id, name) {
            const area = refs.current.completedAreas.current.find(a => a.id === id);
            if (area) area.name = name;
        },

        setAreaVisible(id, visible) {
            handlers.setAreaVisible(id, visible);
        },

        deleteArea(id) {
            handlers.deleteArea(id);
        }
    }));

    return null;
});