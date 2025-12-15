import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import Histogram from '../components/charts/histogram'
import Boxplot from '../components/charts/boxplot'
import SoilMap from '../components/maps/soil-map'
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
  soilRecordsQueryOptions,
  soilParamsQueryOptions,
  siteAttributesQueryOptions,
} from '../utils/queries'
import { downloadCSV } from '../utils/api'
import { transformSoilData } from '../utils/transformers'
import type { SoilData } from '../types'
import { GROUPING_OPTIONS, type GroupingKey } from '../types'

const CATEGORY_OPTIONS = {
  gennuts: 'General and Nutrients',
  ipms: 'Element Scan',
}

// Download dropdown options (matching R Shiny app)
const DOWNLOAD_GROUP_OPTIONS = {
  gennuts: 'General and Nutrients',
  ipms: 'Element Scan',
}

// Map category selections to parameter codes (matching Shiny app)
const PARAMETER_OPTIONS: Record<string, Record<string, string>> = {
  gennuts: {
    'Ammonium': 'nh4n_s',
    'Nitrate': 'no3n_s',
    'Ammonium (KCl)': 'nh4n_e',
    'Nitrate (KCl)': 'no3n_e',
    'Phosphate': 'po4p_s',
    'Organic Matter': 'orgmat_s',
    'Conductivity': 'ec_s',
    'pH': 'ph_s',
  },
  ipms: {
    'Aluminum': 'al_s',
    'Arsenic': 'as_s',
    'Barium': 'ba_s',
    'Boron': 'b_s',
    'Calcium': 'ca_s',
    'Cadmium': 'cd_s',
    'Chromium': 'cr_s',
    'Cobalt': 'co_s',
    'Copper': 'cu_s',
    'Iron': 'fe_s',
    'Mercury': 'hg_s',
    'Nickel': 'ni_s',
    'Lead': 'pb_s',
    'Magnesium': 'mg_s',
    'Manganese': 'mn_s',
    'Molybdenum': 'mo_s',
    'Phosphorus': 'p_s',
    'Potassium': 'k_s',
    'Selenium': 'se_s',
    'Sodium': 'na_s',
    'Sulfur': 's_s',
    'Strontium': 'sr_s',
    'Zinc': 'zn_s',
  },
}

const CATEGORY_DESCRIPTIONS: Record<string, { title: string; content: string }> = {
  gennuts: {
    title: 'General and Nutrients',
    content: `General chemistry parameters are the key drivers of which organisms can survive in wetlands, based on tolerance to salinity, alkalinity, and organic matter. Nutrients are the compounds plants need to grow, including elements in fertilizers, and are most accessible to plants in soils.

• pH measures the acidity (pH < 7) or alkalinity (pH > 7) of soil. Many Utah soils are alkaline due to the prevalence of carbonate rock.
• Conductivity is a measure of soil salinity. Saline soils are challenging for plants to grow in because they affect the plant's water balance. Many wetland plants have adaptations to survive salty soils.
• Organic matter is the portion of soil composed of material from organisms in various stages of decomposition. Organic matter builds up in wetland soils because decomposition is slower than in uplands. Soil organic matter provides crucial nutrients for plants and is a form of carbon storage.
• Nitrogen in soils is more easily accessed by plant roots than nitrogen in water, but is needed for the same cell processes. Nitrate and ammonia forms of nitrogen are both found in wetland soils, but ammonia concentration is often higher because nitrates are converted to other forms in oxygen-depleted conditions.
• Phosphorus accumulates in wetland soils because it readily binds to sediments. Plants are able to easily access phosphorus in soil for their metabolic needs, but much of it remains bound to soils and is a good indicator of legacy nutrient enrichment.`,
  },
  ipms: {
    title: 'Element Scan',
    content: `Soils reflect the elemental geology of a region, which can be determined using mass spectrometry to measure elemental concentrations in the soil. The elements that accumulate in soils also reflect longer-term patterns of chemistry as contaminants are bound to and buried in soils.`,
  },
}

export const Route = createFileRoute('/soil-chemistry')({
  loader: async ({ context: { queryClient } }) => {
    const [soilRecords, paramsData, sitesData] = await Promise.all([
      queryClient.ensureQueryData(soilRecordsQueryOptions),
      queryClient.ensureQueryData(soilParamsQueryOptions),
      queryClient.ensureQueryData(siteAttributesQueryOptions),
    ])

    const soilData = transformSoilData(soilRecords, paramsData, sitesData)

    return { soilData, soilParams: paramsData }
  },
  component: SoilChemistry,
})

