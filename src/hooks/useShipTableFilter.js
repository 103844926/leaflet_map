import { useState, useEffect, useCallback } from "react";
import { fetchShipsPaginated, fetchShipFilters } from "@/datas";

const EMPTY_FILTERS = {
    type: "",
    country_code: "",
};

function usePersistedState(key, initialValue) {
    const [state, setState] = useState(() => {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setPersistedState = useCallback((valueOrUpdater) => {
        setState(prev => {
            const nextValue =
                typeof valueOrUpdater === "function"
                    ? valueOrUpdater(prev)
                    : valueOrUpdater;
            try {
                sessionStorage.setItem(key, JSON.stringify(nextValue));
            } catch (err) {
                console.warn("Failed to persist state:", err);
            }
            return nextValue;
        });
    }, [key]);

    return [state, setPersistedState];
}

export function useShipTableFilter() {
    const [page, setPage] = usePersistedState("shipTable_page", 1);
    const [pageSize, setPageSize] = usePersistedState("shipTable_pageSize", 20);
    const [appliedSearch, setAppliedSearch] = usePersistedState("shipTable_search", "");
    const [appliedFilters, setAppliedFilters] = usePersistedState(
        "shipTable_filters",
        EMPTY_FILTERS
    );

    const [ships, setShips] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        size: 20,
        total: 0,
        totalPages: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [typeOptions, setTypeOptions] = useState([]);
    const [countryOptions, setCountryOptions] = useState([]);

    // Fetch metadata once
    useEffect(() => {
        fetchShipFilters()
            .then(data => {
                setTypeOptions(data.ship_types);
                setCountryOptions(data.country_codes);
            })
            .catch(() => setError("Failed to load filters"));
    }, []);

    // Fetch paginated ships with search and filters
    useEffect(() => {
        setLoading(true);
        fetchShipsPaginated({
            filter: appliedSearch,
            country_code: appliedFilters.country_code,
            ship_type: appliedFilters.type,
            page,
            size: pageSize,
        })
            .then(res => {
                setShips(res.ships);
                setPagination(res.pagination);
            })
            .catch(() => setError("Failed to load ship data"))
            .finally(() => setLoading(false));
    }, [page, pageSize, appliedSearch, appliedFilters]);

    const applyFilters = useCallback((search, filters) => {
        setAppliedSearch(search);
        setAppliedFilters(filters);
        setPage(1);
    }, [setAppliedSearch, setAppliedFilters, setPage]);

    const clearFilters = useCallback(() => {
        setAppliedSearch("");
        setAppliedFilters(EMPTY_FILTERS);
        setPage(1);
    }, [setAppliedSearch, setAppliedFilters, setPage]);

    return {
        ships,
        pagination,
        loading,
        error,

        page,
        pageSize,
        typeOptions,
        countryOptions,

        appliedSearch,
        appliedFilters,

        applyFilters,
        clearFilters,
        changePage: setPage,
        changePageSize: (size) => {
            setPageSize(size);
            setPage(1);
        },
    };
}
