import { classifyHuc, classifyWetland } from './classify'
import type {
  WaterRecord,
  WaterParam,
  SoilRecord,
  SoilParam,
  SiteAttribute,
  InvertRecord,
  InvertTaxon,
  FlagRecord,
} from './queries'
import type { WaterData, WaterParamWithCriteria, SoilData, InvertMetric, CommunityData } from '../types'

// Water quality criteria thresholds
const WQ_CRITERIA: Record<string, { acute: number; chronic: number }> = {
  do_conc: { acute: 3.0, chronic: 5.0 },
  ph: { acute: 6.5, chronic: 9.0 },
  al_d: { acute: 87, chronic: 750 },
  as_d: { acute: 150, chronic: 340 },
  cd_d: { acute: 0.72, chronic: 1.8 },
  cr_d: { acute: 11, chronic: 16 },
  cu_d: { acute: 9, chronic: 13 },
  pb_d: { acute: 2.5, chronic: 65 },
  hg_d: { acute: 0.012, chronic: 0.012 },
  ni_d: { acute: 52, chronic: 468 },
  se_d: { acute: 4.6, chronic: 18.4 },
  zn_d: { acute: 120, chronic: 120 },
  nh4_d: { acute: 0.8, chronic: 0.8 },
}

// Bug type consolidation mapping (matching R Shiny app)
const BUG_TYPE_GROUP_MAP: Record<string, string> = {
  snail: 'Snails',
  spring_snail: 'Snails',
  mud_snail: 'Snails',
  aquat_beetle: 'Beetles',
  leaf_beetle: 'Beetles',
  diving_beetle: 'Beetles',
  riffle_beetle: 'Beetles',
  midge: 'Midges',
  biting_midge: 'Midges',
  mayfly: 'Mayflies',
  waterbug: 'Waterbugs',
  boatmen: 'Waterbugs',
  backswimmer: 'Waterbugs',
  amphipod: 'Amphipods',
  leech: 'Worms',
  worm: 'Worms',
  tuficid_worm: 'Worms',
  flatworm: 'Worms',
  damselfly: 'Damselflies',
  caterpillar: 'Other',
  cranefly: 'Other',
  crayfish: 'Other',
  dobsonfly: 'Other',
  dragonfly: 'Other',
  fish: 'Other',
  fly: 'Other',
  isopod: 'Other',
  mite: 'Other',
  mosquito: 'Other',
  springtail: 'Other',
  caddisfly: 'Other',
  mussel: 'Other',
  nematod: 'Other',
  pea_clam: 'Other',
}

// Soil parameter category mappings
const SOIL_GENNUTS_PARAMS = ['nh4n_s', 'no3n_s', 'nh4n_e', 'no3n_e', 'po4p_s', 'orgmat_s', 'ec_s', 'ph_s']
const SOIL_IPMS_PARAMS = [
  'al_s', 'as_s', 'ba_s', 'b_s', 'ca_s', 'cd_s', 'cr_s', 'co_s', 'cu_s', 'fe_s',
  'hg_s', 'ni_s', 'pb_s', 'mg_s', 'mn_s', 'mo_s', 'p_s', 'k_s', 'se_s', 'na_s', 's_s', 'sr_s', 'zn_s'
]

/**
 * Filter sites to remove equipment blanks
 */
function filterSites(sites: SiteAttribute[]): SiteAttribute[] {
  return sites.filter((s) => !s.siteid.includes('_blank_'))
}

/**
 * Add site attributes to a record
 * Returns null if site not found or lacks coordinates (matching R Shiny's filter behavior)
 */
function addSiteAttributes(siteid: string, sites: SiteAttribute[]) {
  const site = sites.find((s) => s.siteid === siteid)
  // Filter out records without valid lat/lon (matching R Shiny's add_spatial_geometry)
  if (!site || site.latitude == null || site.longitude == null) {
    return null
  }
  return {
    latitude: site.latitude,
    longitude: site.longitude,
    ecoregion: site.ecoregion,
    Watershed: classifyHuc(site.huc8),
    'Wetland Type': classifyWetland(site.sysclass),
  }
}

/**
 * Transform water parameters with label fixes and criteria
 */
