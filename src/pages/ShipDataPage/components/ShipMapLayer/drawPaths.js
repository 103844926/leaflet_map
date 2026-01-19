// drawPaths.js
import * as PIXI from "pixi.js";
import { getShipColor } from "@/utils";

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
    if (!visibleShips[i]) return;

    const color = getShipColor(i);

    // Full route (faded)
    graphics.lineStyle(2 / scale, color, 0.3);
    ships[i].locations.forEach((loc, idx) => {
      const pt = project([loc.lat, loc.long]);
      idx === 0 ? graphics.moveTo(pt.x, pt.y) : graphics.lineTo(pt.x, pt.y);
    });

    // Animated path
    const pos = shipPositions[i];
    if (!pos?.position) return;

    if (pos.ship_uid && pos.ship_uid !== ship.ship_uid) {
      console.warn("ShipPosition mismatch", ship.ship_uid, pos.ship_uid);
    }

    const { lat, long } = pos.position;
    if (lat == null || long == null) return;

    const points = ship.locations.slice(0, pos.index + 1);
    graphics.lineStyle(3 / scale, color, 0.8);

    points.forEach((loc, idx) => {
      const pt = project([loc.lat, loc.long]);
      idx === 0 ? graphics.moveTo(pt.x, pt.y) : graphics.lineTo(pt.x, pt.y);
    });

    const currPt = project([lat, long]);
    graphics.lineTo(currPt.x, currPt.y);

  });

  container.addChild(graphics);
}