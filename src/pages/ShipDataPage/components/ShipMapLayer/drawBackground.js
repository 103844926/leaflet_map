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
 * Cheap forward projection
 * ---------------------------------- */
const R = 6378137;
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
export function drawBackground({
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

    const showProjection = scale >= PROJECTION_MIN_SCALE;
    const useSimple = scale < 0.3;

    for (const ship of backgroundShips) {
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
        sprite.on("pointertap", (event) => onBackgroundShipClick?.(ship, event)); // ✅ Pass the PIXI event

        container.addChild(sprite);

        /* ---------- Forward projection ---------- */
        if (
            (showProjection || isSelected) &&
            ship.speed > 0
        ) {
            const speedMps = ship.speed * 0.514444;
            if (speedMps < 0.5) continue;

            const seconds =
                isSelected
                    ? MAX_SECONDS_AHEAD
                    : Math.min(
                        MAX_SECONDS_AHEAD,
                        BASE_SECONDS_AHEAD + scale * 80
                    );

            const meters = Math.min(
                MAX_PROJECTION_METERS,
                speedMps * seconds
            );

            if (meters < 8) continue;

            const [fLat, fLng] = projectForward(
                latlng[0],
                latlng[1],
                course,
                meters
            );

            const p2 = project([fLat, fLng]);
            if (!p2) continue;

            const g = new PIXI.Graphics();
            g.lineStyle(
                1 / scale,
                backgroundShipColor,
                isSelected ? 0.6 : 0.25
            );
            g.moveTo(pt.x, pt.y);
            g.lineTo(p2.x, p2.y);

            container.addChild(g);
        }
    }
}