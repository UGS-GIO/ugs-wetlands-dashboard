import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import Histogram from '../components/charts/histogram'
import Boxplot from '../components/charts/boxplot'
import WaterMap from '../components/maps/water-map'
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
  waterRecordsQueryOptions,
  waterParamsQueryOptions,
  siteAttributesQueryOptions,
  flagsQueryOptions,
} from '../utils/queries'
import { downloadCSV } from '../utils/api'
import { transformWaterParams, transformWaterData } from '../utils/transformers'
import type { WaterData } from '../types'
import { GROUPING_OPTIONS, type GroupingKey } from '../types'

const CATEGORY_OPTIONS = {
  genchem: 'General Chemistry',
  nuts: 'Nutrients',
  metal: 'Metal(oids)',
}

// Download categories matching database category values
const DOWNLOAD_GROUP_OPTIONS = {
  genchem: 'General Chemistry',
  nuts: 'Nutrients',
  toxic: 'Toxics',
}

// Map category selections to parameter labels (matching Shiny app)
const PARAMETER_OPTIONS: Record<string, Record<string, string>> = {
  genchem: {
    Conductivity: 'Electrical Conductivity',
    pH: 'pH',
    'Dissolved Oxygen': 'Dissolved Oxygen',
    Temperature: 'Temperature',
  },
  nuts: {
    'Biological Oxygen Demand': 'Biological Oxygen Demand',
    Ammonia: 'Ammonia-N',
    Nitrate: 'Nitrate + Nitrite-N',
    Phosphate: 'Phosphate-P',
  },
  metal: {
    Aluminum: 'Aluminum',
    Arsenic: 'Arsenic',
    Barium: 'Barium',
    Cadmium: 'Cadmium',
    Chromium: 'Chromium',
    Copper: 'Copper',
    Lead: 'Lead',
    Manganese: 'Manganese',
    Mercury: 'Mercury',
    Nickel: 'Nickel',
    Selenium: 'Selenium',
    Zinc: 'Zinc',
  },
}

const CATEGORY_DESCRIPTIONS: Record<string, { title: string; content: string }> = {
  genchem: {
    title: 'General Chemistry',
    content: `General Chemistry parameters describe the basic chemistry of a wetland. Changes in these parameters can indicate changes in water quality. Aquatic organisms are adapted to life within specific ranges of conductivity, pH, and temperature.

• <strong>Conductivity</strong> is a measure of how salty water is. Water with more salts will have higher measures of conductivity. Utah wetlands vary significantly in conductivity, from freshwater alpine ponds to hypersaline Great Salt Lake playas.
• <strong>pH</strong> measures the acidity (pH < 7) or alkalinity (pH > 7) of water. Some pollutants will drive steep changes in pH.
• <strong>Dissolved oxygen</strong> is the amount of oxygen available for aquatic animals to breathe. Decomposition of plants and algae associated with excessive nutrient concentration lowers dissolved oxygen in water.
• <strong>Temperature</strong> determines which organisms can survive in wetlands because temperature regulates metabolic processes. Temperature also influences water chemistry, especially how much dissolved gases water can hold.`,
  },
  nuts: {
    title: 'Nutrients',
    content: `Nutrients are the compounds plants need to grow and are cycled through the environment between water, soils, plants, and animals. Wetlands are nutrient cycling hotspots because of the chemical reactions that happen where oxygenated water and soils meet anoxic zones. Though they are necessary for life, too much nitrogen, phosphorus, or carbon, including the elements in excess fertilizer runoff, can throw off the balance of an ecosystem, favoring rapidly growing plants and animals.

• <strong>Carbon</strong> is the basis for all life and is found in innumerable chemical forms. We measure organic material in wetlands as organic carbon and biological oxygen demand. The first is a measure of how much organic matter is in the water, and the second is a measure of how much microbial energy is needed to decompose that matter.
• <strong>Nitrogen</strong> is necessary for making proteins and conducting photosynthesis, and is the element that most often limits plant growth and productivity. Two forms of nitrogen are measured in wetlands: nitrate, which is more common in well-oxygenated water, and ammonia, which is more common in anoxic waters.
• <strong>Phosphorus</strong> is required for metabolism and reproduction in plants, and it is a common component of fertilizers as well as human waste. Phosphate (PO₄) is the most commonly measured form of phosphorus.
<em>*Nutrients are measured both as total or unfiltered and dissolved or filtered fractions.</em>`,
  },
  metal: {
    title: 'Metal(oids)',
    content: `Metals and Metalloids are elements that are naturally found in the Earth's crust and waterways. Human activities like irrigation, manufacturing, and driving vehicles concentrate those elements in waterways. Some metals and metalloids are toxic to wildlife and humans, leading to death and deformities. Others accumulate in animal fats and cause birth defects or death at higher trophic levels. Many elements are critical micronutrients for plants and animals, and only become impactful at high concentrations.

• <strong>Arsenic</strong>, <strong>cadmium</strong>, <strong>chromium</strong>, <strong>lead</strong>, and <strong>mercury</strong> are toxic even at very low concentrations. These elements are highest in waters influenced by industrial discharges and mining. Mercury is of special concern because it bioaccumulates in the food chain.
• <strong>Copper</strong>, <strong>nickel</strong>, <strong>selenium</strong>, and <strong>zinc</strong> are used in small amounts by plants and animals. However, high concentrations from improper fertilizer use, industrial pollution, or mining can cause toxicity.
• <strong>Aluminum</strong>, <strong>barium</strong>, <strong>iron</strong>, and <strong>manganese</strong> are all very common in the Earth's crust and usually harmless in the water, but are indicators of geologic processes such as interactions with groundwater or acid mine drainage. At low pH, these elements become more toxic.
<em>*Metals are measured both as total or unfiltered and dissolved or filtered fractions.</em>`,
  },
}

