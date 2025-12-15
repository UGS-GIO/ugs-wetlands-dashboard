// Classification functions for wetlands dashboard
// Consolidates HUC codes and Cowardin codes to groups matching the R Shiny app

// HUC6 watershed lookup: maps 6-digit HUC codes to watershed names
const huc6Map: Record<string, string> = {
  '140300': 'Upper Colorado-Dolores',
  '140401': 'Upper Green',
  '140500': 'White-Yampa',
  '140600': 'Lower Green',
  '140700': 'Upper Colorado-Dirty Devil',
  '140802': 'Lower San Juan',
  '150100': 'Lower Colorado-Lake Mead',
  '160101': 'Upper Bear',
  '160102': 'Lower Bear',
  '160201': 'Weber',
  '160202': 'Jordan',
  '160203': 'Great Salt Lake',
  '160300': 'Escalante Desert-Sevier Lake',
  '170402': 'Upper Snake',
}

/**
 * Classify HUC8 codes to HUC6 watershed names
 * Takes the first 6 digits and maps to basin name
 */
export function classifyHuc(huc8: string | number | undefined): string {
  if (!huc8) return 'Other'
  const huc6 = String(huc8).substring(0, 6)
  return huc6Map[huc6] || 'Other'
}

/**
 * Classify Cowardin codes to Utah wetland types
 */
export function classifyWetland(code: string | undefined): string {
  if (!code) return 'Other'

  if (code.includes('AB')) {
    return 'Aquatic Bed'
  } else if (code.includes('EM')) {
    return 'Marsh'
  } else if (code.includes('SS') || code.includes('FO')) {
    return 'Woody'
  } else if (code.includes('UB') || code.includes('US')) {
    return 'Playa/Mudflat'
  } else {
    return 'Other'
  }
}
