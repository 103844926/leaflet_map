import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export function LayerController({ ships }) {
    const map = useMap();

    useEffect(() => {
        const handleOverlayAdd = (e) => {
            const layerName = e.name;
            const shipUid = layerName.replace('Ship ', '');
            const ship = ships.find(s => s.ship_uid === shipUid);

            if (ship && ship.locations.length > 0) {
                const lats = ship.locations.map(l => l.lat);
                const longs = ship.locations.map(l => l.long);

                const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
                const centerLong = longs.reduce((a, b) => a + b, 0) / longs.length;

                map.flyTo([centerLat, centerLong], 10, { duration: 1.5 });
            }
        };

        map.on('overlayadd', handleOverlayAdd);
        return () => map.off('overlayadd', handleOverlayAdd);
    }, [map, ships]);

    return null;
}
