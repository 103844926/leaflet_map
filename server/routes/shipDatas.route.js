const express = require('express');
const axios = require('axios');

const router = express.Router();

const REAL_API_BASE = process.env.REAL_API_BASE;

// --------------------
// GET /ships
// --------------------
router.get('/ships', async (req, res) => {
    try {
        const {
            country_code = '',
            ship_type = '',
            filter = '',
            page = 1,
            size = 20,
        } = req.query;

        const response = await axios.get(`${REAL_API_BASE}/ship`, {
            params: {
                country_code,
                ship_type,
                filter,
                page,
                size,
            },
            timeout: 10000,
        });

        res.json({
            data: response.data.data,
            page: response.data.page,
            size: response.data.size,
            total: response.data.total,
            total_page: response.data.total_page,
        });

    } catch (error) {
        console.error('❌ Real API error:', error.message);
        res.status(502).json({
            error: 'Upstream ship API failed',
            message: error.message,
        });
    }
});

// --------------------
// GET /ships/filters
// --------------------
let cachedFilters = null;
let cachedAt = 0;
const CACHE_TTL = 10 * 60 * 1000;

router.get('/ships/filters', async (req, res) => {
    try {
        if (cachedFilters && Date.now() - cachedAt < CACHE_TTL) {
            return res.json(cachedFilters);
        }

        const response = await axios.get(`${REAL_API_BASE}/ship`, {
            params: { page: 1, size: 5000 },
            timeout: 10000,
        });

        const ships = response.data.data || [];

        const result = {
            ship_types: [...new Set(ships.map(s => s.ship_type))].sort((a, b) => a - b),
            country_codes: [...new Set(ships.map(s => s.country_code).filter(Boolean))].sort(),
        };

        cachedFilters = result;
        cachedAt = Date.now();

        res.json(result);
    } catch (err) {
        console.error('❌ Failed to load ship filters:', err.message);
        res.status(500).json({ error: 'Failed to load ship filters' });
    }
});

module.exports = router;
