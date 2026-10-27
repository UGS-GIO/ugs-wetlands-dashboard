import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import * as d3 from 'd3'
import { buildMapLegend, LegendControl, HorizontalLegend } from './map-legend'
import { BasemapSelector } from './basemap-selector'
import { buildBasemapStyle, getBasemap, DEFAULT_BASEMAP } from '@/lib/basemaps'

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
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const legendControl = useRef<LegendControl | null>(null)
  const [basemap, setBasemap] = useState<string>(DEFAULT_BASEMAP.id)

  // Initialize map when the container mounts, tear it down when it unmounts
  const mapContainer = useCallback((container: HTMLDivElement | null) => {
    if (!container) return

    map.current = new maplibregl.Map({
      container,
      style: buildBasemapStyle(DEFAULT_BASEMAP),
      center: [-112.41, 40.38],
      zoom: 7,
      minZoom: 5,
      cooperativeGestures: true,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-left')

    // Add legend control
    legendControl.current = new LegendControl()
    map.current.addControl(legendControl.current, 'bottom-right')

    return () => {
      map.current?.remove()
      map.current = null
      legendControl.current = null
    }
  }, [])

  // Markers are DOM overlays, so they survive style swaps and don't need re-adding
  const changeBasemap = (basemapId: string) => {
    setBasemap(basemapId)
    map.current?.setStyle(buildBasemapStyle(getBasemap(basemapId)))
  }

  const validData = useMemo(
    () => data.filter((d) => d.latitude && d.longitude && !isNaN(d.latitude) && !isNaN(d.longitude)),
    [data],
  )
  const legendData = useMemo(() => buildMapLegend(validData), [validData])

  // Sync markers and legend control with the current data
  useEffect(() => {
    if (!map.current) return

    const addMarkers = () => {
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

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

    legendControl.current?.update(parameter, units, legendData)

    if (map.current.loaded()) {
      addMarkers()
    } else {
      map.current.once('load', addMarkers)
      return () => {
        map.current?.off('load', addMarkers)
      }
    }
  }, [validData, parameter, units, legendData])

  return (
    <div className="flex flex-col">
      {/* Map wrapper */}
      <div className="relative">
        {/* Basemap toggle (top-right on phones so it clears the attribution) */}
        <BasemapSelector
          activeBasemap={basemap}
          onBasemapChange={changeBasemap}
          className="absolute top-2 right-2 sm:top-auto sm:right-auto sm:bottom-2 sm:left-2 z-10"
        />

        {/* Map container */}
        <div ref={mapContainer} style={{ height: '500px', width: '100%', borderRadius: '8px' }} />

        {/* Desktop legend is handled by MapLibre control */}

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
