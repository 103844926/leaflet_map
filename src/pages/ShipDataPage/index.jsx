import {
  React,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import { Box } from "@mui/material";
import {
  ShipMapLayer,
  ShipInfoPanel,
  ShipLayerControl,
  ShipTimeControl,
} from "./components";
import { MiniMapControl } from "@/components";
import { getShipData } from "@/datas";
import { useShipVisible, useShipAnimation, useLeafletControl } from "@/hooks";
import getCurrentShipPosition from "./getCurrentShipPosition";

export default function ShipDataPage() {
  // --------------------
  // Basic state
  // --------------------
  const [ships, setShips] = useState([]);
  const [initialCenter, setInitialCenter] = useState(null);
  const [timeRange, setTimeRange] = useState(null);
  const animationIntervalRef = useRef(null);
  const mapRef = useRef(null);

  const paperControl = useLeafletControl();
  const boxControl = useLeafletControl();
  const timeControl = useLeafletControl();

  // --------------------
  // Ship visibility
  // --------------------
  const { visibleShips, handleShipToggle } = useShipVisible(ships);

  // --------------------
  // Animation + Selected Ship
  // --------------------
  const {
    shipPositions,
    selectedShipIndex,
    setSelectedShipIndex,
    animateAll,
    isAnimatingAll,
    currentSimulatedTime,
  } = useShipAnimation(ships);

  // --------------------
  // Available Times
  // --------------------
  const availableTimes = useMemo(() => {
    const timeSet = new Set();
    ships.forEach((ship) =>
      ship.locations.forEach((loc) => timeSet.add(loc.time)),
    );
    return Array.from(timeSet).sort((a, b) => a - b);
  }, [ships]);

  const handleTimeChange = useCallback((range) => setTimeRange(range), []);

  // --------------------
  // Animate All
  // --------------------

  const handleAnimateAll = () => {
    animateAll(availableTimes, handleTimeChange);
  };

  const handleAnimateAllFromTime = (startTime = null) => {
    animateAll(availableTimes, handleTimeChange, startTime);
  };

  // --------------------
  // Filtered Ships
  // --------------------
  const filteredShips = useMemo(() => {
    return ships.map((ship) => {
      if (!timeRange) return ship;

      const [startTime, currentTime] = timeRange;

      const filtered = ship.locations.filter(
        (loc) => loc.time <= currentTime, // show all points up to current simulated time
      );

      return {
        ...ship,
        locations: filtered.length ? filtered : [ship.locations[0]],
      };
    });
  }, [ships, timeRange]);

  // --------------------
  // Load Ship Data
  // --------------------
  useEffect(() => {
    const load = async () => {
      const data = await getShipData();
      setShips(data);

      const allLats = data.flatMap((s) => s.locations.map((l) => l.lat));
      const allLongs = data.flatMap((s) => s.locations.map((l) => l.long));
      const centerLat = allLats.reduce((a, b) => a + b, 0) / allLats.length;
      const centerLong = allLongs.reduce((a, b) => a + b, 0) / allLongs.length;

      setInitialCenter([centerLat, centerLong]);
    };
    load();
  }, []);

  useEffect(
    () => () => {
      if (animationIntervalRef.current)
        clearInterval(animationIntervalRef.current);
    },
    [],
  );

  if (!initialCenter) return <div>Loading map...</div>;

  // --------------------
  // Render
  // --------------------
  return (
    <Box
      sx={{
        position: "relative",
        height: "100vh",
        width: "100%",
        backgroundColor: "#999",
        padding: { xs: "10px", md: "20px" },
        boxSizing: "border-box",
      }}
    >
      <MapContainer
        ref={mapRef}
        center={initialCenter}
        zoom={10}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
          maxZoom={19}
          tileSize={512}
          zoomOffset={-1}
        />

        <ShipLayerControl
          ships={ships}
          visibleShips={visibleShips}
          onShipToggle={(index) => {
            const willBeVisible = !visibleShips[index];
            handleShipToggle(index);
            if (!willBeVisible || !mapRef.current) return;

            const ship = ships[index];
            const current = getCurrentShipPosition(ship, timeRange);
            if (!current) return;

            const { location: loc } = current;
            mapRef.current.flyTo(
              [loc.lat, loc.long],
              mapRef.current.getZoom(),
              { duration: 1.5 },
            );
          }}
          onAnimateAll={handleAnimateAll}
          isAnimatingAll={isAnimatingAll}
          controlRef={paperControl}
        />

        {selectedShipIndex !== null && filteredShips[selectedShipIndex] && (
          <ShipInfoPanel
            ship={filteredShips[selectedShipIndex]}
            timeRange={timeRange} // pass timeRange instead
            onClose={() => setSelectedShipIndex(null)}
            controlRef={boxControl}
          />
        )}

        <ShipMapLayer
          ships={ships}
          filteredShips={filteredShips}
          visibleShips={visibleShips}
          shipPositions={shipPositions}
          onMarkerClick={setSelectedShipIndex}
          timeRange={timeRange}
        />

        <MiniMapControl position={initialCenter} zoom={5} />
      </MapContainer>

      <ShipTimeControl
        ships={ships}
        onTimeChange={handleTimeChange}
        controlRef={timeControl}
        isAnimating={isAnimatingAll}
        currentSimulatedTime={currentSimulatedTime}
        availableTimes={availableTimes}
        animateAll={handleAnimateAllFromTime}
        isAnimatingAll={isAnimatingAll}
      />
    </Box>
  );
}
