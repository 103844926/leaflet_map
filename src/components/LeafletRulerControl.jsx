import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { clearAllElements } from "@/utils";
import { useRulerHandlers } from "@/hooks";

export function LeafletRulerControl() {
    const map = useMap();

    const refs = {
        isActive: useRef(false),
        hasAnchor: useRef(false),
        chainStartIndex: useRef(null),

        points: useRef([]),
        lines: useRef([]),
        labels: useRef([]),

        fillCircle: useRef(null),
        ringLayer: useRef(null),
        ringLabels: useRef(null),

        tempLine: useRef(null),
        tempLabel: useRef(null),

        button: useRef(null)
    };

    const handlers = useRulerHandlers(map, refs);

    useEffect(() => {
        if (!map) return;

        const RulerControl = L.Control.extend({
            options: { position: "topright" },
            onAdd() {
                const container = L.DomUtil.create("div", "leaflet-bar");
                const button = L.DomUtil.create("a", "", container);

                button.innerHTML = "📏";
                button.href = "#";
                button.style.width = "30px";
                button.style.height = "30px";
                button.style.display = "flex";
                button.style.alignItems = "center";
                button.style.justifyContent = "center";

                L.DomEvent.disableClickPropagation(button);
                refs.button.current = button;
                return container;
            }
        });

        const control = new RulerControl();
        control.addTo(map);

        refs.button.current.addEventListener("click", handlers.onButtonClick);
        map.on("click", handlers.onMapClick);
        map.on("mousemove", handlers.onMouseMove);

        return () => {
            clearAllElements(refs, map);
            refs.button.current?.removeEventListener("click", handlers.onButtonClick);
            map.off("click", handlers.onMapClick);
            map.off("mousemove", handlers.onMouseMove);
            map.removeControl(control);
        };
    }, [map, handlers]);

    return null;
}
