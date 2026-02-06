const getBackendBase = () => {
  return window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : `http://${window.location.hostname}:3001`;
};

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

// -------------------------------------------------------------------------
// GET SHIP DATA WITH MULTIPLE POSITIONS
// -------------------------------------------------------------------------
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

// -------------------------------------------------------------------------
// GET SHIP DATA WITH ONE POSITION
// -------------------------------------------------------------------------
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
    isCurrentPosition: true,
  }));
};

// -------------------------------------------------------------------------
// GET SHIP DATA FROM BACKEND FOR TABLE
// -------------------------------------------------------------------------
export const fetchShipsPaginated = async (params = {}) => {
  const {
    country_code = '',
    ship_type = '',
    filter = '',
    page = 1,
    size = 20,
  } = params;

  try {
    const BACKEND_BASE = getBackendBase();
    const url = new URL(`${BACKEND_BASE}/api/ships`);

    // Add all parameters to URL
    url.searchParams.set('country_code', country_code);
    url.searchParams.set('ship_type', ship_type);
    url.searchParams.set('filter', filter);
    url.searchParams.set('page', page);
    url.searchParams.set('size', size);

    console.log('🚀 Fetching ships from:', url.toString());

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return {
      ships: result.data,
      pagination: {
        page: result.page,
        size: result.size,
        total: result.total,
        total_unfiltered: result.total_unfiltered,
        totalPages: result.total_page
      }
    };
  } catch (error) {
    console.error("Error fetching ships:", error);
    return {
      ships: [],
      pagination: { page: 1, size: 20, total: 0, total_unfiltered: 0, totalPages: 0 }
    };
  }
};

export const fetchShipFilters = async () => {
  const BACKEND_BASE = getBackendBase();
  const res = await fetch(`${BACKEND_BASE}/api/ships/filters`);
  if (!res.ok) throw new Error('Failed to fetch ship filters');
  return res.json();
};

// Get data for a specific ship
export const getShipById = async (shipUid) => {
  const ships = await getShipData();
  return ships.find((ship) => ship.ship_uid === shipUid);
};