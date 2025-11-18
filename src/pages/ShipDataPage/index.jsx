import React from 'react';
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer } from 'react-leaflet';
import { useState, useEffect } from 'react';
import * as Landing from './components';
import { getShipData } from '@/datas';
import { Box } from '@mui/material';
import L from "leaflet";

const customDivIcon = L.divIcon({
    html: `<div style="
    width: 10px;
    height: 10px;
    background: #1976d2;
    border-radius: 50%;
    border: 2px solid white;
  "></div>`,
});

L.Marker.prototype.options.icon = customDivIcon;

export default function ShipDataPage() {
    const [ships, setShips] = useState([]);
    const [initialCenter, setInitialCenter] = useState(null);

    useEffect(() => {
        const load = async () => {
            const data = await getShipData();
            setShips(data);

            // Compute global center from ALL ships
            const allLats = data.flatMap(s => s.locations.map(l => l.lat));
            const allLongs = data.flatMap(s => s.locations.map(l => l.long));

            const centerLat = allLats.reduce((a, b) => a + b, 0) / allLats.length;
            const centerLong = allLongs.reduce((a, b) => a + b, 0) / allLongs.length;

            setInitialCenter([centerLat, centerLong]);
        };
        load();
    }, []);

    // Wait until ship data is loaded
    if (!initialCenter) {
        return <div>Loading map...</div>;
    }

    return (
        <Box sx={{ position: "relative", height: "100vh", width: "100%", backgroundColor: "#999", padding: "50px", boxSizing: "border-box" }}>
            {/* Main Map */}

            <MapContainer
                center={initialCenter}
                zoom={9}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    maxZoom={19}
                    tileSize={512}
                    zoomOffset={-1}
                />

                <Landing.LayerController ships={ships} />

                <Landing.ShipMap ships={ships} />

                {/* MiniMap */}
                <Landing.MiniMapControl position={initialCenter} zoom={5} />
            </MapContainer>
        </Box>

    )
}