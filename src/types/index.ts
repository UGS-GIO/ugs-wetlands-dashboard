// Base types from API (re-exported from queries for convenience)
export type {
  SiteAttribute,
  WaterRecord,
  WaterParam,
  SoilRecord,
  SoilParam,
  InvertRecord,
  InvertTaxon,
  FlagRecord,
} from '../utils/queries'

// Shared grouping options used across all routes
export const GROUPING_OPTIONS = {
  Watershed: 'Watershed',
  ecoregion: 'Ecoregion',
  'Wetland Type': 'Wetland Type',
} as const

export type GroupingKey = keyof typeof GROUPING_OPTIONS

// Base interface for data with site attributes
interface WithSiteAttributes {
  latitude?: number
  longitude?: number
  ecoregion?: string
  Watershed?: string
  'Wetland Type'?: string
}

// Water Chemistry types
export interface WaterData extends WithSiteAttributes {
  site_param: string
  siteid: string
  parameter: string
  value: number
  units: string
  label: string
  category: string
  acute?: number
  chronic?: number
  fraction: 'filtered' | 'unfiltered'
}

export interface WaterParamWithCriteria {
  parameter: string
  definition: string
  units: string
  category: string
  label: string
  acute?: number
  chronic?: number
}

// Soil Chemistry types
export interface SoilData extends WithSiteAttributes {
  site_param: string
  siteid: string
  parameter: string
  value: number
  units: string
  label: string
  category: string
}

// Macroinvertebrate types
export interface InvertMetric extends WithSiteAttributes {
  siteid: string
  parameter: string
  value: number
  units: string
  label: string
}

export interface CommunityData extends WithSiteAttributes {
  siteid: string
  parameter: string
  group: string
  rel_abnd: number
}

