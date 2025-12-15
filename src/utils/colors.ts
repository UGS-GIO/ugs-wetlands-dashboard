/**
 * Shared color utilities for wetlands dashboard
 * ColorBrewer palettes matching R's scale_fill_brewer/scale_color_brewer
 */

// PuOr diverging palettes from ColorBrewer - exact values for each n
// https://colorbrewer2.org/#type=diverging&scheme=PuOr&n=11
// R's scale_fill_brewer picks specific subsets based on number of groups
export const PUOR_PALETTES: Record<number, readonly string[]> = {
  3: ['#f1a340', '#f7f7f7', '#998ec3'],
  4: ['#e66101', '#fdb863', '#b2abd2', '#5e3c99'],
  5: ['#e66101', '#fdb863', '#f7f7f7', '#b2abd2', '#5e3c99'],
  6: ['#b35806', '#f1a340', '#fee0b6', '#d8daeb', '#998ec3', '#542788'],
  7: ['#b35806', '#f1a340', '#fee0b6', '#f7f7f7', '#d8daeb', '#998ec3', '#542788'],
  8: ['#b35806', '#e08214', '#fdb863', '#fee0b6', '#d8daeb', '#b2abd2', '#8073ac', '#542788'],
  9: ['#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788'],
  10: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],
  11: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],
}

/**
 * Get the appropriate PuOr palette for a given number of groups
 * Matches R's scale_fill_brewer behavior
 */
export function getPuOrPalette(numGroups: number): readonly string[] {
  if (numGroups <= 3) return PUOR_PALETTES[3]
  if (numGroups <= 11) return PUOR_PALETTES[numGroups] || PUOR_PALETTES[11]
  return PUOR_PALETTES[11]
}

// BrBG 11-class diverging palette from ColorBrewer
// https://colorbrewer2.org/#type=diverging&scheme=BrBG&n=11
export const BRBG_11 = [
  '#543005', // dark brown
  '#8c510a',
  '#bf812d',
  '#dfc27d',
  '#f6e8c3',
  '#f5f5f5', // white center
  '#c7eae5',
  '#80cdc1',
  '#35978f',
  '#01665e',
  '#003c30', // dark teal
] as const

// Chart styling constants matching R Shiny app
export const CHART_STYLES = {
  // Histogram
  histogram: {
    strokeColor: '#cccccc', // gray80 in R
    strokeWidth: 0.5,
    opacity: 0.8,
  },
  // Boxplot
  boxplot: {
    strokeColor: '#dedede',
    strokeWidth: 1,
    opacity: 0.9,
    jitterAlpha: 0.8,
    jitterColor: '#dedede',
  },
  // Community plot (stacked bar)
  communityPlot: {
    strokeColor: '#d3d3d3', // lightgray in R
    strokeWidth: 0.5,
  },
  // Map markers
  map: {
    fillOpacity: 0.8,
    strokeColor: '#7f7f7f',
    strokeWidth: 1,
    radius: 8,
    // Water map specific
    filteredStrokeColor: '#000000',
    filteredStrokeWidth: 3,
    unfilteredStrokeColor: '#7f7f7f',
    unfilteredStrokeWidth: 1,
  },
  // Reference lines
  referenceLine: {
    color: '#FFFFFF',
    width: 2,
    dashArray: '5,5',
  },
  // Axis and text colors (dark theme)
  axis: {
    textColor: '#e0e0e0',
    lineColor: '#e0e0e0',
    fontSize: '11px',
  },
  caption: {
    color: '#999',
    fontSize: '10px',
  },
} as const
