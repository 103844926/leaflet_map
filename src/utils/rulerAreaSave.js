import L from "leaflet";

/* -----------------------------
 * Save/Load Functions
 * ----------------------------- */

/**
 * Converts area data to JSON format
 * @param {Array} points - Array of point objects with latlng
 * @param {number} chainStartIndex - Starting index of the chain
 * @returns {Object} Serializable area data
 */
export function serializeArea(points, chainStartIndex) {
    const chainPoints = points.slice(chainStartIndex);

    return {
        type: "area",
        timestamp: new Date().toISOString(),
        points: chainPoints.map(p => ({
            lat: p.latlng.lat,
            lng: p.latlng.lng
        })),
        metadata: {
            pointCount: chainPoints.length,
            created: new Date().toISOString()
        }
    };
}

/**
 * Save area data as JSON file
 * @param {Object} areaData - The serialized area data
 * @param {string} filename - Optional filename (default: area_TIMESTAMP.json)
 */
export function saveAreaAsJSON(areaData, filename = null) {
    const name = filename || `area_${Date.now()}.json`;
    const jsonStr = JSON.stringify(areaData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * Load area from JSON file
 * @param {File} file - The file to load
 * @returns {Promise<Object>} The parsed area data
 */
export function loadAreaFromJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.type === 'area' && data.points) {
                    resolve(data);
                } else {
                    reject(new Error('Invalid area file format'));
                }
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Restore area on map from loaded data
 * @param {Object} areaData - The loaded area data
 * @param {Object} map - Leaflet map instance
 * @param {Object} refs - References object
 * @param {Function} createMarker - Marker creation function
 * @param {Function} createPolygon - Polygon creation function
 */
export function restoreAreaOnMap(areaData, map, refs, createMarker, createPolygon) {
    if (!areaData || !areaData.points || areaData.points.length < 3) {
        throw new Error('Invalid area data or insufficient points');
    }

    const startIndex = refs.points.current.length;
    const latlngs = [];

    // Create markers for each point
    areaData.points.forEach((point, index) => {
        const latlng = L.latLng(point.lat, point.lng);
        const isFirst = index === 0;
        const marker = createMarker(latlng, isFirst, map);

        refs.points.current.push({ latlng, marker });
        latlngs.push(latlng);
    });

    // Create polygon
    const polygon = createPolygon(latlngs, map);
    refs.lines.current.push(polygon);

    // Fit map to show the loaded area
    map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });

    return {
        pointCount: areaData.points.length,
        bounds: L.latLngBounds(latlngs)
    };
}

/**
 * Save all areas in the current session
 * @param {Object} refs - References object
 * @returns {Object} All areas data
 */
export function serializeAllAreas(refs) {
    const areas = [];
    let currentChainStart = 0;

    refs.points.current.forEach((point, index) => {
        if (point.marker._isFirst && index > 0) {
            // New chain detected, save previous chain
            const chainPoints = refs.points.current.slice(currentChainStart, index);
            if (chainPoints.length >= 3) {
                areas.push({
                    points: chainPoints.map(p => ({
                        lat: p.latlng.lat,
                        lng: p.latlng.lng
                    }))
                });
            }
            currentChainStart = index;
        }
    });

    // Save last chain
    if (currentChainStart < refs.points.current.length) {
        const chainPoints = refs.points.current.slice(currentChainStart);
        if (chainPoints.length >= 3) {
            areas.push({
                points: chainPoints.map(p => ({
                    lat: p.latlng.lat,
                    lng: p.latlng.lng
                }))
            });
        }
    }

    return {
        type: "areas_collection",
        timestamp: new Date().toISOString(),
        areas: areas,
        metadata: {
            totalAreas: areas.length,
            created: new Date().toISOString()
        }
    };
}

/**
 * Calculate area statistics
 * @param {Array} points - Array of lat/lng points
 * @returns {Object} Area statistics
 */
export function calculateAreaStats(points) {
    if (points.length < 3) return null;

    // Convert to Leaflet polygon to use built-in area calculation
    const latlngs = points.map(p => L.latLng(p.lat, p.lng));
    const tempPolygon = L.polygon(latlngs);

    // Calculate area in square meters using spherical excess
    const area = L.GeometryUtil.geodesicArea(latlngs);

    return {
        areaM2: area,
        areaKm2: area / 1000000,
        perimeter: calculatePerimeter(latlngs)
    };
}

function calculatePerimeter(latlngs) {
    let total = 0;
    for (let i = 0; i < latlngs.length; i++) {
        const next = (i + 1) % latlngs.length;
        total += latlngs[i].distanceTo(latlngs[next]);
    }
    return total;
}