function SoilChemistry() {
  const { soilData, soilParams } = Route.useLoaderData()

  const [category, setCategory] = useState<keyof typeof CATEGORY_OPTIONS>('gennuts')
  const [parameter, setParameter] = useState<string>('nh4n_s')
  const [grouping, setGrouping] = useState<GroupingKey>('Watershed')
  const [downloadGroups, setDownloadGroups] = useState<(keyof typeof DOWNLOAD_GROUP_OPTIONS)[]>(['gennuts'])
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  // Update parameter when category changes
  useEffect(() => {
    const firstParam = Object.values(PARAMETER_OPTIONS[category])[0]
    setParameter(firstParam)
  }, [category])

  // Filter data based on selected parameter (by parameter code)
  const filteredData = soilData.filter((d) => d.parameter === parameter)

  // Get parameter metadata
  const paramMeta = soilParams.find((p) => p.parameter === parameter)

  // Get display label for current parameter
  const parameterLabel =
    Object.entries(PARAMETER_OPTIONS[category]).find(([_, code]) => code === parameter)?.[0] || parameter

  const description = CATEGORY_DESCRIPTIONS[category]

  return (
    <div className="px-4 md:px-8 pt-2">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-2xl font-bold mb-4">Soil Chemistry</h2>

          <p className="text-base mb-4">
            Wetland soils are unique because they are either permanently or seasonally flooded. Flooding removes oxygen
            from the soil and the lack of oxygen limits decomposition, allowing soil organic matter to build up. Organic
            matter produces dark colored and carbon-rich wetland soils. Wetland soils store more carbon than any other
            terrestrial habitat. The presence and chemistry of wetland soils tells a story of how the wetland functions.
          </p>

          <p className="text-base mb-4">
            Two types of soil measures are displayed below: general chemistry measures and nutrients that are the
            results of individual soil analyses and elemental scan results produced by mass spectrometry analysis.
          </p>

          <p className="text-base mb-4">
            <strong>Explore the data</strong> by using the drop-down menus to change the data topics and metrics to
            change the maps and charts below.
          </p>

          <p className="text-base">
            Data notes. For the purpose of clear data visualization, parameters not included in the plots below can be
            downloaded.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center">
          <img
            src="/images/playa_soils.jpg"
            alt="A salt crust has formed on playa wetland soils near Great Salt Lake"
            className="w-full h-auto max-h-96 object-cover rounded-xl shadow-lg"
          />
          <p className="text-center text-muted-foreground mt-2 text-sm italic">
            A salt crust has formed on playa wetland soils near Great Salt Lake
          </p>
        </div>
      </div>

      {/* Dropdowns and Description Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Dropdowns Card */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Soil Category</label>
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
                  {Object.entries(PARAMETER_OPTIONS[category]).map(([label, code]) => (
                    <SelectItem key={code} value={code}>
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

        {/* Category Description Card */}
        {description && (
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
            <h3 className="text-xl font-bold text-primary mb-2">{description.title}</h3>
            <div className="text-base whitespace-pre-line">{description.content}</div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h3 className="text-xl font-bold text-primary mb-2">Spatial Patterns</h3>
        <SoilMap data={filteredData} parameter={parameterLabel} units={paramMeta?.units || ''} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xl font-bold text-primary mb-2">Parameter Distribution</h3>
          <Histogram data={filteredData} groupBy={grouping} parameter={parameterLabel} units={paramMeta?.units || ''} />
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xl font-bold text-primary mb-2">Group Comparison</h3>
          <Boxplot data={filteredData} groupBy={grouping} parameter={parameterLabel} units={paramMeta?.units || ''} />
        </div>
      </div>

      {/* Summary & Download */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xl font-bold text-primary mb-2">Summary Statistics</h3>
          <SummaryTable data={filteredData} groupBy={grouping} units={paramMeta?.units || ''} />
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xl font-bold text-primary mb-2">Download Soil Data</h3>
          <p className="mb-4 text-base">
            Download soil chemistry data in a convenient format for your own analysis, research, or reporting. Choose a
            category below.
          </p>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Select Group</label>
              <div className="space-y-3">
                {Object.entries(DOWNLOAD_GROUP_OPTIONS).map(([value, label]) => (
                  <div key={value} className="flex items-center gap-2">
                    <Checkbox
                      id={`soil-download-${value}`}
                      checked={downloadGroups.includes(value as keyof typeof DOWNLOAD_GROUP_OPTIONS)}
                      onCheckedChange={(checked) => {
                        const key = value as keyof typeof DOWNLOAD_GROUP_OPTIONS
                        setDownloadGroups(prev =>
                          checked ? [...prev, key] : prev.filter(g => g !== key)
                        )
                      }}
                    />
                    <label htmlFor={`soil-download-${value}`} className="text-foreground cursor-pointer">
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
          const downloadData = soilData.filter((d) => downloadGroups.includes(d.category as keyof typeof DOWNLOAD_GROUP_OPTIONS))
          const headers = ['siteid', 'parameter', 'value', 'units', 'category', 'Watershed', 'ecoregion', 'Wetland Type', 'latitude', 'longitude']
          downloadCSV(downloadData, `soil-chemistry-${downloadGroups.join('-')}.csv`, headers, (row, key) => {
            switch (key) {
              case 'siteid': return row.siteid
              case 'parameter': return row.parameter
              case 'value': return row.value
              case 'units': return row.units
              case 'category': return row.category
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
  data: SoilData[]
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
