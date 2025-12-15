import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import Histogram from '../components/charts/histogram'
import Boxplot from '../components/charts/boxplot'
import SoilMap from '../components/maps/soil-map'
import CommunityPlot from '../components/charts/community-plot'
import DisclaimerModal from '../components/disclaimer-modal'
import { Button } from '../components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Checkbox } from '../components/ui/checkbox'
import {
  invertRecordsQueryOptions,
  invertTaxaQueryOptions,
  siteAttributesQueryOptions,
  flagsQueryOptions,
} from '../utils/queries'
import { downloadCSV } from '../utils/api'
import { transformInvertData } from '../utils/transformers'
import type { InvertMetric } from '../types'
import { GROUPING_OPTIONS, type GroupingKey } from '../types'

const PARAMETER_OPTIONS = {
  abundance: 'Abundance',
  richness: 'Taxa Richness',
  eto_rel: 'ETO Relative Richness',
}

const COMMUNITY_OPTIONS = {
  feed_grp: 'Feeding Group',
  bug_type: 'Invertebrate Type',
  arthropod: 'Arthropod Order',
}

const PARAMETER_DESCRIPTIONS: Record<string, string> = {
  abundance: `<strong>Abundance</strong> is the total number of macroinvertebrates of any group found in a sample taken by sweeping a net at the soil/water interface. Healthy wetlands have macroinvertebrate communities that are both abundant and diverse.`,
  richness: `<strong>Taxa Richness</strong> is the number of unique macroinvertebrate taxa (types) found in a sample. More diverse communities indicate healthier wetlands with varied microhabitats.`,
  eto_rel: `<strong>ETO Relative Richness</strong> is the proportion of the total measure of abundance that is composed of three orders of insects: Ephemeroptera (mayflies), Tricoptera (caddisflies), and Odonata (dragon- and damselflies). These orders are especially sensitive to disturbances like changes in water quality. Samples with a majority of ETO taxa are indicators of low disturbance and healthier wetlands.`,
}

const PARAMETER_UNITS: Record<string, string> = {
  abundance: '#',
  richness: '#',
  eto_rel: '%',
}

export const Route = createFileRoute('/macroinvertebrates')({
  component: Macroinvertebrates,
})

