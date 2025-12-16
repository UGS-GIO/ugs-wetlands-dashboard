import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { BRBG_11, CHART_STYLES } from '../../utils/colors'
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

interface CommunityData {
  siteid: string
  parameter: string
  group: string
  rel_abnd: number
  ecoregion?: string
  Watershed?: string
  'Wetland Type'?: string
}

interface CommunityPlotProps {
  data: CommunityData[]
  groupBy: string
  metric: string
}

export default function CommunityPlot({ data, groupBy, metric }: CommunityPlotProps) {
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

    // Get container dimensions (containerWidth comes from useContainerWidth hook)
    const containerHeight = 450

    // Dimensions
    const margin = { top: 20, right: 150, bottom: 100, left: 80 }
    const width = containerWidth - margin.left - margin.right
    const height = containerHeight - margin.top - margin.bottom

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Get unique groups (subpopulations) and community groups
    const subpopCounts: Record<string, number> = {}
    data.forEach((d) => {
      const key = groupBy === 'ecoregion' ? d.ecoregion
        : groupBy === 'Watershed' ? d.Watershed
        : d['Wetland Type']
      const subpop = String(key ?? 'Unknown')
      subpopCounts[subpop] = (subpopCounts[subpop] || 0) + 1
    })

    // Get all subpopulations sorted alphabetically (matching R's ggplot2 default)
    const subpops = Object.entries(subpopCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([subpop]) => subpop)

    // Get all unique community groups
    const communityGroups = Array.from(new Set(data.map((d) => d.group)))

    // Calculate mean relative abundance for each subpop and community group
    const aggregatedData: Record<string, Record<string, number>> = {}

    subpops.forEach((subpop) => {
      aggregatedData[subpop] = {}
      communityGroups.forEach((group) => {
        const values = data.filter((d) => {
          const key = groupBy === 'ecoregion' ? d.ecoregion
            : groupBy === 'Watershed' ? d.Watershed
            : d['Wetland Type']
          return String(key) === subpop && d.group === group
        })
        if (values.length > 0) {
          const mean = values.reduce((sum, d) => sum + d.rel_abnd, 0) / values.length
          aggregatedData[subpop][group] = mean
        } else {
          aggregatedData[subpop][group] = 0
        }
      })
    })

    // Sort community groups alphabetically (matching R's ggplot2 default)
    const sortedCommunityGroups = [...communityGroups].sort((a, b) => a.localeCompare(b))

    // Create stack data
    const stackData = subpops.map((subpop) => {
      const row: Record<string, any> = { subpop }
      sortedCommunityGroups.forEach((group) => {
        row[group] = aggregatedData[subpop][group] || 0
      })
      return row
    })

    // Create stack generator
    const stack = d3.stack<any>().keys(sortedCommunityGroups)
    const series = stack(stackData)

    // X scale
    const x = d3.scaleBand().domain(subpops).range([0, width]).padding(0.2)

    // Y scale
    const y = d3.scaleLinear().domain([0, 100]).range([height, 0])

    // Color scale - BrBG 11-class palette from ColorBrewer (matching R's scale_fill_brewer)
    const colorScale = d3.scaleOrdinal<string>().domain(sortedCommunityGroups).range(BRBG_11)

    // Draw stacked bars with hover functionality
    series.forEach((seriesData) => {
      const groupName = seriesData.key

      svg
        .selectAll(`rect.bar-${groupName.replace(/\s+/g, '-')}`)
        .data(seriesData)
        .join('rect')
        .attr('class', `bar-${groupName.replace(/\s+/g, '-')}`)
        .attr('x', (d) => x(d.data.subpop) || 0)
        .attr('y', (d) => y(d[1]))
        .attr('height', (d) => y(d[0]) - y(d[1]))
        .attr('width', x.bandwidth())
        .attr('fill', colorScale(groupName))
        .attr('stroke', CHART_STYLES.communityPlot.strokeColor)
        .attr('stroke-width', CHART_STYLES.communityPlot.strokeWidth)
        .style('cursor', 'pointer')
        .on('mouseover', function (event, d) {
          d3.select(this).attr('opacity', 0.8).attr('stroke', '#fff').attr('stroke-width', 2)
          const value = (d[1] - d[0]).toFixed(1)
          setTooltip({
            visible: true,
            x: event.clientX + 10,
            y: event.clientY - 10,
            content: `<strong>${d.data.subpop}</strong><br/>${groupName}: ${value}%`,
          })
        })
        .on('mousemove', function (event) {
          setTooltip((prev) => ({ ...prev, x: event.clientX + 10, y: event.clientY - 10 }))
        })
        .on('mouseout', function () {
          d3.select(this)
            .attr('opacity', 1)
            .attr('stroke', CHART_STYLES.communityPlot.strokeColor)
            .attr('stroke-width', CHART_STYLES.communityPlot.strokeWidth)
          setTooltip((prev) => ({ ...prev, visible: false }))
        })
    })

    // X axis
    const xAxis = d3.axisBottom(x)
    const xAxisGroup = svg.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${height})`).call(xAxis)

    // Wrap text labels
    const wrapWidth = x.bandwidth()
    xAxisGroup.selectAll('.tick text').each(function () {
      const text = d3.select(this)
      const words = text.text().split(/[\s-]+/)
      const lineHeight = 1.1
      const yPos = text.attr('y')
      const dy = parseFloat(text.attr('dy')) || 0

      text.text(null)
      let line: string[] = []
      let lineNumber = 0
      let tspan = text.append('tspan').attr('x', 0).attr('y', yPos).attr('dy', `${dy}em`)

      words.forEach((word) => {
        line.push(word)
        tspan.text(line.join(' '))
        if ((tspan.node()?.getComputedTextLength() || 0) > wrapWidth && line.length > 1) {
          line.pop()
          tspan.text(line.join(' '))
          line = [word]
          lineNumber++
          tspan = text.append('tspan').attr('x', 0).attr('y', yPos).attr('dy', `${lineNumber * lineHeight + dy}em`).text(word)
        }
      })
    })

    xAxisGroup
      .selectAll('.tick text, .tick tspan')
      .style('text-anchor', 'middle')
      .attr('fill', chartText)
      .attr('font-size', '11px')

    xAxisGroup.selectAll('.domain').attr('stroke', chartAxis)
    xAxisGroup.selectAll('.tick line').attr('stroke', chartAxis)

    // Y axis
    const yAxis = d3.axisLeft(y).tickFormat((d) => `${d}%`)
    const yAxisGroup = svg.append('g').attr('class', 'y-axis').call(yAxis)

    yAxisGroup.selectAll('.tick text').attr('fill', chartText).attr('font-size', '11px')
    yAxisGroup.selectAll('.domain').attr('stroke', chartAxis)
    yAxisGroup.selectAll('.tick line').attr('stroke', chartAxis)

    // Y-axis label
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -60)
      .attr('text-anchor', 'middle')
      .attr('fill', chartText)
      .attr('font-size', '12px')
      .text('Relative Abundance (%)')

    // Legend
    const legend = svg
      .append('g')
      .attr('transform', `translate(${width + 10}, 0)`)
      .attr('class', 'legend')

    sortedCommunityGroups.forEach((group, i) => {
      const legendRow = legend.append('g').attr('transform', `translate(0, ${i * 22})`)

      legendRow.append('rect').attr('width', 14).attr('height', 14).attr('fill', colorScale(group))

      legendRow
        .append('text')
        .attr('x', 20)
        .attr('y', 11)
        .attr('fill', chartText)
        .attr('font-size', '10px')
        .text(group.length > 18 ? group.substring(0, 18) + '...' : group)
    })

    // Caption
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 10)
      .attr('text-anchor', 'middle')
      .attr('fill', chartCaption)
      .attr('font-size', '10px')
      .text(`Mean relative abundance of ${metric.toLowerCase()} across ${groupBy}`)
  }, [data, groupBy, metric, theme, containerWidth])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No community data available for the selected parameters
      </div>
    )
  }

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
