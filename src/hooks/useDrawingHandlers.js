import L from "leaflet";
import { useCallback } from "react";
import { RULER_COLORS, RULER_CONFIG, createMarker, createMeasurementLabel, createRangeRings, createFillCircle, clearCircleElements, clearTempElements } from "@/utils";

function clearRingLayers(refs, map) {
    if (refs.ringLayer.current) map.removeLayer(refs.ringLayer.current);
    if (refs.ringLabels.current) map.removeLayer(refs.ringLabels.current);
    refs.ringLayer.current = null;
    refs.ringLabels.current = null;
}

export function useDrawingHandlers(map, refs, ui) {

    /* -----------------------------
     * Helpers
     * ----------------------------- */
    // Clear all preview drawing elements
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

    // Check whether a marker is created
    const canPreview = useCallback(() => {
        return (
            refs.isActive.current &&
            refs.hasAnchor.current &&
            refs.chainStartIndex.current !== null &&
            refs.points.current.length - 1 >= refs.chainStartIndex.current
        );
    }, [refs]);

    // Update marker interactivity
    const updateMarkerInteractivity = useCallback((start) => {
        const last = refs.points.current.length - 1;

        refs.points.current.forEach((p, index) => {
            const el = p.marker.getElement();
            if (!el) return;

            if (index === start || index === last) {
                el.style.pointerEvents = "auto";
                el.style.cursor = "pointer";
            } else {
                el.style.pointerEvents = "none";
                el.style.cursor = "default";
            }
        });
    }, [refs]);

    // Close polygon when clicked on the start marker
    const closePolygon = useCallback((start, lastIndex) => {
        if (lastIndex - start + 1 >= 3) {
            const chainPoints = refs.points.current
                .slice(start, lastIndex + 1)
                .map(p => p.latlng);

            const area = {
                id: Date.now().toString(),
                name: "",
                points: chainPoints.map(p => ({ lat: p.lat, lng: p.lng })),
            };

            ui?.addCompletedAreaUI(area);
        }

        clearPreview();

        refs.points.current.forEach(p => {
            if (p.marker) map.removeLayer(p.marker);
        });

        refs.lines.current.forEach(l => map.removeLayer(l));
        refs.labels.current.forEach(l => map.removeLayer(l));

        refs.points.current = [];
        refs.lines.current = [];
        refs.labels.current = [];

        refs.hasAnchor.current = false;
        refs.chainStartIndex.current = null;

        ui?.setHasAnchorUI(false);
        updateMarkerInteractivity(null);
    }, [map, refs, ui, clearPreview, updateMarkerInteractivity]);

    // Undo last marker added
    const undoLastPoint = useCallback(() => {
        if (refs.points.current.length === 0) return;

        const lastPoint = refs.points.current.pop();

        if (lastPoint.marker) map.removeLayer(lastPoint.marker);

        const lastLine = refs.lines.current.pop();
        if (lastLine) map.removeLayer(lastLine);

        const lastLabel = refs.labels.current.pop();
        if (lastLabel) map.removeLayer(lastLabel);

        // Reset state if anchor removed
        if (refs.points.current.length === 0) {
            refs.hasAnchor.current = false;
            refs.chainStartIndex.current = null;
            ui?.setHasAnchorUI(false);
            clearPreview();
        }
    }, [map, refs, ui, clearPreview]);

    /* -----------------------------
     * Map Click
     * ----------------------------- */
    const onMapClick = useCallback((e) => {
        if (!refs.isActive.current) return;

        console.log("[DRAWING] map click fired", e.latlng);

        const isNewChain = !refs.hasAnchor.current;
        const marker = createMarker(e.latlng, isNewChain, map, "drawingPane");

        if (isNewChain) {
            refs.hasAnchor.current = true;
            refs.chainStartIndex.current = refs.points.current.length;
            ui?.setHasAnchorUI(true);
        }

        marker.on("click", () => {
            const startMarker = refs.chainStartIndex.current;
            const lastMarker = refs.points.current.length - 1;
            const createdMarker = refs.points.current.findIndex(p => p.marker === marker);

            // Start marker → close polygon
            if (createdMarker === startMarker) {
                closePolygon(startMarker, lastMarker);
                return;
            }

            // Last marker → undo
            if (createdMarker === lastMarker) {
                undoLastPoint();
                updateMarkerInteractivity(startMarker);
                return;
            }
        });

        if (
            refs.hasAnchor.current &&
            refs.chainStartIndex.current !== null &&
            refs.points.current.length > refs.chainStartIndex.current
        ) {
            const prev = refs.points.current.at(-1);

            refs.lines.current.push(
                L.polyline([prev.latlng, e.latlng], {
                    color: RULER_COLORS.line,
                    weight: 3,
                    opacity: 0.7,
                    pane: 'drawingPane',
                    interactive: false,
                }).addTo(map)
            );

            refs.labels.current.push(
                createMeasurementLabel(prev.latlng, e.latlng, false, map, "drawingPane")
            );
        }

        refs.points.current.push({ latlng: e.latlng, marker });

        updateMarkerInteractivity(refs.chainStartIndex.current);
    }, [map, refs, ui, updateMarkerInteractivity, closePolygon, undoLastPoint]);

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
            {
                color: RULER_COLORS.line,
                weight: 2,
                opacity: 0.4,
                dashArray: "5,5",
                pane: 'drawingPane',
                interactive: false,
            }
        ).addTo(map);

        refs.tempLabel.current = createMeasurementLabel(
            last.latlng,
            e.latlng,
            true,
            map,
            "drawingPane"
        );

        const km = last.latlng.distanceTo(e.latlng) / 1000;
        const maxKm = Math.max(RULER_CONFIG.minRingDistance, km);

        if (!refs.fillCircle.current) {
            refs.fillCircle.current = createFillCircle(last.latlng, maxKm, map, "drawingPane");
            refs.fillCircle.current.bringToBack();
        } else {
            refs.fillCircle.current.setRadius(maxKm * 1000);
            refs.fillCircle.current.setLatLng(last.latlng);
        }

        clearRingLayers(refs, map);
        const { rings, labels } = createRangeRings(last.latlng, maxKm, map, "drawingPane");
        refs.ringLayer.current = rings;
        refs.ringLabels.current = labels;
    }, [map, refs, canPreview]);

    return { onMapClick, onMouseMove, clearPreview };
}