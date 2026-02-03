// ShipRow.jsx
import { useState } from "react";
import { Stack, Button } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ShipLayerMenu } from "./ShipLayerMenu";

export function ShipLayerRow({
    index,
    ship,
    isVisible,
    isAnimatingAll,
    onShipToggle,
    onJumpToShip,
    onJumpToStartTime,
    movementMarks,
    onRecordingShipChange,
    onDialogChange,
}) {
    const [anchorEl, setAnchorEl] = useState(null);

    const openMenu = (e) => setAnchorEl(e.currentTarget);
    const closeMenu = () => setAnchorEl(null);

    return (
        <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Button
                variant="outlined"
                onClick={openMenu}
                disabled={isAnimatingAll}
                sx={{
                    fontSize: "12px",
                    padding: "8px 12px",
                    width: "100%",
                    borderRadius: "4px",
                    backgroundColor: isVisible ? "rgba(25,118,210,0.08)" : "transparent",
                    borderColor: isVisible ? "primary.main" : "divider",
                    display: "flex",
                    justifyContent: "flex-start",
                    textTransform: "none",
                }}
            >
                {isVisible ? (
                    <Visibility fontSize="small" color="primary" sx={{ mr: 1 }} />
                ) : (
                    <VisibilityOff fontSize="small" color="disabled" sx={{ mr: 1 }} />
                )}

                {/* Label */}
                <span
                    style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                        display: "inline-block",
                        verticalAlign: "middle",
                    }}
                    title={ship.ship_uid}
                >
                    {ship.ship_uid}
                </span>
            </Button>

            <ShipLayerMenu
                anchorEl={anchorEl}
                onClose={closeMenu}
                isVisible={isVisible}
                index={index}
                ship={ship}
                onShipToggle={onShipToggle}
                onJumpToShip={onJumpToShip}
                onJumpToStartTime={onJumpToStartTime}
                movementMarks={movementMarks}
                onRecordingShipChange={onRecordingShipChange}
                onDialogChange={onDialogChange}
            />
        </Stack>
    );
}
