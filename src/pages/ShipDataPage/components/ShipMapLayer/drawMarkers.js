// drawMarkers.js
import { getShipColor, createShipTexture, getSprite, resetPool, isInViewport } from "@/utils";

export function drawMarkers({
    container, project, scale, bounds, renderer,
    shipsToRender, visibleShips, shipPositions,
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
        if (!pos) return;
        // Warning only
        if (pos.ship_uid && pos.ship_uid !== ship.ship_uid) {
            console.warn("ShipPosition mismatch", ship.ship_uid, pos.ship_uid);
        }

        const p = pos?.position;
        if (!p) return;

        const lat = p.lat;
        const long = p.long;
        const course = p.course ?? 0;

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