import L from "leaflet";

export function useLeafletControl() {
  return (el) => {
    if (el) {
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
    }
  };
}
