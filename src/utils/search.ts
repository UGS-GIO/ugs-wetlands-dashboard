import { GROUPING_OPTIONS, type GroupingKey } from '../types'

// Helpers for validating route search params (selections live in the URL)
// Narrowing via for...in / find keeps the literal key types without casting

export function pickKey<T extends object>(value: string | undefined, options: T): Extract<keyof T, string> | undefined {
  for (const key in options) {
    if (key === value) return key
  }
  return undefined
}

export function pickValue(value: string | undefined, options: Record<string, string>): string | undefined {
  return Object.values(options).find((option) => option === value)
}

export function pickGrouping(value: string | undefined): GroupingKey {
  return pickKey(value, GROUPING_OPTIONS) ?? 'Watershed'
}
