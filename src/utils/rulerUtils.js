import L from "leaflet";

/* -----------------------------
 * Constants
 * ----------------------------- */
export const RULER_COLORS = {
    firstMarker: '#ff4444',
    marker: '#4444ff',
    line: '#4444ff',
    ringStroke: '#00e5ff',
    ringFill: '#1fe9ff',
    circleBorder: '#00717d',
    labelBg: 'rgba(0, 0, 0, 0.8)',
    labelBgTemp: 'rgba(0, 0, 0, 0.6)',
    totalBg: 'rgba(68, 68, 255, 0.9)',
    ringLabelBg: 'rgba(0, 0, 0, 0.7)',
    ringLabelText: '#1fe9ff',
    polygonFill: '#4444ff',
    polygonStroke: '#4444ff'
};

export const RULER_CONFIG = {
    ringInterval: 5,
    minRingDistance: 5,
    markerSize: 12,
    tolerance: 12,
    polygonFillOpacity: 0.2,
    polygonStrokeOpacity: 0.5,
    polygonStrokeWeight: 2
};

/* -----------------------------
 * Calculation Functions
 * ----------------------------- */
export function calculateBearing(latlng1, latlng2) {
    const lat1 = latlng1.lat * Math.PI / 180;
    const lat2 = latlng2.lat * Math.PI / 180;
    const dLng = (latlng2.lng - latlng1.lng) * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing.toFixed(2);
}

export function formatDistance(meters) {
    if (meters < 1000) {
        return meters.toFixed(2) + " m";
    } else {
        return (meters / 1000).toFixed(2) + " km";
    }
}

/* -----------------------------
 * Marker & Label Creation
 * ----------------------------- */
export function createMarker(latlng, isFirst, map, paneName) {
    const markerIcon = L.divIcon({
        className: "ruler-marker",
        html: `<div style="
            width: ${RULER_CONFIG.markerSize}px;
            height: ${RULER_CONFIG.markerSize}px;
            background: ${isFirst ? RULER_COLORS.firstMarker : RULER_COLORS.marker};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 4px rgba(0,0,0,0.5);
            cursor: default;
        "></div>`,
        iconSize: [RULER_CONFIG.markerSize, RULER_CONFIG.markerSize],
        iconAnchor: [RULER_CONFIG.markerSize / 2, RULER_CONFIG.markerSize / 2]
    });

    const marker = L.marker(latlng, {
        icon: markerIcon,
        pane: paneName,
        interactive: true
    }).addTo(map);

    marker._isFirst = isFirst;
    return marker;
}


export function createMeasurementLabel(latlng1, latlng2, isTemp, map, paneName) {
    const distance = latlng1.distanceTo(latlng2);
    const bearing = calculateBearing(latlng1, latlng2);

    const midPoint = L.latLng(
        (latlng1.lat + latlng2.lat) / 2,
        (latlng1.lng + latlng2.lng) / 2
    );

    const labelIcon = L.divIcon({
        className: "ruler-label-wrapper",
        html: `
            <div class="ruler-label ${isTemp ? "temp" : ""}">
                <div class="distance">${formatDistance(distance)}</div>
                <div class="bearing">${bearing}°</div>
            </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });

    return L.marker(midPoint, {
        icon: labelIcon,
        pane: paneName,
        interactive: false,
    }).addTo(map);
}

/* -----------------------------
 * Range Ring Creation
 * ----------------------------- */
export function createRangeRings(centerPoint, maxKm, map, paneName) {
    const rings = L.layerGroup();
    const labels = L.layerGroup();

    for (let km = RULER_CONFIG.ringInterval; km <= maxKm; km += RULER_CONFIG.ringInterval) {
        // Create range ring
        L.circle(centerPoint, {
            radius: km * 1000,
            color: RULER_COLORS.ringStroke,
            weight: 1,
            dashArray: "4,4",
            fill: false,
            pane: paneName,
            interactive: false,
        }).addTo(rings);

        // Create ring labels (two markers anchored to ring)
        if (km + RULER_CONFIG.ringInterval > maxKm) {
            const lngOffset =
                (km * 1000) /
                (111320 * Math.cos(centerPoint.lat * Math.PI / 180));

            const icon = L.divIcon({
                className: "range-ring-label",
                html: `${km} km`,
                iconSize: [30, 15],
                iconAnchor: [15, 8], // center the label nicely
            });

            // EAST label
            L.marker(
                [centerPoint.lat, centerPoint.lng + lngOffset],
                {
                    pane: paneName,
                    interactive: false,
                    icon,
                }
            ).addTo(labels);

            // WEST label
            L.marker(
                [centerPoint.lat, centerPoint.lng - lngOffset],
                {
                    pane: paneName,
                    interactive: false,
                    icon,
                }
            ).addTo(labels);
        }


    }

    rings.addTo(map);
    labels.addTo(map);

    return { rings, labels };
}

export function createFillCircle(centerPoint, radiusKm, map, paneName) {
    return L.circle(centerPoint, {
        radius: radiusKm * 1000,
        color: RULER_COLORS.circleBorder,
        weight: 0,
        fillColor: RULER_COLORS.ringFill,
        fillOpacity: 0.15,
        pane: paneName,
        interactive: false,
    }).addTo(map);
}

/* -----------------------------
 * Cleanup Functions
 * ----------------------------- */
export function clearCircleElements(fillCircle, rings, ringLabels, map) {
    if (fillCircle) {
        map.removeLayer(fillCircle);
    }
    if (rings) {
        map.removeLayer(rings);
    }
    if (ringLabels) {
        map.removeLayer(ringLabels);
    }
}

export function clearTempElements(tempLine, tempLabel, map) {
    if (tempLine) {
        map.removeLayer(tempLine);
    }
    if (tempLabel) {
        map.removeLayer(tempLabel);
    }
}

// Clear only review/drawing state
export function clearReviewState(refs, map) {
    if (!refs || !map) return;

    // Clear drawing markers, lines and labels
    if (refs.points?.current) {
        refs.points.current.forEach(point => {
            if (point.marker) map.removeLayer(point.marker);
        });
        refs.points.current = [];
    }

    if (refs.lines?.current) {
        refs.lines.current.forEach(line => map.removeLayer(line));
        refs.lines.current = [];
    }

    if (refs.labels?.current) {
        refs.labels.current.forEach(label => map.removeLayer(label));
        refs.labels.current = [];
    }

    // Clear preview elements
    clearCircleElements(
        refs.fillCircle?.current,
        refs.ringLayer?.current,
        refs.ringLabels?.current,
        map
    );
    clearTempElements(
        refs.tempLine?.current,
        refs.tempLabel?.current,
        map
    );

    // Reset refs
    if (refs.fillCircle) refs.fillCircle.current = null;
    if (refs.ringLayer) refs.ringLayer.current = null;
    if (refs.ringLabels) refs.ringLabels.current = null;
    if (refs.tempLine) refs.tempLine.current = null;
    if (refs.tempLabel) refs.tempLabel.current = null;

    // Reset state
    if (refs.hasAnchor) refs.hasAnchor.current = false;
    if (refs.chainStartIndex) refs.chainStartIndex.current = null;
}