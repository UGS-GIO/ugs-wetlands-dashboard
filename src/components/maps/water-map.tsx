import { useEffect, useRef, useState } from 'react'
import maplibregl, { StyleSpecification } from 'maplibre-gl'
import * as d3 from 'd3'
import { useMapLegend, LegendControl, SampleTypeLegendControl, HorizontalLegend } from './map-legend'

interface DataPoint {
  value: number
  latitude?: number
  longitude?: number
  siteid: string
  fraction?: 'filtered' | 'unfiltered'
  [key: string]: any
}

interface WaterMapProps {
  data: DataPoint[]
  parameter: string
  units: string
}

export default function WaterMap({ data, parameter, units }: WaterMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markers = useRef<maplibregl.Marker[]>([])
  const legendControl = useRef<LegendControl | null>(null)
  const sampleTypeLegend = useRef<SampleTypeLegendControl | null>(null)
  const [basemap, setBasemap] = useState<'light' | 'dark'>('light')

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-light': {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors © CARTO',
          },
        },
        layers: [
          {
            id: 'carto-light-layer',
            type: 'raster',
            source: 'carto-light',
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [-112.41, 40.38], // Center of Utah (matching Shiny)
      zoom: 7,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-left')

    // Add legend controls (value legend first, then sample type on top)
    legendControl.current = new LegendControl()
    sampleTypeLegend.current = new SampleTypeLegendControl()
    map.current.addControl(legendControl.current, 'bottom-right')
    map.current.addControl(sampleTypeLegend.current, 'bottom-right')

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update basemap when toggled
  useEffect(() => {
    if (!map.current) return

    const style: StyleSpecification = {
      version: 8,
      sources: {
        'carto-basemap': {
          type: 'raster',
          tiles:
            basemap === 'light'
              ? ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png']
              : ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors © CARTO',
        },
      },
      layers: [
        {
          id: 'carto-basemap-layer',
          type: 'raster',
          source: 'carto-basemap',
          minzoom: 0,
          maxzoom: 22,
        },
      ],
    }

    map.current.setStyle(style)

    // Re-add markers after style change
    map.current.once('styledata', () => {
      // Markers will be re-added by the data effect
    })
  }, [basemap])

  // Update markers when data changes
  useEffect(() => {
    if (!map.current) return

    // Wait a bit if style is loading
    const addMarkers = () => {
      // Clear existing markers
      markers.current.forEach((marker) => marker.remove())
      markers.current = []

      // Filter data with valid coordinates
      const validData = data.filter((d) => d.latitude && d.longitude && !isNaN(d.latitude) && !isNaN(d.longitude))

      if (validData.length === 0) return

      // Color scale using plasma palette (reversed like Shiny)
      // In R, reverse=TRUE means high values get the start color (purple) and low values get the end color (yellow)
      const extent = d3.extent(validData, (d) => d.value)
      const minValue = extent[0] ?? 0
      const maxValue = extent[1] ?? 0
      const colorScale = d3.scaleSequential((t) => d3.interpolatePlasma(1 - t)).domain([minValue, maxValue])

      // Add markers
      validData.forEach((point) => {
        if (!map.current || !point.latitude || !point.longitude) return

        // Add slight jitter to points at same location (like R's jitter)
        const jitterAmount = 0.002
        const jitteredLat = point.latitude + (Math.random() - 0.5) * jitterAmount
        const jitteredLon = point.longitude + (Math.random() - 0.5) * jitterAmount

        // Create marker element
        const el = document.createElement('div')
        el.className = 'map-marker'
        el.style.backgroundColor = colorScale(point.value)
        el.style.width = '16px'
        el.style.height = '16px'
        el.style.borderRadius = '50%'
        el.style.cursor = 'pointer'

        // Outline color and weight based on fraction (matching Shiny exactly)
        if (point.fraction === 'filtered') {
          el.style.border = '3px solid #000000'
          el.style.opacity = '0.8'
        } else {
          el.style.border = '1px solid #7f7f7f'
          el.style.opacity = '0.8'
        }

        // Create popup
        const fractionText = point.fraction ? ` (${point.fraction})` : ''
        const popup = new maplibregl.Popup({ offset: 15 }).setHTML(`
          <div style="color: #1B1B1B; padding: 8px;">
            <strong>${parameter}</strong><br/>
            Value: ${point.value.toFixed(2)} ${units}${fractionText}<br/>
            Site: ${point.siteid}
          </div>
        `)

        // Add marker to map
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([jitteredLon, jitteredLat])
          .setPopup(popup)
          .addTo(map.current)

        markers.current.push(marker)
      })

      // Fit bounds to show all markers
      if (validData.length > 0 && map.current) {
        const bounds = new maplibregl.LngLatBounds()
        validData.forEach((point) => {
          if (point.latitude && point.longitude) {
            bounds.extend([point.longitude, point.latitude])
          }
        })
        map.current.fitBounds(bounds, { padding: 50 })
      }
    }

    // If map is loaded, add markers immediately, otherwise wait for load
    if (map.current.loaded()) {
      addMarkers()
    } else {
      map.current.once('load', addMarkers)
    }
  }, [data, parameter, units, basemap])

  // Build legend data using shared hook
  const validData = data.filter((d) => d.latitude && d.longitude && !isNaN(d.latitude) && !isNaN(d.longitude))
  const legendData = useMapLegend(validData)

  // Update legend control when data changes
  useEffect(() => {
    if (legendControl.current) {
      legendControl.current.update(parameter, units, legendData)
    }
  }, [parameter, units, legendData])

  return (
    <div className="flex flex-col">
      {/* Map wrapper */}
      <div className="relative">
        {/* Basemap toggle */}
        <div className="absolute bottom-2 left-2 z-10 bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => setBasemap('light')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              basemap === 'light' ? 'bg-primary text-black' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Light
          </button>
          <button
            onClick={() => setBasemap('dark')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              basemap === 'dark' ? 'bg-primary text-black' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Dark
          </button>
        </div>

        {/* Map container */}
        <div ref={mapContainer} style={{ height: '500px', width: '100%', borderRadius: '8px' }} />

        {/* Desktop legends are handled by MapLibre controls */}

        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <p className="text-muted-foreground">No data available for selected parameter</p>
          </div>
        )}
      </div>

      {/* Mobile Legends - below map */}
      {legendData && (
        <div className="lg:hidden flex flex-wrap gap-4 mt-4 p-4 bg-card border border-border rounded-lg">
          {/* Sample type legend */}
          <div className="text-sm">
            <div className="font-medium mb-2">Sample Type (Outline)</div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1" style={{ backgroundColor: '#000000' }} />
                <span className="text-muted-foreground">Filtered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1" style={{ backgroundColor: '#7f7f7f' }} />
                <span className="text-muted-foreground">Unfiltered</span>
              </div>
            </div>
          </div>

          {/* Value legend - horizontal for mobile */}
          <div className="flex-1 min-w-48">
            <HorizontalLegend parameter={parameter} units={units} legendData={legendData} />
          </div>
        </div>
      )}
    </div>
  )
}
