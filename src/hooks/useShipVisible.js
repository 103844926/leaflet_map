import { useState, useEffect } from "react";

export function useShipVisible(ships, currentShips) {
  const [visibleShips, setVisibleShips] = useState([]);
  const [showBackgroundShips, setShowBackgroundShips] = useState(false); // Start hidden

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

  const toggleBackgroundShips = () => {
    setShowBackgroundShips((prev) => !prev);
  };

  return {
    visibleShips,
    handleShipToggle,
    showBackgroundShips,
    toggleBackgroundShips
  };
}