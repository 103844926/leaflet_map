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
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function clearAreas() {
    localStorage.removeItem(STORAGE_KEY);
}
