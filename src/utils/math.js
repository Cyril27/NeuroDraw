export function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function std(arr) {
  const m = mean(arr);
  return Math.sqrt(
    arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length
  );
}
