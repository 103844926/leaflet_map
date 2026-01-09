import L from "leaflet";
import { createMarker, createMeasurementLabel, createRangeRings, createFillCircle, clearCircleElements, clearTempElements, clearAllElements, COLORS, CONFIG } from "@/utils";

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
export function useRulerHandlers(map, refs) {

    const clearPreview = () => {
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
    };

    const canPreview = () =>
        refs.isActive.current &&
        refs.hasAnchor.current &&
        refs.chainStartIndex.current !== null &&
        refs.points.current.length - 1 >= refs.chainStartIndex.current;

    /* -----------------------------
     * Map Click
     * ----------------------------- */
    function onMapClick(e) {
        if (!refs.isActive.current) return;

        const isNewChain = !refs.hasAnchor.current;
        const marker = createMarker(e.latlng, isNewChain, map);

        if (isNewChain) {
            refs.hasAnchor.current = true;
            refs.chainStartIndex.current = refs.points.current.length;

            marker.on("click", () => {
                const start = refs.chainStartIndex.current;
                const end = refs.points.current.length - 1;

                if (end - start + 1 >= 3) {
                    const first = refs.points.current[start];
                    const last = refs.points.current[end];

                    refs.lines.current.push(
                        L.polyline([last.latlng, first.latlng], {
                            color: COLORS.line,
                            weight: 3,
                            opacity: 0.7,
                            dashArray: "6,4"
                        }).addTo(map)
                    );

                    refs.labels.current.push(
                        createMeasurementLabel(last.latlng, first.latlng, false, map)
                    );
                }

                clearPreview();
                refs.hasAnchor.current = false;
                refs.chainStartIndex.current = null;
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
    }

    /* -----------------------------
     * Mouse Move
     * ----------------------------- */
    function onMouseMove(e) {
        if (!canPreview()) return;

        const last = refs.points.current.at(-1);

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
        }

        clearRingLayers(refs, map);
        const { rings, labels } = createRangeRings(last.latlng, maxKm, map);
        refs.ringLayer.current = rings;
        refs.ringLabels.current = labels;
    }

    /* -----------------------------
     * Button
     * ----------------------------- */
    function onButtonClick(e) {
        L.DomEvent.preventDefault(e);

        if (refs.isActive.current) {
            refs.isActive.current = false;
            refs.hasAnchor.current = false;
            refs.chainStartIndex.current = null;
            clearAllElements(refs, map);

            refs.button.current.style.backgroundColor = "";
            refs.button.current.style.color = "";
            map.getContainer().style.cursor = "";
        } else {
            refs.isActive.current = true;
            refs.button.current.style.backgroundColor = COLORS.marker;
            refs.button.current.style.color = "white";
            map.getContainer().style.cursor = "crosshair";
        }
    }

    return { onMapClick, onMouseMove, onButtonClick };
}