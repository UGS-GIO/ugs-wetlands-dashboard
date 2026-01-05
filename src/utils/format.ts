/**
 * Shared formatting utilities for wetlands dashboard
 */

// Number of significant figures for summary statistics (matching R's signif(., 3))
export const SIGNIFICANT_FIGURES = 3

/**
 * Format a number to significant figures (matching R's signif function)
 * Adds thousands separators for large numbers
 */
export function signif(n: number, digits: number = SIGNIFICANT_FIGURES): string {
  if (n === 0) return '0'
  const val = parseFloat(n.toPrecision(digits))
  return val >= 1000 ? val.toLocaleString() : val.toString()
}
