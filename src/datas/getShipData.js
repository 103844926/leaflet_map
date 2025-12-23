let cachedData = null;
let cachedCurrentData = null;

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

export const loadCurrentShipData = async (forceRefresh = false) => {
  if (cachedCurrentData && !forceRefresh) return cachedCurrentData;

  try {
    const response = await fetch("/ship_on_map.txt");
    const text = await response.text();
    cachedCurrentData = JSON.parse(text);
    return cachedCurrentData;
  } catch (error) {
    console.error("Error loading current ship data:", error);
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
        speed: loc.speed,
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

// NEW: Get current ship positions
export const getCurrentShipData = async (forceRefresh = false) => {
  const data = await loadCurrentShipData(forceRefresh);
  if (!data) return [];

  return data.map((ship) => ({
    ship_uid: ship.ship_uid,
    lat: ship.ship_lat,
    long: ship.ship_long,
    course: ship.course,
    ship_type: ship.ship_type,
    speed: ship.speed,
    name: ship.name,
    country_code: ship.country_code,
    length: ship.length,
    width: ship.width,
    crawl_time: ship.crawl_time,
    status: ship.status,
    violation_f: ship.violation_f,
    source_type: ship.source_type,
    isCurrentPosition: true, // Flag to identify these ships
  }));
};

// Get data for a specific ship
export const getShipById = async (shipUid) => {
  const ships = await getShipData();
  return ships.find((ship) => ship.ship_uid === shipUid);
};