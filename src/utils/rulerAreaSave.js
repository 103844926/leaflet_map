const STORAGE_KEY = "ruler_areas_v1";

export function saveAreas(areas) {
    const serializable = areas.map(a => ({
        id: a.id,
        name: a.name,
        points: a.points.map(p => ({ ...p }))
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

export function loadAreas() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const areas = JSON.parse(raw);
    // Make sure visible property is preserved
    return areas.map(area => ({
        ...area,
        visible: area.visible ?? false  // Default to false if not set
    }));
}

export function clearAreas() {
    localStorage.removeItem(STORAGE_KEY);
}