export const Route = createFileRoute('/water-chemistry')({
  component: WaterChemistry,
})

function WaterChemistry() {
  const { data: waterRecords } = useSuspenseQuery(waterRecordsQueryOptions)
  const { data: paramsData } = useSuspenseQuery(waterParamsQueryOptions)
  const { data: sitesData } = useSuspenseQuery(siteAttributesQueryOptions)
  const { data: flagsData } = useSuspenseQuery(flagsQueryOptions)

  const { waterData, waterParams } = useMemo(() => {
    const waterParams = transformWaterParams(paramsData)
    const waterData = transformWaterData(waterRecords, waterParams, sitesData, flagsData)
    return { waterData, waterParams }
  }, [waterRecords, paramsData, sitesData, flagsData])

  const [category, setCategory] = useState<keyof typeof CATEGORY_OPTIONS>('genchem')
  const [parameter, setParameter] = useState<string>('Electrical Conductivity')
  const [grouping, setGrouping] = useState<GroupingKey>('Watershed')
  const [downloadGroups, setDownloadGroups] = useState<(keyof typeof DOWNLOAD_GROUP_OPTIONS)[]>(['genchem'])
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  // Update parameter when category changes
  useEffect(() => {
    const firstParam = Object.keys(PARAMETER_OPTIONS[category])[0]
    setParameter(PARAMETER_OPTIONS[category][firstParam])
  }, [category])

  // Filter data based on selected parameter
  const filteredData = waterData.filter((d) => d.label === parameter)

  // Filter out outliers (z-score > 3) for cleaner visualizations
  // Outliers are still included in downloads
  const chartData = filteredData.filter((d) => !d.isOutlier)

  // Get parameter metadata
  const paramMeta = waterParams.find((p) => p.label === parameter)

  const description = CATEGORY_DESCRIPTIONS[category]

  return (
    <div className="px-4 md:px-8 pt-2">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-2xl font-bold mb-4">Water Chemistry</h2>

          <p className="text-base mb-4">
            Wetlands are often called landscape sinks—places low in the landscape where water and the contaminants in
            the water accumulate. Within a wetland, rising and falling water levels, rapid plant growth, and unique
            soil microbes concentrate, dilute, transform, or sequester chemicals in the water. In fact, water quality
            can improve as water flows through wetlands. Water chemistry is a crucial indicator of wetland condition
            because the plants, fish, and macroinvertebrates in the water are adapted to a specific range of chemistry,
            and deviations outside of those ranges can be clear markers of human impacts on an ecosystem. We have
            included acute water quality criteria for waters that support waterfowl and shorebirds,{' '}
            <a
              href="https://adminrules.utah.gov/public/rule/R317-2/Current%20Rules?"
              target="_blank"
              rel="noopener"
              className="text-primary"
            >
              Class 3D in Utah
            </a>
            , where possible as dashed horizontal lines, for context. However, Utah Administrative Rules contain a
            number of caveats and exclusions for applying water quality standards in wetlands.
          </p>

          <p className="text-base mb-4">
            <strong>Explore the data</strong> by using the drop-down menus to change the data topics and metrics to
            change the maps and charts below.
          </p>

          <p className="text-base">
            Data notes. Of the dozens of water chemistry parameters that can be measured, we present the parameters
            most indicative of wetland condition: general chemistry, nutrients, and metals/metalloids. Parameters not
            included in the plots below can be downloaded. For the purpose of clear data visualization we have removed
            outlier values, but those values are included in the data download.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center">
          <img
            src={`${import.meta.env.BASE_URL}images/wetland_water.jpg`}
            alt="Surface of a wetland with submerged aquatic vegetation"
            className="w-full h-auto max-h-96 object-cover rounded-xl shadow-lg"
          />
          <p className="text-center text-muted-foreground mt-2 text-sm italic">
            Submerged aquatic vegetation in a wetland near Great Salt Lake.
          </p>
        </div>
      </div>

      {/* Dropdowns and Description Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Dropdowns Card */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Water Quality Category</label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value as keyof typeof CATEGORY_OPTIONS)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_OPTIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Parameter</label>
              <Select value={parameter} onValueChange={setParameter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PARAMETER_OPTIONS[category]).map(([value, label]) => (
                    <SelectItem key={value} value={label}>
                      {value}
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

        {/* Category Description Card */}
        {description && (
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
            <h3 className="text-xl font-bold text-foreground mb-2">{description.title}</h3>
            <div className="text-base whitespace-pre-line" dangerouslySetInnerHTML={{ __html: description.content }} />
          </div>
        )}
      </div>

      {/* Map */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h3 className="text-xl font-bold text-foreground mb-2">Spatial Patterns</h3>
        <WaterMap data={chartData} parameter={parameter} units={paramMeta?.units || ''} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xl font-bold text-foreground mb-2">Parameter Distribution</h3>
          <Histogram
            data={chartData}
            groupBy={grouping}
            parameter={parameter}
            units={paramMeta?.units || ''}
            vlineValue={paramMeta?.acute}
            facetBy="fraction"
            facetLabels={{ filtered: 'Filtered', unfiltered: 'Unfiltered' }}
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xl font-bold text-foreground mb-2">Group Comparison</h3>
          <Boxplot
            data={chartData}
            groupBy={grouping}
            parameter={parameter}
            units={paramMeta?.units || ''}
            hlineValue={paramMeta?.acute}
          />
        </div>
      </div>

      {/* Summary & Download */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xl font-bold text-foreground mb-2">Summary Statistics</h3>
          <SummaryTable data={chartData} groupBy={grouping} units={paramMeta?.units || ''} />
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xl font-bold text-foreground mb-2">Download Water Data</h3>
          <p className="mb-4 text-base">
            Download water quality data in a convenient format for your own analysis, research, or reporting. Choose a
            category below.
          </p>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Select Group</label>
              <div className="space-y-3">
                {Object.entries(DOWNLOAD_GROUP_OPTIONS).map(([value, label]) => (
                  <div key={value} className="flex items-center gap-2">
                    <Checkbox
                      id={`download-${value}`}
                      checked={downloadGroups.includes(value as keyof typeof DOWNLOAD_GROUP_OPTIONS)}
                      onCheckedChange={(checked) => {
                        const key = value as keyof typeof DOWNLOAD_GROUP_OPTIONS
                        setDownloadGroups(prev =>
                          checked ? [...prev, key] : prev.filter(g => g !== key)
                        )
                      }}
                    />
                    <label htmlFor={`download-${value}`} className="text-foreground cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <Button
              disabled={downloadGroups.length === 0}
              onClick={() => setShowDisclaimer(true)}
              className="bg-primary text-black hover:bg-primary/90 self-end"
            >
              Download
            </Button>
          </div>
        </div>
      </div>

      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        onAccept={() => {
          setShowDisclaimer(false)
          const downloadData = waterData.filter((d) => downloadGroups.includes(d.category as keyof typeof DOWNLOAD_GROUP_OPTIONS))
          const headers = ['siteid', 'parameter', 'value', 'units', 'flag', 'definition', 'mdl', 'lrl', 'method', 'category', 'Watershed', 'Ecoregion', 'Wetland Type', 'huc_name', 'project', 'date', 'name', 'latitude', 'longitude']
          downloadCSV(downloadData, `water-chemistry-${downloadGroups.join('-')}.csv`, headers, (row, key) => {
            switch (key) {
              case 'siteid': return row.siteid
              case 'parameter': return row.parameter
              case 'value': return row.value
              case 'units': return row.units
              case 'flag': return row.flag
              case 'definition': return row.definition
              case 'mdl': return row.mdl
              case 'lrl': return row.lrl
              case 'method': return row.method
              case 'category': return row.category
              case 'Watershed': return row.Watershed
              case 'Ecoregion': return row.ecoregion
              case 'Wetland Type': return row['Wetland Type']
              case 'huc_name': return row.huc_name
              case 'project': return row.project
              case 'date': return row.date
              case 'name': return row.name
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
  data: WaterData[]
  groupBy: keyof typeof GROUPING_OPTIONS
  units: string
}) {
  const grouped: Record<string, number[]> = {}
  data.forEach((record) => {
    const group = String(record[groupBy] ?? 'Unknown')
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(record.value)
  })

  // Format to 3 significant figures (matching R's signif(., 3))
  const signif = (n: number, digits: number = 3) => {
    if (n === 0) return '0'
    const val = parseFloat(n.toPrecision(digits))
    return val >= 1000 ? val.toLocaleString() : val.toString()
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
              <td className="text-right py-2">{stat.n.toLocaleString()}</td>
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
