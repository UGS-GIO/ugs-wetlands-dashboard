// PostgREST API configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://postgrest-seamlessgeolmap-734948684426.us-central1.run.app'
const API_SCHEMA = import.meta.env.VITE_API_SCHEMA || 'wetlands'

/**
 * Fetch data from PostgREST API with optional column selection
 * @param tableName Table name without wetdash_ prefix
 * @param columns Optional array of columns to select (reduces payload size)
 * @returns Promise with the data array
 */
export async function fetchFromAPI<T>(tableName: string, columns?: string[]): Promise<T[]> {
  let url = `${API_BASE_URL}/wetdash_${tableName}`
  if (columns && columns.length > 0) {
    url += `?select=${columns.join(',')}`
  }

  const response = await fetch(url, {
    headers: {
      'Accept-Profile': API_SCHEMA,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch record count from PostgREST API without downloading all data
 * Uses PostgREST's count feature for efficiency
 * @param tableName Table name without wetdash_ prefix
 * @returns Promise with the count
 */
export async function fetchCount(tableName: string): Promise<number> {
  const url = `${API_BASE_URL}/wetdash_${tableName}?select=count`

  const response = await fetch(url, {
    headers: {
      'Accept-Profile': API_SCHEMA,
      Accept: 'application/vnd.pgrst.object+json',
      Prefer: 'count=exact',
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.count || 0
}

/**
 * Fetch unique values count for a column
 * @param tableName Table name without wetdash_ prefix
 * @param column Column to count unique values for
 * @returns Promise with the unique count
 */
export async function fetchUniqueCount(tableName: string, column: string): Promise<number> {
  const url = `${API_BASE_URL}/wetdash_${tableName}?select=${column}`

  const response = await fetch(url, {
    headers: {
      'Accept-Profile': API_SCHEMA,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const uniqueValues = new Set(data.map((d: Record<string, unknown>) => d[column]))
  return uniqueValues.size
}

/**
 * Fetch multiple tables from PostgREST API
 * @param tableNames Array of table names without wetdash_ prefix
 * @returns Promise with object containing all tables
 */
export async function fetchMultipleFromAPI(
  tableNames: string[],
): Promise<Record<string, unknown[]>> {
  const results = await Promise.all(tableNames.map((name) => fetchFromAPI(name)))

  const output: Record<string, unknown[]> = {}
  tableNames.forEach((name, index) => {
    output[name] = results[index]
  })
  return output
}

/**
 * Download data as CSV file
 * @param data Array of data items
 * @param filename Name for the downloaded file
 * @param headers Array of header names
 * @param getValue Function to extract values from each row by header key
 */
export function downloadCSV<T>(
  data: T[],
  filename: string,
  headers: string[],
  getValue: (row: T, key: string) => unknown,
) {

  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = getValue(row, h)
          if (val == null) return ''
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`
          return String(val)
        })
        .join(',')
    ),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
