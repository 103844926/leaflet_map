import { useState, useMemo } from "react";
import { Cloud, CloudOff, Visibility, VisibilityOff } from "@mui/icons-material";

export function useLayerControl() {
    // All visibility states
    const [showWeather, setShowWeather] = useState(true);
    const [showUI, setShowUI] = useState(true);
    // Layer configurations
    const layerConfigs = useMemo(
        () => [
            {
                id: "weather",
                icon: showWeather ? <Cloud /> : <CloudOff />,
                tooltip: showWeather ? "Hide Weather" : "Show Weather",
                isVisible: showWeather,
                onToggle: () => setShowWeather(!showWeather),
            },
            {
                id: "ui",
                icon: showUI ? <Visibility /> : <VisibilityOff />,
                tooltip: showUI ? "Hide UI Controls" : "Show UI Controls",
                isVisible: showUI,
                onToggle: () => setShowUI(!showUI),
            },
        ],
        [showWeather, showUI]
    );

    return {
        // Individual states (if needed elsewhere)
        showWeather,
        showUI,

        // Configuration for LayerControl component
        layerConfigs,
    };
}