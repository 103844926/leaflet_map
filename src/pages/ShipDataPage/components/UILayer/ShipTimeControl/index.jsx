// ShipTimeControl/ShipTimeControl.jsx
import React, { useState, useEffect, useRef } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import { ShipTimeControlMobile } from "./ShipTimeControl.mobile";
import { ShipTimeControlDesktop } from "./ShipTimeControl.desktop";

export function ShipTimeControl(props) {
    const {
        minTime,
        maxTime,
        selectedTime,
        isAnimating,
        isRecordingActive,
        onStop,
        onRecordingButtonClick,
    } = props;

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    // ---- shared state ----
    const [windowStart, setWindowStart] = useState(minTime);
    const [windowEnd, setWindowEnd] = useState(maxTime);
    const [showRangePicker, setShowRangePicker] = useState(false);
    const [showPlaybackPicker, setPlaybackPicker] = useState(false);

    const [stagingStart, setStagingStart] = useState(minTime);
    const [stagingEnd, setStagingEnd] = useState(maxTime);

    const playbackRef = useRef(null);

    // ---- sync time bounds ----
    useEffect(() => {
        setWindowStart(minTime);
        setWindowEnd(maxTime);
        setStagingStart(minTime);
        setStagingEnd(maxTime);
    }, [minTime, maxTime]);

    // ---- auto close range picker ----
    useEffect(() => {
        if (isAnimating) setShowRangePicker(false);
    }, [isAnimating]);

    const handleRecordingButtonClick = () => {
        if (isRecordingActive) onStop();
        onRecordingButtonClick();
    };

    const sharedProps = {
        ...props,

        windowStart,
        windowEnd,
        setWindowStart,
        setWindowEnd,

        showRangePicker,
        setShowRangePicker,

        showPlaybackPicker,
        setPlaybackPicker,
        playbackRef,

        stagingStart,
        stagingEnd,
        setStagingStart,
        setStagingEnd,

        onRecordingButtonClick: handleRecordingButtonClick,
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            {isMobile ? (
                <ShipTimeControlMobile {...sharedProps} />
            ) : (
                <ShipTimeControlDesktop {...sharedProps} />
            )}
        </LocalizationProvider>
    );
}
