import React, { useState, useRef } from 'react';
import "leaflet/dist/leaflet.css";
import { LayersControl, LayerGroup, Marker, Polyline } from 'react-leaflet';

export function ShipMap({ ships }) {
    const [shipPositions, setShipPositions] = useState(
        ships.map(() => 0)
    );
    const [selectedShipIndex, setSelectedShipIndex] = useState(null); // store clicked ship

    // Use refs to store interval IDs for each ship
    const intervals = useRef(Array(ships.length).fill(null));

    const animateShip = (index) => {
        if (intervals.current[index]) return;

        const ship = ships[index];
        intervals.current[index] = setInterval(() => {
            setShipPositions(prev => {
                const newPositions = [...prev];
                if (newPositions[index] < ship.locations.length - 1) {
                    newPositions[index] += 1;
                } else {
                    clearInterval(intervals.current[index]);
                    intervals.current[index] = null;
                }
                return newPositions;
            });
        }, 500);
    };

    const returnToStart = (index) => {
        if (intervals.current[index]) {
            clearInterval(intervals.current[index]);
            intervals.current[index] = null;
        }

        setShipPositions(prev => {
            const newPositions = [...prev];
            newPositions[index] = 0;
            return newPositions;
        });
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <LayersControl position="bottomright">
                {ships.map((ship, index) => {
                    const polyline = ship.locations.map(loc => [loc.lat, loc.long]);
                    const currentPos = polyline[shipPositions[index]];

                    return (
                        <LayersControl.Overlay
                            checked
                            key={ship.ship_uid}
                            name={`Ship ${ship.ship_uid}`}
                        >
                            <LayerGroup>
                                <Marker
                                    position={currentPos}
                                    eventHandlers={{
                                        click: () => setSelectedShipIndex(index)
                                    }}
                                />
                                <Polyline
                                    pathOptions={{
                                        color: getShipColor(index),
                                        weight: 3
                                    }}
                                    positions={polyline}
                                />
                            </LayerGroup>
                        </LayersControl.Overlay>
                    );
                })}
            </LayersControl>

            {/* Fixed Info Box */}
            {selectedShipIndex !== null && (
                <div style={{
                    position: 'absolute',
                    bottom: 20,
                    left: 20,
                    width: 250,
                    backgroundColor: 'white',
                    padding: '15px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    zIndex: 1000
                }}>
                    <h4>Ship {ships[selectedShipIndex].ship_uid}</h4>
                    <p>Coordinates: {
                        ships[selectedShipIndex].locations[shipPositions[selectedShipIndex]].lat
                    }, {
                            ships[selectedShipIndex].locations[shipPositions[selectedShipIndex]].long
                        }</p>
                    <button onClick={() => animateShip(selectedShipIndex)}>Animate</button>
                    <button onClick={() => returnToStart(selectedShipIndex)} style={{ marginLeft: 10 }}>Return to Start</button>
                    <button onClick={() => setSelectedShipIndex(null)} style={{ marginLeft: 10 }}>Close</button>
                </div>
            )}
        </div>
    );
}

function getShipColor(index) {
    const colors = ['lime', 'blue', 'red', 'orange', 'purple', 'cyan', 'magenta', 'yellow'];
    return colors[index % colors.length];
}
