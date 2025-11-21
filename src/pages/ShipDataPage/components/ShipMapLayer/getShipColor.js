export function getShipColor(index) {
  const colors = [
    "lime",
    "blue",
    "red",
    "orange",
    "purple",
    "cyan",
    "magenta",
    "yellow",
  ];
  return colors[index % colors.length];
}