function Macroinvertebrates() {
  const { data: invertsData } = useSuspenseQuery(invertRecordsQueryOptions)
  const { data: taxonData } = useSuspenseQuery(invertTaxaQueryOptions)
  const { data: sitesData } = useSuspenseQuery(siteAttributesQueryOptions)
  const { data: flagsData } = useSuspenseQuery(flagsQueryOptions)

  const { invertMetrics, communityData } = useMemo(
    () => transformInvertData(invertsData, taxonData, sitesData, flagsData),
    [invertsData, taxonData, sitesData, flagsData]
  )

  const [parameter, setParameter] = useState<keyof typeof PARAMETER_OPTIONS>('abundance')
  const [grouping, setGrouping] = useState<GroupingKey>('Watershed')
  const [communityParam, setCommunityParam] = useState<keyof typeof COMMUNITY_OPTIONS>('feed_grp')
  const [communityGrouping, setCommunityGrouping] = useState<GroupingKey>('Watershed')
  const [downloadMetrics, setDownloadMetrics] = useState<(keyof typeof PARAMETER_OPTIONS)[]>(['abundance'])
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  // Filter data based on selected parameter
  const filteredData = invertMetrics.filter((d) => d.parameter === parameter)

  // Filter community data
  const filteredCommunityData = communityData.filter((d) => d.parameter === communityParam)

  const description = PARAMETER_DESCRIPTIONS[parameter]

  return (
    <div className="px-4 md:px-8 pt-2">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-2xl font-bold mb-4">Macroinvertebrates</h2>

          <p className="text-base mb-4">
            Macroinvertebrates are animals without backbones that spend at least part of their lives in water.
            Macroinvertebrates include dragonflies, snails, worms, crustaceans, beetles, and many more. Most
            macroinvertebrates spend their entire larval stage in water and then undergo a dramatic metamorphosis to
            become flying adult insects. Macroinvertebrate communities are indicators of wetland condition because
            different macroinvertebrate groups have unique tolerances to disturbance.
          </p>

          <p className="text-base mb-4">
            <strong>Explore the data</strong> using the drop-down menus to change the data topics and metrics to change
            the maps and charts below.
          </p>

          <p className="text-base">
            Data notes. Macroinvertebrate data was collected using standardized sampling methods. Taxa were identified
            to the lowest practical taxonomic level.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center">
          <img
            src="/images/damselfly_moab.jpg"
            alt="An adult damselfly rests on wetland vegetation near Moab"
            className="w-full h-auto max-h-96 object-cover rounded-xl shadow-lg"
          />
          <p className="text-center text-muted-foreground mt-2 text-sm italic">
            An adult damselfly rests on wetland vegetation near Moab
          </p>
        </div>
      </div>

      {/* Dropdowns and Description Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Dropdowns Card */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Macroinvertebrate Metric</label>
              <Select
                value={parameter}
                onValueChange={(value) => setParameter(value as keyof typeof PARAMETER_OPTIONS)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARAMETER_OPTIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Grouping</label>
              <Select
                value={grouping}
                onValueChange={(value) => setGrouping(value as keyof typeof GROUPING_OPTIONS)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GROUPING_OPTIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Parameter Description Card */}
        {description && (
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
            <h3 className="text-xl font-bold text-primary mb-2">{PARAMETER_OPTIONS[parameter]}</h3>
            <div className="text-base" dangerouslySetInnerHTML={{ __html: description }} />
          </div>
        )}
      </div>

      {/* Map */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h3 className="text-xl font-bold text-primary mb-2">Spatial Patterns</h3>
        <SoilMap data={filteredData} parameter={PARAMETER_OPTIONS[parameter]} units={PARAMETER_UNITS[parameter]} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xl font-bold text-primary mb-2">Parameter Distribution</h3>
          <Histogram
            data={filteredData}
            groupBy={grouping}
            parameter={PARAMETER_OPTIONS[parameter]}
            units={PARAMETER_UNITS[parameter]}
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xl font-bold text-primary mb-2">Group Comparison</h3>
          <Boxplot
            data={filteredData}
            groupBy={grouping}
            parameter={PARAMETER_OPTIONS[parameter]}
            units={PARAMETER_UNITS[parameter]}
          />
        </div>
      </div>

      {/* Summary & Download */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xl font-bold text-primary mb-2">Summary Statistics</h3>
          <SummaryTable data={filteredData} groupBy={grouping} units={PARAMETER_UNITS[parameter]} />
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xl font-bold text-primary mb-2">Download Macroinvertebrate Data</h3>
          <p className="mb-4 text-base">
            Download macroinvertebrate data in a convenient format for your own analysis, research, or reporting. Choose
            a metric below.
          </p>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Select Group</label>
              <div className="space-y-3">
                {Object.entries(PARAMETER_OPTIONS).map(([value, label]) => (
                  <div key={value} className="flex items-center gap-2">
                    <Checkbox
                      id={`macro-download-${value}`}
                      checked={downloadMetrics.includes(value as keyof typeof PARAMETER_OPTIONS)}
                      onCheckedChange={(checked) => {
                        const key = value as keyof typeof PARAMETER_OPTIONS
                        setDownloadMetrics(prev =>
                          checked ? [...prev, key] : prev.filter(m => m !== key)
                        )
                      }}
                    />
                    <label htmlFor={`macro-download-${value}`} className="text-foreground cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <Button
              disabled={downloadMetrics.length === 0}
              onClick={() => setShowDisclaimer(true)}
              className="bg-primary text-black hover:bg-primary/90 self-end"
            >
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Community Plots Section */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h3 className="text-xl font-bold text-primary mb-2">Macroinvertebrate Community Plots</h3>
        <p className="text-base mb-4">
          The relative abundance of macroinvertebrate community components can provide even more detail on wetland
          functions. Use the dropdown below to explore the relative abundance of feeding groups, types of
          macroinvertebrates, and types of arthropods.
        </p>
        <ul className="ml-6 mb-4 text-base">
          <li>
            Diversity in macroinvertebrate communities is reflected in diverse <strong>feeding groups</strong>. Some
            collect food by filtering water or gathering from surfaces. Snails and others scrape algae from soils and
            plants. Some macroinvertebrates eat plants by shredding or piercing them. Still others are predators,
            consuming smaller macroinvertebrates.
          </li>
          <li>
            Exploring the <strong>types of macroinvertebrates</strong> shows more of the differences between the types
            of wetlands. Some wetland types may be better habitat for the larvae of flying insects that will later
            hatch, while others support beetles and isopods that live their whole lives in water.
          </li>
          <li>
            <strong>Arthropods</strong> -- the class of macroinvertebrates with hard exoskeletons -- are among the most
            diverse animal groups in the world and wetland arthropod communities are no exception.
          </li>
        </ul>
        <p className="text-sm text-muted-foreground italic mb-4">
          *Some group totals do not add up to 100%. This is due to taking an average of relative abundance within each
          subpopulation.
        </p>
      </div>

      {/* Community Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <label className="block text-sm font-medium mb-2">Community Metrics</label>
          <Select
            value={communityParam}
            onValueChange={(value) => setCommunityParam(value as keyof typeof COMMUNITY_OPTIONS)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(COMMUNITY_OPTIONS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <label className="block text-sm font-medium mb-2">Grouping</label>
          <Select
            value={communityGrouping}
            onValueChange={(value) => setCommunityGrouping(value as keyof typeof GROUPING_OPTIONS)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(GROUPING_OPTIONS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Community Plot */}
      <div className="bg-card border border-border rounded-xl p-4 mb-2">
        <h3 className="text-xl font-bold text-primary mb-2">Community Comparison</h3>
        <CommunityPlot
          data={filteredCommunityData}
          groupBy={communityGrouping}
          metric={COMMUNITY_OPTIONS[communityParam]}
        />
      </div>

      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        onAccept={() => {
          setShowDisclaimer(false)
          const downloadData = invertMetrics.filter((d) => downloadMetrics.includes(d.parameter as keyof typeof PARAMETER_OPTIONS))
          const headers = ['siteid', 'parameter', 'value', 'units', 'Watershed', 'ecoregion', 'Wetland Type', 'latitude', 'longitude']
          downloadCSV(downloadData, `macroinvertebrates-${downloadMetrics.join('-')}.csv`, headers, (row, key) => {
            switch (key) {
              case 'siteid': return row.siteid
              case 'parameter': return row.parameter
              case 'value': return row.value
              case 'units': return row.units
              case 'Watershed': return row.Watershed
              case 'ecoregion': return row.ecoregion
              case 'Wetland Type': return row['Wetland Type']
              case 'latitude': return row.latitude
              case 'longitude': return row.longitude
              default: return undefined
            }
          })
        }}
      />
    </div>
  )
}

// Summary Table Component
function SummaryTable({
  data,
  groupBy,
  units,
}: {
  data: InvertMetric[]
  groupBy: keyof typeof GROUPING_OPTIONS
  units: string
}) {
  const grouped: Record<string, number[]> = {}
  data.forEach((record) => {
    const group = String(record[groupBy] ?? 'Unknown')
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(record.value)
  })

  // Format to 2 significant figures (matching R's signif(., 2))
  const signif = (n: number, digits: number = 2) => {
    if (n === 0) return '0'
    return parseFloat(n.toPrecision(digits)).toString()
  }

  // Show all groups in summary table (matching R Shiny app)
  const stats = Object.entries(grouped)
    .map(([group, values]) => {
      const sorted = [...values].sort((a, b) => a - b)
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const median = sorted[Math.floor(sorted.length / 2)]
      const min = sorted[0]
      const max = sorted[sorted.length - 1]

      return {
        group,
        n: values.length,
        mean: signif(mean),
        median: signif(median),
        min: signif(min),
        max: signif(max),
      }
    })
    .sort((a, b) => a.group.localeCompare(b.group)) // Sort alphabetically (matching R Shiny)

  const unitLabel = units ? ` (${units})` : ''

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2">Group</th>
            <th className="text-right py-2">Sample Size</th>
            <th className="text-right py-2">Min{unitLabel}</th>
            <th className="text-right py-2">Median{unitLabel}</th>
            <th className="text-right py-2">Mean{unitLabel}</th>
            <th className="text-right py-2">Max{unitLabel}</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((stat) => (
            <tr key={stat.group} className="border-b border-border/50">
              <td className="py-2">{stat.group}</td>
              <td className="text-right py-2">{stat.n}</td>
              <td className="text-right py-2">{stat.min}</td>
              <td className="text-right py-2">{stat.median}</td>
              <td className="text-right py-2">{stat.mean}</td>
              <td className="text-right py-2">{stat.max}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
