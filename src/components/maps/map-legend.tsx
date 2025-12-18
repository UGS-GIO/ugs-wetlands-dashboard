import * as d3 from 'd3'
import maplibregl from 'maplibre-gl'

// Custom MapLibre control for legend
export class LegendControl implements maplibregl.IControl {
  private container: HTMLDivElement | null = null
  private parameter: string = ''
  private units: string = ''
  private legendData: ReturnType<typeof useMapLegend> = null

  onAdd(): HTMLElement {
    this.container = document.createElement('div')
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group'
    this.render()
    return this.container
  }

  onRemove(): void {
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    this.container = null
  }

  update(parameter: string, units: string, legendData: ReturnType<typeof useMapLegend>): void {
    this.parameter = parameter
    this.units = units
    this.legendData = legendData
    this.render()
  }

  private render(): void {
    if (!this.container) return

    if (!this.legendData) {
      this.container.innerHTML = ''
      this.container.style.display = 'none'
      return
    }

    this.container.style.display = 'block'
    this.container.innerHTML = `
      <div style="background: white; border-radius: 8px; padding: 12px; font-size: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
        <div style="font-weight: 600; color: #333; margin-bottom: 8px;">${this.parameter} (${this.units})</div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="display: flex; flex-direction: column; justify-content: space-between; height: 150px; font-size: 11px; color: #555;">
            ${this.legendData.tickValues.map(val => `<div style="text-align: right; line-height: 1;">${this.legendData!.formatValue(val)}</div>`).join('')}
          </div>
          <div style="width: 16px; height: 150px; background: ${this.legendData.gradientCSS}; border: 1px solid #ccc; border-radius: 2px;"></div>
        </div>
      </div>
    `
  }
}

// Custom MapLibre control for sample type legend (water chemistry only)
export class SampleTypeLegendControl implements maplibregl.IControl {
  private container: HTMLDivElement | null = null

  onAdd(): HTMLElement {
    this.container = document.createElement('div')
    this.container.className = 'maplibregl-ctrl maplibregl-ctrl-group'
    this.container.innerHTML = `
      <div style="background: white; border-radius: 8px; padding: 12px; font-size: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">
        <div style="font-weight: 600; color: #333; margin-bottom: 8px;">Sample Type (Outline)</div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 16px; height: 3px; background: #000000;"></div>
            <span style="color: #555;">Filtered</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 16px; height: 1px; background: #7f7f7f;"></div>
            <span style="color: #555;">Unfiltered</span>
          </div>
        </div>
      </div>
    `
    return this.container
  }

  onRemove(): void {
    if (this.container?.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    this.container = null
  }
}

export function useMapLegend(data: { value: number }[]) {
  if (data.length === 0) return null

  const values = data.map(d => d.value).filter(v => !isNaN(v))
  if (values.length === 0) return null

  const extent = d3.extent(values)
  const minValue = extent[0] ?? 0
  const maxValue = extent[1] ?? 0

  // Create color scale (reversed plasma to match R Shiny)
  const colorScale = d3.scaleSequential((t) => d3.interpolatePlasma(1 - t)).domain([minValue, maxValue])

  // Create gradient stops
  const gradientStops = Array.from({ length: 10 }, (_, i) => {
    const value = minValue + (maxValue - minValue) * (i / 9)
    return { value, color: colorScale(value) }
  })

  // Generate nice round tick values
  const getNiceTickValues = (min: number, max: number, targetCount: number = 6) => {
    const range = max - min
    if (range === 0) return [min]

    const roughStep = range / (targetCount - 1)
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))
    const normalized = roughStep / magnitude

    let niceStep: number
    if (normalized <= 1) niceStep = 1 * magnitude
    else if (normalized <= 2) niceStep = 2 * magnitude
    else if (normalized <= 5) niceStep = 5 * magnitude
    else niceStep = 10 * magnitude

    const niceMin = Math.floor(min / niceStep) * niceStep
    const niceMax = Math.ceil(max / niceStep) * niceStep

    const ticks: number[] = []
    for (let i = niceMin; i <= niceMax + niceStep / 2; i += niceStep) {
      if (i >= min - niceStep / 2 && i <= max + niceStep / 2) {
        ticks.push(i)
      }
    }

    return ticks.reverse() // Top to bottom for vertical display
  }

  const tickValues = getNiceTickValues(minValue, maxValue)

  // Format numbers appropriately
  const formatValue = (val: number): string => {
    const absVal = Math.abs(val)
    if (absVal === 0) return '0'
    if (absVal >= 10000) return val.toLocaleString('en-US', { maximumFractionDigits: 0 })
    if (absVal >= 1000) return val.toLocaleString('en-US', { maximumFractionDigits: 0 })
    if (absVal >= 100) return val.toLocaleString('en-US', { maximumFractionDigits: 1 })
    if (absVal >= 10) return val.toLocaleString('en-US', { maximumFractionDigits: 1 })
    if (absVal >= 1) return val.toLocaleString('en-US', { maximumFractionDigits: 2 })
    if (absVal >= 0.1) return val.toLocaleString('en-US', { maximumFractionDigits: 2 })
    return val.toLocaleString('en-US', { maximumFractionDigits: 3 })
  }

  return {
    minValue,
    maxValue,
    colorScale,
    gradientStops,
    tickValues,
    formatValue,
    gradientCSS: `linear-gradient(to top, ${gradientStops.map(s => s.color).join(', ')})`,
    gradientCSSHorizontal: `linear-gradient(to right, ${gradientStops.map(s => s.color).join(', ')})`,
  }
}

export function VerticalLegend({
  parameter,
  units,
  legendData
}: {
  parameter: string
  units: string
  legendData: ReturnType<typeof useMapLegend>
}) {
  if (!legendData) return null

  return (
    <div className="bg-white rounded-lg shadow-md p-3 text-sm">
      <div className="font-medium text-gray-900 mb-2">{parameter} ({units})</div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col justify-between text-xs text-gray-700" style={{ height: '180px' }}>
          {legendData.tickValues.map((val, i) => (
            <div key={i} className="text-right" style={{ lineHeight: '1' }}>
              {legendData.formatValue(val)}
            </div>
          ))}
        </div>
        <div
          style={{
            width: '20px',
            height: '180px',
            background: legendData.gradientCSS,
            border: '1px solid #ccc',
            borderRadius: '2px'
          }}
        />
      </div>
    </div>
  )
}

export function HorizontalLegend({
  parameter,
  units,
  legendData
}: {
  parameter: string
  units: string
  legendData: ReturnType<typeof useMapLegend>
}) {
  if (!legendData) return null

  return (
    <div className="text-sm">
      <div className="font-medium mb-2">{parameter} ({units})</div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {legendData.formatValue(legendData.minValue)}
        </span>
        <div
          className="flex-1 h-4 rounded"
          style={{
            background: legendData.gradientCSSHorizontal,
            border: '1px solid #ccc',
          }}
        />
        <span className="text-xs text-muted-foreground">
          {legendData.formatValue(legendData.maxValue)}
        </span>
      </div>
    </div>
  )
}
