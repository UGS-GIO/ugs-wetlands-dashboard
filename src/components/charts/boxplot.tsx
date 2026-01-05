import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { getPuOrPalette, CHART_STYLES } from '../../utils/colors'
import { useTheme } from '../../context/theme-provider'
import { useContainerWidth } from '../../hooks/useContainerWidth'

// Theme-aware chart colors
const CHART_COLORS = {
  dark: {
    text: '#e0e0e0',
    axis: '#e0e0e0',
    caption: '#999999',
  },
  light: {
    text: '#333333',
    axis: '#555555',
    caption: '#666666',
  },
}

interface DataPoint {
  value: number
  [key: string]: any
}

interface BoxplotProps {
  data: DataPoint[]
  groupBy: string
  parameter: string
  units: string
  hlineValue?: number
}

export default function Boxplot({ data, groupBy, parameter, units, hlineValue }: BoxplotProps) {
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

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove()

    const containerHeight = 490

    // Dimensions
    const margin = { top: 30, right: 30, bottom: 100, left: 80 }
    const width = containerWidth - margin.left - margin.right
    const height = containerHeight - margin.top - margin.bottom

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
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

    // Calculate quartiles for each group
    const groupStats = groups.map((group) => {
      const values = data.filter((d) => String(d[groupBy]) === group).map((d) => d.value)
      const sorted = values.sort(d3.ascending)
      const q1 = d3.quantile(sorted, 0.25) || 0
      const median = d3.quantile(sorted, 0.5) || 0
      const q3 = d3.quantile(sorted, 0.75) || 0
      const iqr = q3 - q1
      const min = d3.min(sorted.filter((v) => v >= q1 - 1.5 * iqr)) || 0
      const max = d3.max(sorted.filter((v) => v <= q3 + 1.5 * iqr)) || 0
      const outliers = sorted.filter((v) => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr)

      return { group, q1, median, q3, min, max, outliers, values }
    })

    // X scale (groups)
    const x = d3.scaleBand().domain(groups).range([0, width]).padding(0.3)

    // Y scale (values) - use data extent to match histogram behavior
    const [yMin = 0, yMax = 0] = d3.extent(data, (d) => d.value)
    const y = d3.scaleLinear().domain([yMin, yMax]).nice().range([height, 0])

    // X axis
    const xAxis = d3.axisBottom(x)

    const xAxisGroup = svg.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${height})`).call(xAxis)

    // Wrap text labels
    const wrapWidth = x.bandwidth()
    xAxisGroup.selectAll('.tick text').each(function () {
      const text = d3.select(this)
      const words = text.text().split(/[\s-]+/)
      const lineHeight = 1.1
      const y = text.attr('y')
      const dy = parseFloat(text.attr('dy')) || 0

      text.text(null)
      let line: string[] = []
      let lineNumber = 0
      let tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', `${dy}em`)

      words.forEach((word) => {
        line.push(word)
        tspan.text(line.join(' '))
        if ((tspan.node()?.getComputedTextLength() || 0) > wrapWidth && line.length > 1) {
          line.pop()
          tspan.text(line.join(' '))
          line = [word]
          lineNumber++
          tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', `${lineNumber * lineHeight + dy}em`).text(word)
        }
      })
    })

    xAxisGroup
      .selectAll('.tick text, .tick tspan')
      .style('text-anchor', 'middle')
      .attr('fill', chartText)
      .attr('font-size', '13px')

    // Add spacing between tick marks and labels
    xAxisGroup.selectAll('.tick text').attr('transform', 'translate(0, 8)')

    xAxisGroup.selectAll('.domain').attr('stroke', chartAxis)
    xAxisGroup.selectAll('.tick line').attr('stroke', chartAxis)

    // Y axis
    const yAxis = d3.axisLeft(y).tickFormat((d) => d3.format(',')(Number(d)))

    const yAxisGroup = svg.append('g').attr('class', 'y-axis').call(yAxis)

    yAxisGroup.selectAll('.tick text').attr('fill', chartText).attr('font-size', '12px')

    yAxisGroup.selectAll('.domain').attr('stroke', chartAxis)
    yAxisGroup.selectAll('.tick line').attr('stroke', chartAxis)

    // Draw boxplots
    groupStats.forEach((stat) => {
      const xPos = x(stat.group) || 0
      const boxWidth = x.bandwidth()

      // Box
      svg
        .append('rect')
        .attr('x', xPos)
        .attr('y', y(stat.q3))
        .attr('width', boxWidth)
        .attr('height', y(stat.q1) - y(stat.q3))
        .attr('fill', colorScale(stat.group))
        .attr('stroke', CHART_STYLES.boxplot.strokeColor)
        .attr('stroke-width', CHART_STYLES.boxplot.strokeWidth)
        .attr('opacity', CHART_STYLES.boxplot.opacity)
        .style('cursor', 'pointer')
        .on('mouseover', function (event) {
          d3.select(this).attr('opacity', 1).attr('stroke', '#fff').attr('stroke-width', 2)
          setTooltip({
            visible: true,
            x: event.clientX + 10,
            y: event.clientY - 10,
            content:
              `<strong>${stat.group}</strong><br/>` +
              `n = ${stat.values.length}<br/>` +
              `Min: ${stat.min.toFixed(2)} ${units}<br/>` +
              `Q1: ${stat.q1.toFixed(2)} ${units}<br/>` +
              `Median: ${stat.median.toFixed(2)} ${units}<br/>` +
              `Q3: ${stat.q3.toFixed(2)} ${units}<br/>` +
              `Max: ${stat.max.toFixed(2)} ${units}`,
          })
        })
        .on('mousemove', function (event) {
          setTooltip((prev) => ({ ...prev, x: event.clientX + 10, y: event.clientY - 10 }))
        })
        .on('mouseout', function () {
          d3.select(this)
            .attr('opacity', CHART_STYLES.boxplot.opacity)
            .attr('stroke', CHART_STYLES.boxplot.strokeColor)
            .attr('stroke-width', CHART_STYLES.boxplot.strokeWidth)
          setTooltip((prev) => ({ ...prev, visible: false }))
        })

      // Median line
      svg
        .append('line')
        .attr('x1', xPos)
        .attr('x2', xPos + boxWidth)
        .attr('y1', y(stat.median))
        .attr('y2', y(stat.median))
        .attr('stroke', CHART_STYLES.boxplot.strokeColor)
        .attr('stroke-width', 2)

      // Whisker lines
      svg
        .append('line')
        .attr('x1', xPos + boxWidth / 2)
        .attr('x2', xPos + boxWidth / 2)
        .attr('y1', y(stat.min))
        .attr('y2', y(stat.q1))
        .attr('stroke', CHART_STYLES.boxplot.strokeColor)
        .attr('stroke-width', CHART_STYLES.boxplot.strokeWidth)

      svg
        .append('line')
        .attr('x1', xPos + boxWidth / 2)
        .attr('x2', xPos + boxWidth / 2)
        .attr('y1', y(stat.q3))
        .attr('y2', y(stat.max))
        .attr('stroke', CHART_STYLES.boxplot.strokeColor)
        .attr('stroke-width', CHART_STYLES.boxplot.strokeWidth)

      // Min/Max caps
      svg
        .append('line')
        .attr('x1', xPos + boxWidth * 0.25)
        .attr('x2', xPos + boxWidth * 0.75)
        .attr('y1', y(stat.min))
        .attr('y2', y(stat.min))
        .attr('stroke', CHART_STYLES.boxplot.strokeColor)
        .attr('stroke-width', CHART_STYLES.boxplot.strokeWidth)

      svg
        .append('line')
        .attr('x1', xPos + boxWidth * 0.25)
        .attr('x2', xPos + boxWidth * 0.75)
        .attr('y1', y(stat.max))
        .attr('y2', y(stat.max))
        .attr('stroke', CHART_STYLES.boxplot.strokeColor)
        .attr('stroke-width', CHART_STYLES.boxplot.strokeWidth)

      // Jittered points
      const jitterWidth = boxWidth * 0.1
      stat.values.forEach((value) => {
        const jitter = (Math.random() - 0.5) * jitterWidth
        svg
          .append('circle')
          .attr('cx', xPos + boxWidth / 2 + jitter)
          .attr('cy', y(value))
          .attr('r', 1.5)
          .attr('fill', CHART_STYLES.boxplot.jitterColor)
          .attr('opacity', CHART_STYLES.boxplot.jitterAlpha)
      })

      // Outliers (different styling)
      stat.outliers.forEach((value) => {
        const jitter = (Math.random() - 0.5) * jitterWidth
        svg
          .append('circle')
          .attr('cx', xPos + boxWidth / 2 + jitter)
          .attr('cy', y(value))
          .attr('r', 3)
          .attr('fill', 'none')
          .attr('stroke', CHART_STYLES.boxplot.jitterColor)
          .attr('stroke-width', CHART_STYLES.boxplot.strokeWidth)
          .attr('opacity', CHART_STYLES.boxplot.jitterAlpha)
      })
    })

    // Add reference line if provided
    if (hlineValue !== undefined && !isNaN(hlineValue)) {
      svg
        .append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', y(hlineValue))
        .attr('y2', y(hlineValue))
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
    }

    // Y-axis label
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -65)
      .attr('text-anchor', 'middle')
      .attr('fill', chartText)
      .attr('font-size', '13px')
      .text(`${parameter} (${units})`)

    // Caption
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', chartCaption)
      .attr('font-size', '12px')
      .text(`Boxplot (25-75th percentile) of ${parameter} across ${groupBy}s`)
  }, [data, groupBy, parameter, units, hlineValue, theme, containerWidth])

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
