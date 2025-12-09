// drawMarkers.js
import { getShipColor, createShipTexture, getSprite, resetPool, isInViewport } from "@/utils";

export function drawMarkers({
    container, project, scale, bounds, renderer,
    shipsToRender, filteredShips, visibleShips, shipPositions,
    onMarkerClick, recordingShipIndex, isRecording, resources,
    movementStartMap, // Pass the movement start map from detectShipMovementStartsDetailed
    currentTime // Current timeline time
}) {
    // Create both textures using the integrated function
    const triangleTexture = createShipTexture(renderer, resources, 'triangle', true);
    const circleTexture = createShipTexture(renderer, resources, 'circle');

    if (!triangleTexture || !circleTexture) return;

    const pool = resources.spritePool;
    resetPool(pool);

    resources.visibleMarkers = {};

    shipsToRender.forEach(ship => {
        const i = ship.index;
        if (!visibleShips[i]) return;

        const pos = shipPositions[i];
        let lat, long, course = 0;

        // Resolve position
        if (pos?.position) {
            lat = pos.position.lat;
            long = pos.position.long;
            course = pos.position.course ?? 0;
        } else if (pos?.index >= 0 && ship.locations?.[pos.index]) {
            const loc = ship.locations[pos.index];
            lat = loc.lat;
            long = loc.long;
            course = loc.course ?? 0;
        } else if (ship.locations?.length) {
            const last = ship.locations[ship.locations.length - 1];
            lat = last.lat;
            long = last.long;
            course = last.course ?? 0;
        } else {
            return;
        }

        if (lat == null || long == null || !isInViewport(lat, long, bounds)) return;

        // Marker is in viewport --> remember it
        resources.visibleMarkers[i] = true;

        const pt = project([lat, long]);
        if (!pt) return;

        const color = getShipColor(i);
        const isRecordingShip = isRecording && recordingShipIndex === i;

        // Determine if ship has started moving
        const movementStart = movementStartMap?.get(ship.ship_uid);
        const hasStartedMoving = movementStart && currentTime >= movementStart.time;

        // Choose texture based on movement status
        const texture = hasStartedMoving ? triangleTexture : circleTexture;

        // Create sprite
        const sprite = getSprite(pool, texture);
        if (!sprite) return;

        sprite.x = pt.x;
        sprite.y = pt.y;

        // Only apply rotation to triangle
        sprite.rotation = hasStartedMoving ? (course * Math.PI) / 180 : 0;

        sprite.tint = color;
        sprite.alpha = isRecordingShip ? 1 : 0.9;

        const baseScale = 0.625;
        sprite.scale.set((isRecordingShip ? baseScale * 1.2 : baseScale) / scale);

        sprite.eventMode = "static";
        sprite.cursor = "pointer";
        sprite.removeAllListeners();
        sprite.on("pointertap", () => onMarkerClick?.(i));

        container.addChild(sprite);
    });
}