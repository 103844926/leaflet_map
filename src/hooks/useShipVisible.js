import { useMemo, useRef, useCallback, useState } from "react";

export function useShipVisible(ships) {
  // Using a ref map for ship_uid based visibility
  const visibleByUidRef = useRef(new Map());

  // Render trigger
  const [visibleVersion, setVisibleVersion] = useState(0);

  // Index-aligned array for rendering
  const visibleShips = useMemo(() => {
    console.log('Recomputing visibleShips for the', visibleVersion, 'time');
    return ships.map(ship =>
      visibleByUidRef.current.get(ship.ship_uid) ?? true
    );
  }, [ships, visibleVersion]); // Recompute when version changes

  // Toggle by index
  const handleShipToggle = useCallback((index) => {
    const ship = ships[index];
    if (!ship) return;

    const uid = ship.ship_uid;
    const current = visibleByUidRef.current.get(uid) ?? true;
    visibleByUidRef.current.set(uid, !current);

    setVisibleVersion(v => v + 1);
  }, [ships]);

  return {
    visibleShips,
    handleShipToggle
  };
}