export function transformWaterParams(params: WaterParam[]): WaterParamWithCriteria[] {
  return params.map((p) => {
    let label = p.label
    if (p.parameter === 'ph') label = 'pH'
    if (p.parameter === 'do_sat') label = 'Dissolved Oxygen 2'
    if (p.parameter === 'do_conc') label = 'Dissolved Oxygen'
    if (p.parameter === 'po4_d') label = 'Phosphate'

    return {
      ...p,
      label,
      acute: WQ_CRITERIA[p.parameter]?.acute,
      chronic: WQ_CRITERIA[p.parameter]?.chronic,
    }
  })
}

/**
 * Transform raw water records into enriched water data
 */
export function transformWaterData(
  records: WaterRecord[],
  params: WaterParamWithCriteria[],
  sites: SiteAttribute[]
): WaterData[] {
  const filteredSites = filterSites(sites)

  return records
    .map((w) => {
      if (!w?.parameter || !w?.siteid || typeof w.value !== 'number') return null
      if (w.siteid.includes('_blank_')) return null

      const param = params.find((p) => p.parameter === w.parameter)
      if (!param) return null

      // Get site attributes - returns null if site not found or lacks coordinates
      const siteAttrs = addSiteAttributes(w.siteid, filteredSites)
      if (!siteAttrs) return null

      const fraction = w.parameter.endsWith('_t')
        ? 'unfiltered'
        : w.parameter.endsWith('_d')
          ? 'filtered'
          : 'unfiltered'

      const result: WaterData = {
        ...w,
        units: param.units || '',
        label: param.label || '',
        category: param.category || '',
        acute: param.acute,
        chronic: param.chronic,
        ...siteAttrs,
        fraction,
      }
      return result
    })
    .filter((w): w is WaterData => w !== null && !isNaN(w.value))
}

/**
 * Transform raw soil records into enriched soil data
 */
export function transformSoilData(
  records: SoilRecord[],
  params: SoilParam[],
  sites: SiteAttribute[]
): SoilData[] {
  const filteredSites = filterSites(sites)

  return records
    .map((s) => {
      if (!s?.parameter || !s?.siteid || typeof s.value !== 'number') return null
      if (s.siteid.includes('_blank_')) return null

      const param = params.find((p) => p.parameter === s.parameter)
      if (!param) return null

      // Get site attributes - returns null if site not found or lacks coordinates
      const siteAttrs = addSiteAttributes(s.siteid, filteredSites)
      if (!siteAttrs) return null

      // Determine category
      let category = 'other'
      if (SOIL_GENNUTS_PARAMS.includes(s.parameter)) category = 'gennuts'
      else if (SOIL_IPMS_PARAMS.includes(s.parameter)) category = 'ipms'

      const result: SoilData = {
        ...s,
        units: param.units || '',
        label: param.label || '',
        category,
        ...siteAttrs,
      }
      return result
    })
    .filter((s): s is SoilData => s !== null && !isNaN(s.value))
}

/**
 * Transform raw invertebrate records into metrics and community data
 */
