import * as PIXI from "pixi.js";

/**
 * Deterministic, export-only wind particle system.
 * No RAF, no timers. Fully controlled by caller.
 */

/* -----------------------
 * Deterministic seeded RNG
 * ----------------------- */
function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

export class WindParticleExportSystem {
    constructor({
        map,
        windData,
        timeIndex,
        particleCount = 6000,
        speedScale = 25,
        lineAlpha = 0.35,
    }) {
        this.map = map;
        this.windData = windData;
        this.timeIndex = timeIndex;
        this.speedScale = speedScale;

        // Deterministic RNG
        this._rand = mulberry32(123456);

        this.particles = [];
        this.graphics = new PIXI.Graphics();
        this.graphics.alpha = lineAlpha;
        this.graphics.zIndex = 5;

        this._initParticles(particleCount);
    }

    /* -----------------------
     * Particle initialization
     * ----------------------- */

    _initParticles(count) {
        const size = this.map.getSize();
        this.particles.length = 0;

        for (let i = 0; i < count; i++) {
            this.particles.push(this._spawnParticle(size));
        }
    }

    _spawnParticle(size) {
        const x = this._rand() * size.x;
        const y = this._rand() * size.y;

        return {
            x, y,
            px: x,
            py: y,
            age: 0,
            life: 2,
        };
    }

    /* -----------------------
     * Wind sampling (bilinear)
     * ----------------------- */

    _sampleWind(x, y) {
        const { nx, ny, lo1, la1, lo2, la2, u, v } = this.windData;

        const latLng = this.map.containerPointToLatLng([x, y]);
        if (!latLng) return null;

        const fx = (latLng.lng - lo1) / (lo2 - lo1) * (nx - 1);
        const fy = (la1 - latLng.lat) / (la1 - la2) * (ny - 1);

        const ix = Math.floor(fx);
        const iy = Math.floor(fy);

        if (ix < 0 || iy < 0 || ix >= nx - 1 || iy >= ny - 1) {
            return null;
        }

        const tx = fx - ix;
        const ty = fy - iy;

        const base = iy * nx + ix;

        const u00 = u[this.timeIndex][base];
        const v00 = v[this.timeIndex][base];
        const u10 = u[this.timeIndex][base + 1];
        const v10 = v[this.timeIndex][base + 1];
        const u01 = u[this.timeIndex][base + nx];
        const v01 = v[this.timeIndex][base + nx];
        const u11 = u[this.timeIndex][base + nx + 1];
        const v11 = v[this.timeIndex][base + nx + 1];

        return {
            u:
                u00 * (1 - tx) * (1 - ty) +
                u10 * tx * (1 - ty) +
                u01 * (1 - tx) * ty +
                u11 * tx * ty,

            v:
                v00 * (1 - tx) * (1 - ty) +
                v10 * tx * (1 - ty) +
                v01 * (1 - tx) * ty +
                v11 * tx * ty,
        };
    }

    /* -----------------------
     * Simulation step
     * ----------------------- */

    step(dt) {
        const size = this.map.getSize();

        for (const p of this.particles) {
            const wind = this._sampleWind(p.x, p.y);

            if (!wind) {
                Object.assign(p, this._spawnParticle(size));
                continue;
            }

            const speed = Math.hypot(wind.u, wind.v);
            const deathChance = speed * dt * 0.15;

            if (this._rand() < deathChance) {
                Object.assign(p, this._spawnParticle(size));
                continue;
            }

            p.px = p.x;
            p.py = p.y;

            p.x += wind.u * dt * this.speedScale;
            p.y -= wind.v * dt * this.speedScale;
            p.age += dt;

            if (
                p.age > p.life ||
                p.x < 0 || p.y < 0 ||
                p.x > size.x || p.y > size.y
            ) {
                Object.assign(p, this._spawnParticle(size));
            }
        }
    }

    /* -----------------------
     * Render
     * ----------------------- */

    render() {
        const g = this.graphics;
        g.clear();

        g.lineStyle(1.6, 0xffffff, 1);

        for (const p of this.particles) {
            const dx = p.x - p.px;
            const dy = p.y - p.py;

            if (dx * dx + dy * dy < 0.05) continue;

            const stretch = 2.2;

            g.moveTo(p.px, p.py);
            g.lineTo(
                p.px + dx * stretch,
                p.py + dy * stretch
            );
        }
    }

    reset(timeIndex) {
        this.timeIndex = timeIndex;
        this._initParticles(this.particles.length);
    }

    destroy() {
        this.graphics.clear();
        this.graphics.destroy(true);
        this.particles.length = 0;
    }
}
