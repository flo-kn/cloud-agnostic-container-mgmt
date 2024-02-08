/**
 * Helper function to convert a string to CamelCase, e.g. "ann-wall" to "AnnWall"
 *
 * @param text the string you want to convert
 */
export function toCamelCase(text: string): string {
  return text
    .replace(/^\w|_|[A-Z]|\b\w|-/g, (leftTrim: string, index: number) =>
      index === 0 ? leftTrim.toLowerCase() : leftTrim.toUpperCase()
    )
    .replace(/\s+/g, '')
    .replace(/\s*-/g, '');
}