export function transformInvertData(
  records: InvertRecord[],
  taxa: InvertTaxon[],
  sites: SiteAttribute[],
  flags: FlagRecord[]
): { invertMetrics: InvertMetric[]; communityData: CommunityData[] } {
  const filteredSites = filterSites(sites)

  // Pre-compute valid site IDs (sites with coordinates) for filtering
  const validSiteIds = new Set(
    filteredSites
      .filter((s) => s.latitude != null && s.longitude != null)
      .map((s) => s.siteid)
  )

  // Filter out flagged records (vertebrates), equipment blanks, and sites without coordinates
  const flaggedIds = new Set(flags.map((f) => f.site_param))
  const inverts = records.filter(
    (i) =>
      i?.siteid &&
      i?.taxon &&
      typeof i.abundance === 'number' &&
      !flaggedIds.has(i.site_taxa) &&
      !i.siteid.includes('_blank_') &&
      validSiteIds.has(i.siteid)
  )

  // Create taxon lookup
  const taxonMap = new Map(taxa.map((t) => [t.taxon, t]))

  // Calculate metrics per site
  const siteData: Record<string, { richness: number; abundance: number; eto_raw: number }> = {}
  const etoOrders = new Set(['Ephemeroptera', 'Tricoptera', 'Odonata'])

  inverts.forEach((inv) => {
    if (!siteData[inv.siteid]) {
      siteData[inv.siteid] = { richness: 0, abundance: 0, eto_raw: 0 }
    }
    siteData[inv.siteid].richness += 1
    siteData[inv.siteid].abundance += inv.abundance

    const taxon = taxonMap.get(inv.taxon)
    if (taxon && etoOrders.has(taxon.order)) {
      siteData[inv.siteid].eto_raw += inv.abundance
    }
  })

  // Create metrics array (only for sites with valid coordinates)
  const invertMetrics: InvertMetric[] = []
  Object.entries(siteData).forEach(([siteid, data]) => {
    const siteAttrs = addSiteAttributes(siteid, filteredSites)
    if (!siteAttrs) return // Skip sites without valid coordinates

    const baseData = {
      siteid,
      ...siteAttrs,
    }

    invertMetrics.push({
      ...baseData,
      parameter: 'abundance',
      value: data.abundance,
      units: '#',
      label: 'Abundance',
    })

    invertMetrics.push({
      ...baseData,
      parameter: 'richness',
      value: data.richness,
      units: '#',
      label: 'Taxa Richness',
    })

    const etoRel = data.abundance > 0
      ? Math.round((data.eto_raw / data.abundance) * 10000) / 100
      : 0
    invertMetrics.push({
      ...baseData,
      parameter: 'eto_rel',
      value: etoRel,
      units: '%',
      label: 'ETO Relative Richness',
    })
  })

  // Calculate community data
  const calcRelativeAbundance = (
    groupField: keyof InvertTaxon,
    paramName: string,
    filterFn?: (taxon: InvertTaxon) => boolean
  ): CommunityData[] => {
    const result: CommunityData[] = []
    const siteGroups: Record<string, Record<string, number>> = {}

    inverts.forEach((inv) => {
      const taxon = taxonMap.get(inv.taxon)
      if (!taxon) return
      if (filterFn && !filterFn(taxon)) return

      const groupValue = String(taxon[groupField] ?? 'Unknown')
      if (!siteGroups[inv.siteid]) siteGroups[inv.siteid] = {}
      if (!siteGroups[inv.siteid][groupValue]) siteGroups[inv.siteid][groupValue] = 0
      siteGroups[inv.siteid][groupValue] += inv.abundance
    })

    Object.entries(siteGroups).forEach(([siteid, groups]) => {
      const siteAttrs = addSiteAttributes(siteid, filteredSites)
      if (!siteAttrs) return // Skip sites without valid coordinates

      const total = Object.values(groups).reduce((a, b) => a + b, 0)

      Object.entries(groups).forEach(([group, count]) => {
        result.push({
          siteid,
          parameter: paramName,
          group,
          rel_abnd: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
          ...siteAttrs,
        })
      })
    })

    return result
  }

  // Feeding groups
  const feedGroups = calcRelativeAbundance('feed_group', 'feed_grp')

  // Bug types with consolidation
  const bugTypes = calcRelativeAbundance('group', 'bug_type')
  const siteConsolidated: Record<string, Record<string, number>> = {}

  bugTypes.forEach((bt) => {
    const newGroup = BUG_TYPE_GROUP_MAP[bt.group] || bt.group
    if (!siteConsolidated[bt.siteid]) siteConsolidated[bt.siteid] = {}
    if (!siteConsolidated[bt.siteid][newGroup]) siteConsolidated[bt.siteid][newGroup] = 0
    siteConsolidated[bt.siteid][newGroup] += bt.rel_abnd
  })

  const consolidatedBugTypes: CommunityData[] = []
  Object.entries(siteConsolidated).forEach(([siteid, groups]) => {
    const siteAttrs = addSiteAttributes(siteid, filteredSites)
    if (!siteAttrs) return // Skip sites without valid coordinates

    Object.entries(groups).forEach(([group, rel_abnd]) => {
      consolidatedBugTypes.push({
        siteid,
        parameter: 'bug_type',
        group,
        rel_abnd,
        ...siteAttrs,
      })
    })
  })

  // Arthropod orders
  const arthropodData = calcRelativeAbundance('order', 'arthropod', (t) => t.phylum === 'Arthropoda')

  return {
    invertMetrics,
    communityData: [...feedGroups, ...consolidatedBugTypes, ...arthropodData],
  }
}
