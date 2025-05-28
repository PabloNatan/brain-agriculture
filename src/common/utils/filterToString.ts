export function filterToString(obj: object) {
  return `filters=${encodeURIComponent(JSON.stringify(obj))}`;
}
