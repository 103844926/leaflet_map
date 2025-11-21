// hooks/getCurrentShipPosition.js
export function useCurrentShipPosition(ship, timeRange) {
  if (!ship?.locations?.length) return null;

  let currentIndex = 0;

  if (timeRange) {
    const lastVisibleIndex = ship.locations.findIndex(
      (loc) => loc.time > timeRange[1],
    );
    currentIndex =
      lastVisibleIndex === -1
        ? ship.locations.length - 1
        : Math.max(0, lastVisibleIndex - 1);
  }

  return {
    index: currentIndex,
    location: ship.locations[currentIndex],
  };
}
