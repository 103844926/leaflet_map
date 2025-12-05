// drawMarkers.js
import { getShipColor, createShipTexture, getSprite, getLabel, resetPool, isInViewport } from "@/utils";

export function drawMarkers({
    container, project, scale, bounds, renderer,
    shipsToRender, filteredShips, visibleShips, shipPositions,
    onMarkerClick, recordingShipIndex, isRecording, resources
}) {
    const texture = createShipTexture(renderer, resources, true);
    if (!texture) return;

    const pool = resources.spritePool;
    resetPool(pool);

    const showLabels = scale > 1;

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

        const pt = project([lat, long]);
        if (!pt) return;

        const color = getShipColor(i);
        const isRecordingShip = isRecording && recordingShipIndex === i;

        // Create sprite
        const sprite = getSprite(pool, texture);
        if (!sprite) return;

        sprite.x = pt.x;
        sprite.y = pt.y;
        sprite.rotation = (course * Math.PI) / 180;
        sprite.tint = color;
        sprite.alpha = isRecordingShip ? 1 : 0.9;
        sprite.scale.set((isRecordingShip ? 0.75 : 0.625) / scale);
        sprite.eventMode = "static";
        sprite.cursor = "pointer";
        sprite.removeAllListeners();
        sprite.on("pointertap", () => onMarkerClick?.(i));

        container.addChild(sprite);

        // Labels (LOD)
        if (showLabels) {
            const name = filteredShips[i]?.shipName || filteredShips[i]?.mmsi;
            if (name) {
                const label = getLabel(pool);
                if (label) {
                    label.text = name;
                    label.x = pt.x;
                    label.y = pt.y + (10 / scale);
                    label.scale.set(1 / scale);
                    container.addChild(label);
                }
            }
        }
    });
}