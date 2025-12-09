// drawBackground.js
import { createShipTexture, getSprite, resetPool, isInViewport, resolveLatLng } from "@/utils";

export function drawBackground({
    container, project, scale, bounds, renderer,
    backgroundShips, showBackgroundShips, backgroundShipColor, resources
}) {
    if (!showBackgroundShips || !backgroundShips?.length) return;

    const texture = createShipTexture(renderer, resources, 'triangle', false);
    if (!texture) return;

    const pool = resources.bgSpritePool;
    resetPool(pool);

    const useSimpleRendering = scale < 0.3;

    for (const ship of backgroundShips) {
        const latlng = resolveLatLng(ship);
        if (!latlng || !isInViewport(latlng[0], latlng[1], bounds)) continue;

        const pt = project(latlng);
        if (!pt) continue;

        const sprite = getSprite(pool, texture);
        if (!sprite) continue;

        const course = ship.course ?? ship.position?.course ?? 0;

        sprite.x = pt.x;
        sprite.y = pt.y;
        sprite.rotation = (course * Math.PI) / 180;
        sprite.tint = backgroundShipColor;
        sprite.alpha = 0.6;
        sprite.scale.set((useSimpleRendering ? 0.4 : 0.6) / scale);

        container.addChild(sprite);
    }
}