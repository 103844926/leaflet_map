import { useCallback } from "react";
import { buildAreaLayers } from "@/utils";

export function useCompletedAreaHandlers(map, refs) {

    /* -----------------------------
     * Create Area from Data
     * ----------------------------- */
    const createAreaFromData = useCallback((areaData) => {
        const { id, points, name, visible = false } = areaData;

        if (!points || points.length < 3) return;

        // 🚨 Prevent duplicate creation
        const exists = refs.completedAreas.current.some(a => a.id === id);
        if (exists) return;

        const rebuilt = buildAreaLayers(points, map, "completedAreasPane");

        const completedArea = {
            id,
            name,
            points: points.map(p => ({ ...p })),
            polygon: rebuilt.polygon,
            edges: rebuilt.edges,
            labels: rebuilt.labels,
            visible,
        };

        refs.completedAreas.current.push(completedArea);

        if (!visible) {
            map.removeLayer(rebuilt.polygon);
            rebuilt.edges.forEach(l => map.removeLayer(l));
            rebuilt.labels.forEach(l => map.removeLayer(l));
        }
    }, [map, refs]);

    /* -----------------------------
     * Update Area
     * ----------------------------- */
    const updateArea = useCallback((areaId, newPoints) => {
        const area = refs.completedAreas.current.find(a => a.id === areaId);
        if (!area) return;

        const wasVisible = area.visible;

        // Remove old layers
        if (area.polygon) map.removeLayer(area.polygon);
        area.edges?.forEach(l => map.removeLayer(l));
        area.labels?.forEach(l => map.removeLayer(l));

        // Rebuild layers
        const rebuilt = buildAreaLayers(newPoints, map, "completedAreasPane");

        // Update references
        area.points = newPoints.map(p => ({ ...p }));
        area.polygon = rebuilt.polygon;
        area.edges = rebuilt.edges;
        area.labels = rebuilt.labels;

        // Restore visibility state
        if (!wasVisible) {
            map.removeLayer(rebuilt.polygon);
            rebuilt.edges.forEach(l => map.removeLayer(l));
            rebuilt.labels.forEach(l => map.removeLayer(l));
        }
    }, [map, refs]);

    /* -----------------------------
     * Set Area Visibility
     * ----------------------------- */
    const setAreaVisible = useCallback((id, visible) => {
        const area = refs.completedAreas.current.find(a => a.id === id);
        if (!area) return;

        const toggle = (layer, show) => {
            if (!layer) return;
            show ? layer.addTo(map) : map.removeLayer(layer);
        };

        toggle(area.polygon, visible);
        area.edges?.forEach(e => toggle(e, visible));
        area.labels?.forEach(l => toggle(l, visible));

        area.visible = visible;
    }, [map, refs]);

    /* -----------------------------
     * Delete Area
     * ----------------------------- */
    const deleteArea = useCallback((id) => {
        const areaIndex = refs.completedAreas.current.findIndex(a => a.id === id);
        if (areaIndex === -1) return;

        const area = refs.completedAreas.current[areaIndex];

        // Remove all layers from map
        if (area.polygon) map.removeLayer(area.polygon);
        area.edges?.forEach(edge => map.removeLayer(edge));
        area.labels?.forEach(label => map.removeLayer(label));

        // Remove from refs
        refs.completedAreas.current.splice(areaIndex, 1);
    }, [map, refs]);

    return {
        createAreaFromData,
        updateArea,
        setAreaVisible,
        deleteArea,
    };
}