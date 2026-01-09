import L from "leaflet";

/* -----------------------------
 * Constants
 * ----------------------------- */
export const COLORS = {
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
    ringLabelText: '#1fe9ff'
};

export const CONFIG = {
    ringInterval: 5, // km
    minRingDistance: 5, // km
    markerSize: 12,
    tolerance: 12 // pixels
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
export function createMarker(latlng, isFirst, map) {
    const markerIcon = L.divIcon({
        className: "ruler-marker",
        html: `<div style="
            width: ${CONFIG.markerSize}px;
            height: ${CONFIG.markerSize}px;
            background: ${isFirst ? COLORS.firstMarker : COLORS.marker};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 4px rgba(0,0,0,0.5);
            cursor: pointer;
        "></div>`,
        iconSize: [CONFIG.markerSize, CONFIG.markerSize],
        iconAnchor: [CONFIG.markerSize / 2, CONFIG.markerSize / 2]
    });

    const marker = L.marker(latlng, {
        icon: markerIcon,
        interactive: true // ✅ important
    }).addTo(map);

    marker._isFirst = isFirst; // ✅ tag it
    return marker;
}

export function createMeasurementLabel(latlng1, latlng2, isTemp, map) {
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
        interactive: false,
    }).addTo(map);
}

/* -----------------------------
 * Range Ring Creation
 * ----------------------------- */
export function createRangeRings(centerPoint, maxKm, map) {
    const rings = L.layerGroup();
    const labels = L.layerGroup();

    for (let km = CONFIG.ringInterval; km <= maxKm; km += CONFIG.ringInterval) {
        // Create ring
        L.circle(centerPoint, {
            radius: km * 1000,
            color: COLORS.ringStroke,
            weight: 1,
            dashArray: "4,4",
            fill: false,
            interactive: false,
        }).addTo(rings);

        // Calculate label position (to the right of center)
        const lngOffset =
            (km * 1000) /
            (111320 * Math.cos(centerPoint.lat * Math.PI / 180));

        // Create label
        L.marker(
            [centerPoint.lat, centerPoint.lng + lngOffset],
            {
                interactive: false,
                icon: L.divIcon({
                    className: "range-ring-label",
                    html: `${km} km`,
                    iconSize: [30, 15],
                    iconAnchor: [0, 10],
                }),
            }
        ).addTo(labels);
    }

    rings.addTo(map);
    labels.addTo(map);

    return { rings, labels };
}

export function createFillCircle(centerPoint, radiusKm, map) {
    return L.circle(centerPoint, {
        radius: radiusKm * 1000,
        color: COLORS.circleBorder,
        weight: 0,
        fillColor: COLORS.ringFill,
        fillOpacity: 0.15,
        interactive: false,
    }).addTo(map);
}

/* -----------------------------
 * Cleanup Functions
 * ----------------------------- */
export function clearLineElements(points, lines, labels, map) {
    points.forEach(point => {
        if (point.marker) map.removeLayer(point.marker);
    });
    points.length = 0;

    lines.forEach(line => map.removeLayer(line));
    lines.length = 0;

    labels.forEach(label => map.removeLayer(label));
    labels.length = 0;
}

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

export function clearAllElements(refs, map) {
    clearLineElements(refs.points.current, refs.lines.current, refs.labels.current, map);
    clearCircleElements(refs.fillCircle.current, refs.ringLayer.current, refs.ringLabels.current, map);
    clearTempElements(refs.tempLine.current, refs.tempLabel.current, map);

    // Reset refs
    refs.fillCircle.current = null;
    refs.ringLayer.current = null;
    refs.ringLabels.current = null;
    refs.tempLine.current = null;
    refs.tempLabel.current = null;

    map.getContainer().style.cursor = "";
}