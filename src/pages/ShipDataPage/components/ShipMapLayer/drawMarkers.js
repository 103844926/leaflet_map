// drawMarkers.js
import { getShipColor, createShipTexture, getSprite, resetPool, isInViewport } from "@/utils";

export function drawMarkers({
    container, project, scale, bounds, renderer,
    shipsToRender, timeFilteredShips, visibleShips, shipPositions,
    onMarkerClick, recordingShipIndex, isRecording, resources,
    movementStartMap, currentTime, selectedShipId
}) {
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

        resources.visibleMarkers[i] = true;

        const pt = project([lat, long]);
        if (!pt) return;

        const color = getShipColor(i);
        const isRecordingShip = isRecording && recordingShipIndex === i;
        const shipId = ship.ship_uid ?? ship.mmsi ?? ship.id;
        const isSelected = selectedShipId === shipId;

        const movementStart = movementStartMap?.get(ship.ship_uid);
        const hasStartedMoving = movementStart && currentTime >= movementStart.time;

        const texture = hasStartedMoving ? triangleTexture : circleTexture;

        // Draw main sprite
        const sprite = getSprite(pool, texture);
        if (!sprite) return;

        sprite.x = pt.x;
        sprite.y = pt.y;
        sprite.rotation = hasStartedMoving ? (course * Math.PI) / 180 : 0;
        sprite.tint = color;
        sprite.alpha = isRecordingShip || isSelected ? 1 : 0.85;

        const baseScale = 0.625;
        // Existing boost (recording)
        const recordingBoost = isRecordingShip ? 1.2 : 1.0;

        // New boost (selection)
        const selectedBoost = isSelected ? 1.35 : 1.0;

        // Final scale (zoom-safe)
        const finalScale =
            (baseScale * recordingBoost * selectedBoost) / scale;

        sprite.scale.set(finalScale);

        sprite.eventMode = "static";
        sprite.cursor = "pointer";
        sprite.removeAllListeners();
        sprite.on("pointertap", (event) => onMarkerClick?.(i, event)); // ✅ Pass the PIXI event

        container.addChild(sprite);
    });
}