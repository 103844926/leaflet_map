const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load mock data once when server starts
let shipData = null;

const loadShipData = () => {
    if (!shipData) {
        const filePath = path.join(__dirname, '../../public/ship_on_map.txt');

        console.log('🔍 Looking for file at:', filePath);
        console.log('📂 File exists?', fs.existsSync(filePath));

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found at: ${filePath}`);
        }

        shipData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`✅ Successfully loaded ${shipData.length} ships`);
    }
    return shipData;
};

// GET /ships?country_code=&ship_type=&filter=&page=1&size=20
router.get('/ships', (req, res) => {
    try {
        const {
            country_code = '',
            ship_type = '',
            filter = '',
            page = 1,
            size = 20,
        } = req.query;

        const shipTypeNum = ship_type !== '' ? Number(ship_type) : null;
        const pageNum = Number(page);
        const sizeNum = Number(size);

        console.log('📊 Filters received:', {
            country_code,
            ship_type,
            filter,
            page,
            size
        });

        const ships = loadShipData();
        const totalCount = ships.length;

        // Filter ships
        let filtered = ships.filter(ship => {
            if (country_code && ship.country_code !== country_code) return false;       // Country code filter
            if (shipTypeNum !== null && ship.ship_type !== shipTypeNum) return false;   // Ship type filter

            // Text search filter
            if (filter) {
                const q = filter.toLowerCase();

                return (
                    ship.name?.toLowerCase().includes(q) ||
                    ship.ship_uid?.toLowerCase().includes(q) ||
                    String(ship.ship_type).includes(q) ||
                    String(ship.status).includes(q) ||
                    ship.country_code?.toLowerCase().includes(q)
                );
            }

            return true;
        });

        // Calculate pagination
        const filteredTotal = filtered.length;
        const total_page = Math.ceil(filteredTotal / sizeNum);
        const start = (pageNum - 1) * sizeNum;

        // Get paginated data
        const paginatedData = filtered.slice(start, start + sizeNum);

        res.json({
            data: paginatedData,
            page: pageNum,
            size: sizeNum,
            total: filteredTotal,         // Filtered count
            total_unfiltered: totalCount, // Total unfiltered count
            total_page
        });

    } catch (error) {
        console.error('❌ Error in /ships route:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to fetch ship data',
            message: error.message
        });
    }
});

// GET /api/ships/filters
router.get('/ships/filters', (req, res) => {
    try {
        const ships = loadShipData();

        const shipTypes = [
            ...new Set(
                ships
                    .map(s => s.ship_type)
                    .filter(v => v !== null && v !== undefined)
            )
        ].sort((a, b) => a - b);

        const countryCodes = [
            ...new Set(
                ships
                    .map(s => s.country_code)
                    .filter(Boolean)
            )
        ].sort();

        res.json({
            ship_types: shipTypes,
            country_codes: countryCodes,
        });
    } catch (err) {
        console.error('❌ Failed to load ship filters:', err);
        res.status(500).json({ error: 'Failed to load ship filters' });
    }
});

module.exports = router;