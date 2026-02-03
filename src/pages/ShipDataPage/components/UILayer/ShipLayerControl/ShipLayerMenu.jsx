// ShipLayerMenu.jsx
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { Visibility, VisibilityOff, MyLocation, DirectionsBoat, FiberManualRecord } from "@mui/icons-material";

export function ShipLayerMenu({
    anchorEl,
    onClose,
    isVisible,
    index,
    ship,
    onShipToggle,
    onJumpToShip,
    onJumpToStartTime,
    movementMarks,
    onRecordingShipChange,
    onDialogChange,
}) {
    const handleStartTime = () => {
        const startTime = movementMarks.get(ship.ship_uid)?.time;
        if (startTime) {
            onJumpToStartTime(index, startTime);
        }
        onClose();
    };

    const handleRecordShip = () => {
        onRecordingShipChange(index);

        // Direct lookup by ship_uid
        const startTime = movementMarks.get(ship.ship_uid)?.time;

        onDialogChange(true, startTime);
        onClose();
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={onClose}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
            {/* SHOW / HIDE */}
            <MenuItem
                onClick={() => {
                    onShipToggle(index);
                    onClose();
                }}
            >
                <ListItemIcon>
                    {isVisible ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </ListItemIcon>
                <ListItemText>{isVisible ? "Hide Ship" : "Show Ship"}</ListItemText>
            </MenuItem>

            {/* JUMP TO POSITION */}
            <MenuItem
                disabled={!isVisible}
                onClick={() => {
                    onJumpToShip(index);
                    onClose();
                }}
            >
                <ListItemIcon>
                    <MyLocation fontSize="small" />
                </ListItemIcon>
                <ListItemText>Jump to Position</ListItemText>
            </MenuItem>

            {/* JUMP TO START TIME */}
            <MenuItem disabled={!isVisible} onClick={handleStartTime}>
                <ListItemIcon>
                    <DirectionsBoat fontSize="small" />
                </ListItemIcon>
                <ListItemText>Jump to Start Time</ListItemText>
            </MenuItem>

            {/* RECORD THIS SHIP */}
            <MenuItem disabled={!isVisible} onClick={handleRecordShip}>
                <ListItemIcon>
                    <FiberManualRecord fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Record This Ship</ListItemText>
            </MenuItem>
        </Menu>
    );
}
