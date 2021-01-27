// helpers to recognize gap characters
export function isGapChar(c) {
  return typeof c === "string"
    ? c === "-" || c === "."
    : !c || Object.keys(c).length === 0;
}
