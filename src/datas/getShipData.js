let cachedData = null;

export const loadShipData = async (forceRefresh = false) => {
  if (cachedData && !forceRefresh) return cachedData;

  try {
    const response = await fetch("/mockdata.txt");
    const text = await response.text();
    cachedData = JSON.parse(text);
    return cachedData;
  } catch (error) {
    console.error("Error loading ship data:", error);
    return null;
  }
};

export const getShipData = async (forceRefresh = false) => {
  const data = await loadShipData(forceRefresh);
  if (!data || !data.data) return [];

  return data.data.map((ship) => ({
    ship_uid: ship.ship_uid,
    locations: ship.location_history
      .slice()
      .reverse()
      .map((loc) => ({
        lat: loc.lat,
        long: loc.long,
        time: loc.time,
        course: loc.course,
        timeFormatted: new Date(loc.time).toLocaleString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      })),
  }));
};

// Get data for a specific ship
export const getShipById = async (shipUid) => {
  const ships = await getShipData();
  return ships.find((ship) => ship.ship_uid === shipUid);
};
