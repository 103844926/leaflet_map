// drawPaths.js
import * as PIXI from "pixi.js";
import { getShipColor, isInViewport } from "@/utils";

export function drawPaths({
  container, project, scale, bounds,
  ships, shipsToRender, visibleShips, shipPositions, showPaths, resources
}) {
  if (!showPaths) return;

  if (!resources.pathGraphics) {
    resources.pathGraphics = new PIXI.Graphics();
  }

  const graphics = resources.pathGraphics;
  graphics.clear();

  shipsToRender.forEach(ship => {
    const i = ship.index;
    if (!visibleShips[i] || !ships[i]?.locations) return;

    // Simple viewport check on path endpoints
    const firstLoc = ships[i].locations[0];
    const lastLoc = ships[i].locations[ships[i].locations.length - 1];
    const inView = isInViewport(firstLoc.lat, firstLoc.long, bounds) ||
      isInViewport(lastLoc.lat, lastLoc.long, bounds);

    if (!inView) return;

    const color = getShipColor(i);

    // Full route (faded)
    graphics.lineStyle(2 / scale, color, 0.3);
    ships[i].locations.forEach((loc, idx) => {
      const pt = project([loc.lat, loc.long]);
      idx === 0 ? graphics.moveTo(pt.x, pt.y) : graphics.lineTo(pt.x, pt.y);
    });

    // Animated path
    const pos = shipPositions[i];
    graphics.lineStyle(3 / scale, color, 0.8);

    if (pos?.position?.lat && pos?.position?.long && pos.index >= 0) {
      const points = ship.locations.slice(0, pos.index + 1);
      points.forEach((loc, idx) => {
        const pt = project([loc.lat, loc.long]);
        idx === 0 ? graphics.moveTo(pt.x, pt.y) : graphics.lineTo(pt.x, pt.y);
      });
      const currPt = project([pos.position.lat, pos.position.long]);
      graphics.lineTo(currPt.x, currPt.y);
    } else if (ship.locations?.length > 0) {
      ship.locations.forEach((loc, idx) => {
        const pt = project([loc.lat, loc.long]);
        idx === 0 ? graphics.moveTo(pt.x, pt.y) : graphics.lineTo(pt.x, pt.y);
      });
    }
  });

  container.addChild(graphics);
}