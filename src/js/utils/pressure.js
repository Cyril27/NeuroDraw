export function getPressure(e) {
  if (e.pressure !== undefined && e.pressure !== 0) {
    return e.pressure;
  }

  if (e.touches && e.touches[0]?.force !== undefined) {
    return e.touches[0].force || 0.5;
  }

  return 0.5;
}
