export function getPressure(e) {
  // Pointer Events (mouse, pen, some touch)
  if (e.pressure !== undefined && e.pressure !== 0) {
    return e.pressure;
  }

  // iOS Touch Events
  if (e.touches && e.touches[0]?.force !== undefined) {
    return e.touches[0].force || 0.5;
  }

  // Fallback
  return 0.5;
}
