import { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import * as d3 from 'd3'
import { useMapLegend, VerticalLegend, HorizontalLegend } from './map-legend'

interface DataPoint {
  siteid: string
  value: number
  latitude?: number
  longitude?: number
  [key: string]: any
}

interface SoilMapProps {
  data: DataPoint[]
  parameter: string
  units: string
}

export default function SoilMap({ data, parameter, units }: SoilMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [basemap, setBasemap] = useState<'light' | 'dark'>('light')

  const basemapUrls = {
    light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  }

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: basemapUrls[basemap],
      center: [-112.41, 40.38],
      zoom: 7,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-left')

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update basemap
  useEffect(() => {
    if (!map.current) return
    map.current.setStyle(basemapUrls[basemap])
  }, [basemap])

  // Update markers when data changes
  useEffect(() => {
    if (!map.current) return

    const addMarkers = () => {
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      const validData = data.filter((d) => d.latitude && d.longitude && !isNaN(d.latitude) && !isNaN(d.longitude))

      if (validData.length === 0) return

      // Create color scale
      const extent = d3.extent(validData, (d) => d.value)
      const minValue = extent[0] ?? 0
      const maxValue = extent[1] ?? 0
      const colorScale = d3.scaleSequential((t) => d3.interpolatePlasma(1 - t)).domain([minValue, maxValue])

      // Add markers
      validData.forEach((point) => {
        const el = document.createElement('div')
        el.style.width = '14px'
        el.style.height = '14px'
        el.style.borderRadius = '50%'
        el.style.backgroundColor = colorScale(point.value)
        el.style.border = '1px solid #7f7f7f'
        el.style.opacity = '0.8'
        el.style.cursor = 'pointer'

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([point.longitude!, point.latitude!])
          .setPopup(
            new maplibregl.Popup({ offset: 10 }).setHTML(
              `<div style="color: #333; padding: 4px;">
                <strong>${point.siteid}</strong><br/>
                ${point.value.toFixed(2)} ${units}
              </div>`,
            ),
          )
          .addTo(map.current!)

        markersRef.current.push(marker)
      })
    }

    if (map.current.isStyleLoaded()) {
      addMarkers()
    } else {
      map.current.once('load', addMarkers)
    }
  }, [data, parameter, units, basemap])

  // Build legend data using shared hook
  const validData = data.filter((d) => d.latitude && d.longitude && !isNaN(d.latitude) && !isNaN(d.longitude))
  const legendData = useMapLegend(validData)

  return (
    <div className="flex flex-col">
      {/* Map wrapper */}
      <div className="relative">
        {/* Basemap toggle */}
        <div className="absolute bottom-2 left-2 z-10 bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => setBasemap('light')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              basemap === 'light' ? 'bg-ugs-gold text-black' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Light
          </button>
          <button
            onClick={() => setBasemap('dark')}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              basemap === 'dark' ? 'bg-ugs-gold text-black' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Dark
          </button>
        </div>

        {/* Map container */}
        <div ref={mapContainer} style={{ height: '500px', width: '100%', borderRadius: '8px' }} />

        {/* Desktop Legend - inside map */}
        {legendData && (
          <div className="hidden lg:block absolute bottom-4 right-4">
            <VerticalLegend parameter={parameter} units={units} legendData={legendData} />
          </div>
        )}

        {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <p className="text-muted-foreground">No data available for selected parameter</p>
          </div>
        )}
      </div>

      {/* Mobile Legend - below map */}
      {legendData && (
        <div className="lg:hidden mt-4 p-4 bg-card border border-border rounded-lg">
          <HorizontalLegend parameter={parameter} units={units} legendData={legendData} />
        </div>
      )}
    </div>
  )
}
