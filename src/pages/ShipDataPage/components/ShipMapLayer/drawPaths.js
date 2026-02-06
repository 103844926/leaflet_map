// drawPaths.js
import * as PIXI from "pixi.js";
import { getShipColor, isInViewport } from "@/utils";

export function drawPaths({
  container, project, scale, bounds, shipsToRender, visibleShips, shipPositions, resources
}) {
  if (!resources.pathGraphics) {
    resources.pathGraphics = new PIXI.Graphics();
  }

  const graphics = resources.pathGraphics;
  graphics.clear();

  shipsToRender.forEach(ship => {
    const i = ship.index;
    if (!visibleShips[i]) return;

    const color = getShipColor(i);

    const pos = shipPositions[i];
    if (!pos?.position) return;

    //  Safety mearsure, return warning only, will not block rendering
    //  Same with drawMarkers, IF the problem DOES appear, will debug later
    if (pos.ship_uid && pos.ship_uid !== ship.ship_uid) {
      console.warn("ShipPosition mismatch", ship.ship_uid, pos.ship_uid);
    }

    const { lat, long } = pos.position;
    if (lat == null || long == null) return;
    if (!isInViewport(lat, long, bounds)) return;

    // Full route (faded)
    graphics.lineStyle(2 / scale, color, 0.3);
    ship.locations.forEach((loc, idx) => {
      const pt = project([loc.lat, loc.long]);
      idx === 0 ? graphics.moveTo(pt.x, pt.y) : graphics.lineTo(pt.x, pt.y);
    });

    // Draw completed path fully passed waypoints
    const points = ship.locations.slice(0, pos.index + 1);
    graphics.lineStyle(3 / scale, color, 0.8);

    points.forEach((loc, idx) => {
      const pt = project([loc.lat, loc.long]);
      idx === 0 ? graphics.moveTo(pt.x, pt.y) : graphics.lineTo(pt.x, pt.y);
    });

    // Draw partial segment to current position
    const currPt = project([lat, long]);
    graphics.lineTo(currPt.x, currPt.y);

  });

  container.addChild(graphics);
}