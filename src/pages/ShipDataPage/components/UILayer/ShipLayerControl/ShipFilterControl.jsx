import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider } from "@mui/material";
import { defaultShipFilters } from "@/utils";
import { ShipFilterFields } from "./ShipFilterFields";

export function ShipFilterControl({ open, filters, filterOptions, onApply, onClose }) {
    const [draft, setDraft] = useState(filters);

    // Sync when opened
    useEffect(() => {
        if (open) setDraft(filters);
    }, [open, filters]);

    const handleClear = () => {
        setDraft(defaultShipFilters);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Ship Filters</DialogTitle>

            <DialogContent dividers>
                <ShipFilterFields filters={draft} onChange={setDraft} filterOptions={filterOptions} />
            </DialogContent>

            <Divider />

            <DialogActions>
                <Button onClick={handleClear} color="inherit">
                    Clear all
                </Button>

                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>

                <Button
                    variant="contained"
                    onClick={() => onApply(draft)}
                >
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    );
}
