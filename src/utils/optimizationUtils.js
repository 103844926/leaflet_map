// optimizationUtils.js - Place this in your @/utils folder
import * as PIXI from "pixi.js";

export const getShipColor = (i) => {
    const colors = [0x00FF00, 0x0000FF, 0xFF0000, 0xFFA500, 0x800080, 0x00FFFF, 0xFF00FF, 0xFFFF00];
    return colors[i % colors.length];
};

export const createShipTexture = (renderer, resources, withBorder = true) => {
    // Use different cache keys for bordered vs non-bordered textures
    const cacheKey = withBorder ? 'shipTexture' : 'shipTextureNoBorder';

    // Check if existing texture is still valid
    if (resources[cacheKey] && resources[cacheKey].valid) {
        return resources[cacheKey];
    }

    // Destroy invalid texture
    if (resources[cacheKey]) {
        resources[cacheKey].destroy(true);
        resources[cacheKey] = null;
    }

    const g = new PIXI.Graphics();
    g.beginFill(0xFFFFFF);

    // Add white border only if withBorder is true
    if (withBorder) {
        g.lineStyle(2, 0x000000, 2);
    }

    const size = 16, half = size * 0.5, height = size * 1.3;
    g.moveTo(0, -height / 2);
    g.lineTo(-half, height / 2);
    g.lineTo(half, height / 2);
    g.lineTo(0, -height / 2);
    g.endFill();

    try {
        const texture = renderer.generateTexture(g, {
            resolution: 2,
            scaleMode: PIXI.SCALE_MODES.LINEAR
        });

        resources[cacheKey] = texture;
        return texture;
    } catch (error) {
        console.error("Failed to generate ship texture:", error);
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

export const getLabel = (pool) => {
    if (!pool.labels) {
        pool.labels = [];
        pool.labelInUse = 0;
    }

    if (pool.labelInUse < pool.labels.length) {
        const label = pool.labels[pool.labelInUse];
        label.visible = true;
        pool.labelInUse++;
        return label;
    }

    const label = new PIXI.Text("", {
        fontSize: 12,
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 3,
        fontWeight: "bold"
    });
    label.anchor.set(0.5, 0);
    pool.labels.push(label);
    pool.labelInUse++;
    return label;
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

export const isInViewport = (lat, lng, bounds) => {
    return lat >= bounds.getSouth() &&
        lat <= bounds.getNorth() &&
        lng >= bounds.getWest() &&
        lng <= bounds.getEast();
};

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