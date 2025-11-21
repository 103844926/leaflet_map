import { useState, useEffect } from "react";

export function useShipVisible(ships) {
  const [visibleShips, setVisibleShips] = useState([]);

  // Initialize visibility when ships array changes
  useEffect(() => {
    setVisibleShips((prev) => ships.map((_, i) => prev[i] ?? true));
  }, [ships]);

  const handleShipToggle = (index) => {
    setVisibleShips((prev) => {
      const newVisible = [...prev];
      newVisible[index] = !newVisible[index];
      return newVisible;
    });
  };

  return { visibleShips, handleShipToggle };
}
