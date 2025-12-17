import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { getPuOrPalette, CHART_STYLES } from '../../utils/colors'
import { useTheme } from '../../context/theme-provider'
import { useContainerWidth } from '../../hooks/useContainerWidth'

interface DataPoint {
  value: number
  [key: string]: any
}

interface HistogramProps {
  data: DataPoint[]
  groupBy: string
  parameter: string
  units: string
  vlineValue?: number
  facetBy?: string
  facetLabels?: Record<string, string>
}

// Theme-aware chart colors
const CHART_COLORS = {
  dark: {
    text: '#e0e0e0',
    axis: '#e0e0e0',
    caption: '#999999',
    legendBg: 'rgba(40, 40, 40, 0.85)',
  },
  light: {
    text: '#333333',
    axis: '#555555',
    caption: '#666666',
    legendBg: 'rgba(255, 255, 255, 0.9)',
  },
}

export default function Histogram({
  data,
  groupBy,
  parameter,
  units,
  vlineValue,
  facetBy,
  facetLabels,
}: HistogramProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const containerWidth = useContainerWidth(containerRef)
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    content: string
  }>({ visible: false, x: 0, y: 0, content: '' })

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0 || containerWidth === 0) return

    // Get theme-aware colors based on current theme
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const colors = isDark ? CHART_COLORS.dark : CHART_COLORS.light
    const chartText = colors.text
    const chartAxis = colors.axis
    const chartCaption = colors.caption
    const legendBg = colors.legendBg

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove()

    const containerHeight = facetBy ? 450 : 400

    // Determine facets
    const facets = facetBy
      ? Array.from(new Set(data.map((d) => String(d[facetBy])))).sort()
      : [null]
    const numFacets = facets.length

    // Dimensions - adjust for faceting (reduced right margin since legend is inside)
    const margin = { top: 30, right: 30, bottom: 60, left: 80 }
    const totalWidth = containerWidth - margin.left - margin.right
    const facetWidth = numFacets > 1 ? (totalWidth - 20 * (numFacets - 1)) / numFacets : totalWidth
    const height = containerHeight - margin.top - margin.bottom

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Get groups and prepare data - show all groups (matching R Shiny app)
    const groupCounts: Record<string, number> = {}
    data.forEach((d) => {
      const group = String(d[groupBy] ?? 'Unknown')
      groupCounts[group] = (groupCounts[group] || 0) + 1
    })

    // Get all groups sorted alphabetically (matching R's ggplot2 default)
    const groups = Object.entries(groupCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([group]) => group)

    // Color scale - PuOr palette from ColorBrewer (matching R's scale_fill_brewer)
    // Use the appropriate palette size based on number of groups
    const palette = getPuOrPalette(groups.length)
    const colorScale = d3.scaleOrdinal<string>().domain(groups).range(palette)

    // Create value scale (will be Y axis after flip) - use same scale for all facets
    const [yMin = 0, yMax = 0] = d3.extent(data, (d) => d.value)
    const yScale = d3.scaleLinear().domain([yMin, yMax]).nice().range([height, 0])

    // Draw each facet
    facets.forEach((facet, facetIndex) => {
      const facetData = facetBy ? data.filter((d) => d[facetBy] === facet) : data
      const xOffset = facetIndex * (facetWidth + 20)

      // Create facet group
      const facetGroup = svg.append('g').attr('transform', `translate(${xOffset}, 0)`)

      // Add facet title if faceting
      if (facetBy && facet) {
        const label = facetLabels?.[facet] || facet
        facetGroup
          .append('text')
          .attr('x', facetWidth / 2)
          .attr('y', -10)
          .attr('text-anchor', 'middle')
          .attr('fill', chartText)
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .text(label)
      }

      // Create exactly 10 bins (matching ggplot2's bins = 10)
      // D3's .thresholds(10) is just a suggestion, so we compute exact boundaries
      const binCount = 10
      const binWidth = (yMax - yMin) / binCount
      const binThresholds = d3.range(yMin, yMax, binWidth)

      const histogram = d3
        .histogram<DataPoint, number>()
        .value((d) => d.value)
        .domain([yMin, yMax])
        .thresholds(binThresholds)

      // Create bins for each group within this facet
      const groupedData = groups.map((group) => ({
        group,
        bins: histogram(facetData.filter((d) => String(d[groupBy]) === group)),
      }))

      // For stacked histogram, calculate the max total count across all bins
      const allBinRanges =
        groupedData[0]?.bins.map((_, i) => groupedData.reduce((sum, g) => sum + (g.bins[i]?.length || 0), 0)) || []
      const maxStackedCount = d3.max(allBinRanges) || 1

      // X scale (frequency) - flipped to horizontal
      const xScale = d3.scaleLinear().domain([0, maxStackedCount]).range([0, facetWidth])

      // Y axis (values) - only on first facet
      if (facetIndex === 0) {
        const yAxis = d3.axisLeft(yScale).tickFormat((d) => d3.format(',')(Number(d)))
        const yAxisGroup = facetGroup.append('g').attr('class', 'y-axis').call(yAxis)

        yAxisGroup.selectAll('.tick text').attr('fill', chartText).attr('font-size', '11px')
        yAxisGroup.selectAll('.domain').attr('stroke', chartAxis)
        yAxisGroup.selectAll('.tick line').attr('stroke', chartAxis)
      }

      // X axis (frequency)
      const xAxis = d3.axisBottom(xScale).ticks(5)
      const xAxisGroup = facetGroup.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${height})`).call(xAxis)

      xAxisGroup.selectAll('.tick text').attr('fill', chartText).attr('font-size', '11px')
      xAxisGroup.selectAll('.domain').attr('stroke', chartAxis)
      xAxisGroup.selectAll('.tick line').attr('stroke', chartAxis)

      // Create stacked horizontal bars
      // Reverse the stacking order to match R's ggplot2 behavior (last group stacks first/leftmost)
      if (groupedData[0]?.bins) {
        groupedData[0].bins.forEach((_, binIndex) => {
          let barXOffset = 0

          ;[...groupedData].reverse().forEach((groupData) => {
            const binData = groupData.bins[binIndex]
            if (!binData || binData.length === 0) return

            const barWidth = xScale(binData.length)
            const y0 = yScale(binData.x1 || 0)
            const y1 = yScale(binData.x0 || 0)

            const binRange = `${binData.x0?.toFixed(1)} - ${binData.x1?.toFixed(1)}`

            facetGroup
              .append('rect')
              .attr('x', barXOffset)
              .attr('y', y0)
              .attr('width', barWidth)
              .attr('height', y1 - y0)
              .attr('fill', colorScale(groupData.group))
              .attr('stroke', CHART_STYLES.histogram.strokeColor)
              .attr('stroke-width', CHART_STYLES.histogram.strokeWidth)
              .attr('opacity', CHART_STYLES.histogram.opacity)
              .style('cursor', 'pointer')
              .on('mouseover', function (event) {
                d3.select(this).attr('opacity', 1).attr('stroke', '#fff').attr('stroke-width', 2)
                setTooltip({
                  visible: true,
                  x: event.clientX + 10,
                  y: event.clientY - 10,
                  content: `<strong>${groupData.group}</strong><br/>${parameter}: ${binRange} ${units}<br/>Count: ${binData.length}`,
                })
              })
              .on('mousemove', function (event) {
                setTooltip((prev) => ({ ...prev, x: event.clientX + 10, y: event.clientY - 10 }))
              })
              .on('mouseout', function () {
                d3.select(this)
                  .attr('opacity', CHART_STYLES.histogram.opacity)
                  .attr('stroke', CHART_STYLES.histogram.strokeColor)
                  .attr('stroke-width', CHART_STYLES.histogram.strokeWidth)
                setTooltip((prev) => ({ ...prev, visible: false }))
              })

            barXOffset += barWidth
          })
        })
      }

      // Add reference line if provided (horizontal now, since axes are flipped)
      if (vlineValue !== undefined && !isNaN(vlineValue)) {
        facetGroup
          .append('line')
          .attr('x1', 0)
          .attr('x2', facetWidth)
          .attr('y1', yScale(vlineValue))
          .attr('y2', yScale(vlineValue))
          .attr('stroke', '#FFFFFF')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5')
      }
    })

    // X-axis label (Frequency - since flipped)
    svg
      .append('text')
      .attr('x', totalWidth / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .attr('fill', chartText)
      .attr('font-size', '12px')
      .text('Frequency')

    // Y-axis label (Parameter - since flipped)
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -60)
      .attr('text-anchor', 'middle')
      .attr('fill', chartText)
      .attr('font-size', '12px')
      .text(`${parameter} (${units})`)

    // Legend (inside plot area, matching R's legend.position.inside = c(0.7, 0.8))
    // c(0.7, 0.8) means 70% from left, 80% from bottom (i.e., top-right inside)
    const legendX = totalWidth * 0.55
    const legendY = height * 0.05
    const legend = svg
      .append('g')
      .attr('transform', `translate(${legendX}, ${legendY})`)
      .attr('class', 'legend')

    // Add semi-transparent background for legend
    const legendBgRect = legend.append('rect')
      .attr('fill', legendBg)
      .attr('rx', 4)
      .attr('ry', 4)

    groups.forEach((group, i) => {
      const legendRow = legend.append('g').attr('transform', `translate(5, ${i * 18 + 5})`)

      legendRow.append('rect').attr('width', 10).attr('height', 10).attr('fill', colorScale(group)).attr('opacity', 0.8)

      legendRow
        .append('text')
        .attr('x', 15)
        .attr('y', 9)
        .attr('fill', chartText)
        .attr('font-size', '10px')
        .text(group)
    })

    // Size the legend background to fit content
    const legendBBox = legend.node()?.getBBox()
    if (legendBBox) {
      legendBgRect
        .attr('x', legendBBox.x - 3)
        .attr('y', legendBBox.y - 3)
        .attr('width', legendBBox.width + 6)
        .attr('height', legendBBox.height + 6)
    }

    // Caption
    svg
      .append('text')
      .attr('x', totalWidth / 2)
      .attr('y', height + margin.bottom - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', chartCaption)
      .attr('font-size', '10px')
      .style('max-width', '400px')
      .text(`Distribution of ${parameter} observations shaded by ${groupBy}`)
  }, [data, groupBy, parameter, units, vlineValue, facetBy, facetLabels, theme, containerWidth])

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <svg ref={svgRef}></svg>
      {tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            pointerEvents: 'none',
            zIndex: 99999,
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            border: '1px solid #444',
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  )
}
