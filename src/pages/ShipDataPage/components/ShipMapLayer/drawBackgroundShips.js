import { createShipTexture, getSprite, resetPool, isInViewport, resolveLatLng } from "@/utils";
import * as PIXI from "pixi.js";

/* ----------------------------------
 * Tunables (LOD policy)
 * ---------------------------------- */
const PROJECTION_MIN_SCALE = 0.7;
const MAX_PROJECTION_METERS = 3000;
const BASE_SECONDS_AHEAD = 25;
const MAX_SECONDS_AHEAD = 180;

/* ----------------------------------
 * Forward projection
 * ---------------------------------- */
const R = 6378137;          // Earth radius in meters
function projectForward(lat, lng, bearingDeg, meters) {
    const b = bearingDeg * Math.PI / 180;
    const lat1 = lat * Math.PI / 180;
    const lng1 = lng * Math.PI / 180;

    const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(meters / R) +
        Math.cos(lat1) * Math.sin(meters / R) * Math.cos(b)
    );

    const lng2 = lng1 + Math.atan2(
        Math.sin(b) * Math.sin(meters / R) * Math.cos(lat1),
        Math.cos(meters / R) - Math.sin(lat1) * Math.sin(lat2)
    );

    return [lat2 * 180 / Math.PI, lng2 * 180 / Math.PI];
}

/* ----------------------------------
 * Main draw
 * ---------------------------------- */
export function drawBackgroundShips({
    container,
    project,
    scale,
    bounds,
    renderer,
    backgroundShips,
    backgroundShipColor,
    resources,
    onBackgroundShipClick,
    selectedShipId
}) {
    const texture = createShipTexture(renderer, resources, "triangle", false);
    if (!texture) return;

    const pool = resources.bgSpritePool;
    resetPool(pool);

    if (!resources.bgProjectionGraphics) {
        resources.bgProjectionGraphics = new PIXI.Graphics();
    }
    const projectionGraphics = resources.bgProjectionGraphics;
    projectionGraphics.clear();

    const showProjection = scale >= PROJECTION_MIN_SCALE;
    const useSimple = scale < 0.3;

    for (const ship of backgroundShips) {       // Extract objects from array
        const latlng = resolveLatLng(ship);
        if (!latlng || !isInViewport(latlng[0], latlng[1], bounds)) continue;

        const pt = project(latlng);
        if (!pt) continue;

        /* ---------- Sprite ---------- */
        const sprite = getSprite(pool, texture);
        if (!sprite) continue;

        const shipId = ship.ship_uid ?? ship.mmsi ?? ship.id;
        const isSelected = shipId === selectedShipId;
        const course = ship.course ?? ship.position?.course ?? 0;

        const baseSize = (useSimple ? 0.4 : 0.6) / scale;

        // Selected boost
        const selectedBoost = isSelected ? 1.35 : 1.0;

        sprite.x = pt.x;
        sprite.y = pt.y;
        sprite.rotation = course * Math.PI / 180;
        sprite.tint = backgroundShipColor;
        sprite.alpha = isSelected ? 1.0 : 0.5;
        sprite.scale.set(baseSize * selectedBoost);

        sprite.eventMode = "static";
        sprite.cursor = "pointer";
        sprite.removeAllListeners();
        sprite.on("pointertap", (event) => onBackgroundShipClick?.(ship, event));

        // Selected border
        if (isSelected) {
            const border = getSprite(pool, texture);
            if (border) {
                border.x = pt.x;
                border.y = pt.y;
                border.rotation = sprite.rotation;
                border.tint = 0xFFFFFF;
                border.alpha = 0.9;
                border.scale.set(baseSize * selectedBoost * 1.25);
                container.addChild(border);
            }
        }

        container.addChild(sprite);

        /* ---------- Forward projection ---------- */
        if (showProjection || isSelected) {
            const speedMps = ship.speed * 0.514444;

            // Early exit with BASE_SECONDS_AHEAD check
            const minMeters = speedMps * BASE_SECONDS_AHEAD;
            if (minMeters < 8) continue;

            const seconds = isSelected
                ? MAX_SECONDS_AHEAD
                : Math.min(MAX_SECONDS_AHEAD, BASE_SECONDS_AHEAD + scale * 80);

            const meters = Math.min(MAX_PROJECTION_METERS, speedMps * seconds);

            const [fLat, fLng] = projectForward(
                latlng[0],
                latlng[1],
                course,
                meters
            );

            const p2 = project([fLat, fLng]);
            if (!p2) continue;

            projectionGraphics.lineStyle(
                1 / scale,
                backgroundShipColor,
                isSelected ? 0.6 : 0.25
            );
            projectionGraphics.moveTo(pt.x, pt.y);
            projectionGraphics.lineTo(p2.x, p2.y);
        }
    }

    if (projectionGraphics.geometry.graphicsData.length > 0) {
        container.addChild(projectionGraphics);
    }
}