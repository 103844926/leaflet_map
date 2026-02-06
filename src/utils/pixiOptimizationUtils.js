// pixiOptimizationUtils.js - Place this in your @/utils folder
import * as PIXI from "pixi.js";

// Ship color palette - cycles through array indexes
export const getShipColor = (i) => {
    const colors = [0x00FF00, 0x0000FF, 0xFF0000, 0xFFA500, 0x800080, 0x00FFFF, 0xFF00FF, 0xFFFF00];
    return colors[i % colors.length];
};

/**
 * Create ship or circle texture
 * @param {PIXI.Renderer} renderer 
 * @param {Object} resources - Resource cache object
 * @param {string} shape - 'triangle' or 'circle'
 * @param {boolean} withBorder - Add border (only applies to triangle)
 * @returns {PIXI.Texture}
 */

export const createShipTexture = (renderer, resources, shape = 'triangle', withBorder = true) => {
    // Generate cache key based on shape and border
    const cacheKey = shape === 'circle'
        ? 'circleTexture'
        : (withBorder ? 'shipTexture' : 'shipTextureNoBorder');

    // Reuse cache if it is exist and reusable
    if (resources[cacheKey] && resources[cacheKey].valid) {
        return resources[cacheKey];
    }

    // Destroy corrupted cached texture then recreate it
    if (resources[cacheKey]) {
        try { resources[cacheKey].destroy(true); } catch (e) { }
        resources[cacheKey] = null;
    }

    const g = new PIXI.Graphics();

    g.beginFill(0xFFFFFF);

    if (shape === 'circle') {
        g.drawCircle(0, 0, 8);
    } else {
        // Draw triangle (ship)
        if (withBorder) {
            // alpha must be 0..1
            g.lineStyle(2, 0x000000, 1);
        }
        const size = 16, half = size * 0.5, height = size * 1.4;
        g.moveTo(0, -height / 2);
        g.lineTo(-half, height / 2);
        g.lineTo(half, height / 2);
        g.lineTo(0, -height / 2);
    }

    g.endFill();

    try {
        // Convert Graphic to Texture
        const texture = renderer.generateTexture(g, {
            resolution: 2,
            scaleMode: PIXI.SCALE_MODES.LINEAR
        });

        // Cache it to reuse
        resources[cacheKey] = texture;
        return texture;
    } catch (error) {
        console.error(`Failed to generate ${shape} texture:`, error);
        return null;
    }
};

export const getSprite = (pool, texture) => {
    if (!texture || !texture.valid) {
        return null;
    }

    if (pool.inUse < pool.sprites.length) {
        const sprite = pool.sprites[pool.inUse];
        sprite.texture = texture;
        sprite.visible = true;
        pool.inUse++;
        return sprite;
    }

    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    pool.sprites.push(sprite);
    pool.inUse++;
    return sprite;
};

export const resetPool = (pool) => {
    for (let i = 0; i < pool.sprites.length; i++) {
        pool.sprites[i].visible = false;
    }
    pool.inUse = 0;

    if (pool.labels) {
        for (let i = 0; i < pool.labels.length; i++) {
            pool.labels[i].visible = false;
        }
        pool.labelInUse = 0;
    }
};

// Check whether ship is inside the window view
export const isInViewport = (lat, lng, bounds) => {
    return lat >= bounds.getSouth() &&
        lat <= bounds.getNorth() &&
        lng >= bounds.getWest() &&
        lng <= bounds.getEast();
};

// Normalize ship coordinates: extract [lat, lng] from various ship data formats
export const resolveLatLng = (ship) => {
    if (!ship) return null;

    if (ship.position?.lat != null && ship.position?.long != null) {
        return [ship.position.lat, ship.position.long];
    }

    const lat = ship.lat ?? ship.latitude ?? null;
    const lng = ship.long ?? ship.lng ?? ship.lon ?? ship.longitude ?? null;
    if (lat != null && lng != null) return [lat, lng];

    if (ship.index >= 0 && ship.locations?.[ship.index]) {
        const loc = ship.locations[ship.index];
        if (loc?.lat != null && loc?.long != null) {
            return [loc.lat, loc.long];
        }
    }

    if (ship.locations?.length) {
        const loc = ship.locations[ship.locations.length - 1];
        if (loc?.lat != null && loc?.long != null) {
            return [loc.lat, loc.long];
        }
    }

    return null;
};