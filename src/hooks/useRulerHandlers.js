import L from "leaflet";
import { useCallback } from "react";
import { createMarker, buildAreaLayers, createMeasurementLabel, createRangeRings, createFillCircle, clearCircleElements, clearTempElements, COLORS, CONFIG } from "@/utils";

/* -----------------------------
 * Helpers
 * ----------------------------- */
function clearRingLayers(refs, map) {
    if (refs.ringLayer.current) map.removeLayer(refs.ringLayer.current);
    if (refs.ringLabels.current) map.removeLayer(refs.ringLabels.current);
    refs.ringLayer.current = null;
    refs.ringLabels.current = null;
}

/* -----------------------------
 * Hook
 * ----------------------------- */
export function useRulerHandlers(map, refs, ui) {

    const clearPreview = useCallback(() => {
        clearTempElements(refs.tempLine.current, refs.tempLabel.current, map);
        clearCircleElements(
            refs.fillCircle.current,
            refs.ringLayer.current,
            refs.ringLabels.current,
            map
        );

        refs.tempLine.current = null;
        refs.tempLabel.current = null;
        refs.fillCircle.current = null;
        refs.ringLayer.current = null;
        refs.ringLabels.current = null;
    }, [map, refs]);


    const canPreview = useCallback(() => {
        return (
            refs.isActive.current &&
            refs.hasAnchor.current &&
            refs.chainStartIndex.current !== null &&
            refs.points.current.length - 1 >= refs.chainStartIndex.current
        );
    }, [refs]);

    /* -----------------------------
     * Update Markers
     * ----------------------------- */

    const updateCompletedArea = useCallback((areaId, newPoints) => {
        const area = refs.completedAreas.current.find(a => a.id === areaId);
        if (!area) return;

        // 1. Remove old layers
        area.edges.forEach(l => map.removeLayer(l));
        area.labels.forEach(l => map.removeLayer(l));
        map.removeLayer(area.polygon);

        // 2. Rebuild everything
        const rebuilt = buildAreaLayers(newPoints, map);

        // 3. Assign new references
        area.points = newPoints.map(p => ({ ...p }));
        area.polygon = rebuilt.polygon;
        area.edges = rebuilt.edges;
        area.labels = rebuilt.labels;

    }, [map, refs]);


    /* -----------------------------
     * Map Click
     * ----------------------------- */
    const onMapClick = useCallback((e) => {

        if (!refs.isActive.current) return;

        console.log("[RULER] map click fired", e.latlng);

        const isNewChain = !refs.hasAnchor.current;
        const marker = createMarker(e.latlng, isNewChain, map);

        if (isNewChain) {
            refs.hasAnchor.current = true;
            refs.chainStartIndex.current = refs.points.current.length;
            ui?.setHasAnchorUI(true);

            marker.on("click", () => {
                const start = refs.chainStartIndex.current;
                const end = refs.points.current.length - 1;

                if (end - start + 1 >= 3) {
                    const chainPoints = refs.points.current
                        .slice(start, end + 1)
                        .map(p => p.latlng);

                    // Save completed area info
                    const areaLayers = buildAreaLayers(
                        chainPoints.map(p => ({ lat: p.lat, lng: p.lng })),
                        map
                    );

                    const area = {
                        id: crypto.randomUUID(),
                        name: "",
                        points: chainPoints.map(p => ({ lat: p.lat, lng: p.lng })),
                        ...areaLayers
                    };

                    refs.completedAreas.current.push(area);
                    ui?.addCompletedAreaUI(area);
                }

                // Only clear preview elements, not the completed polygon
                clearPreview();

                // ---- CLEAR DRAWING GEOMETRY ----
                // Remove drawing markers
                refs.points.current.forEach(p => {
                    if (p.marker) map.removeLayer(p.marker);
                });

                // Remove drawing lines
                refs.lines.current.forEach(l => map.removeLayer(l));

                // Remove drawing labels
                refs.labels.current.forEach(l => map.removeLayer(l));

                // Reset drawing refs
                refs.points.current = [];
                refs.lines.current = [];
                refs.labels.current = [];

                // Reset anchor state for next polygon
                refs.hasAnchor.current = false;
                refs.chainStartIndex.current = null;
                ui?.setHasAnchorUI(false);
            });
        }

        if (
            refs.hasAnchor.current &&
            refs.chainStartIndex.current !== null &&
            refs.points.current.length > refs.chainStartIndex.current
        ) {
            const prev = refs.points.current.at(-1);

            refs.lines.current.push(
                L.polyline([prev.latlng, e.latlng], {
                    color: COLORS.line,
                    weight: 3,
                    opacity: 0.7
                }).addTo(map)
            );

            refs.labels.current.push(
                createMeasurementLabel(prev.latlng, e.latlng, false, map)
            );
        }

        refs.points.current.push({ latlng: e.latlng, marker });
    }, [map, refs, clearPreview, ui]);

    /* -----------------------------
     * Mouse Move
     * ----------------------------- */
    const onMouseMove = useCallback((e) => {
        if (!canPreview()) return;

        const currentChainPoints = refs.points.current.slice(refs.chainStartIndex.current);
        const last = currentChainPoints.at(-1);

        if (refs.tempLine.current) map.removeLayer(refs.tempLine.current);
        if (refs.tempLabel.current) map.removeLayer(refs.tempLabel.current);

        refs.tempLine.current = L.polyline(
            [last.latlng, e.latlng],
            { color: COLORS.line, weight: 2, opacity: 0.4, dashArray: "5,5" }
        ).addTo(map);

        refs.tempLabel.current = createMeasurementLabel(
            last.latlng,
            e.latlng,
            true,
            map
        );

        const km = last.latlng.distanceTo(e.latlng) / 1000;
        const maxKm = Math.max(CONFIG.minRingDistance, km);

        if (!refs.fillCircle.current) {
            refs.fillCircle.current = createFillCircle(last.latlng, maxKm, map);
            refs.fillCircle.current.bringToBack();
        } else {
            refs.fillCircle.current.setRadius(maxKm * 1000);
            refs.fillCircle.current.setLatLng(last.latlng);
        }

        clearRingLayers(refs, map);
        const { rings, labels } = createRangeRings(last.latlng, maxKm, map);
        refs.ringLayer.current = rings;
        refs.ringLabels.current = labels;
    }, [map, refs, canPreview]);

    return { updateCompletedArea, onMapClick, onMouseMove, clearPreview };
}