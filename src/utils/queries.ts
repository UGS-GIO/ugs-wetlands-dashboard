import { queryOptions } from '@tanstack/react-query'
import { fetchFromAPI } from './api'

// Shared types
export interface SiteAttribute {
  siteid: string
  latitude: number
  longitude: number
  ecoregion: string
  huc8: string
  huc_name: string
  wet_type: string
  sysclass: string
  project?: string
  name?: string
  date?: string
}

// Water Chemistry types
export interface WaterRecord {
  site_param: string
  siteid: string
  parameter: string
  value: number
}

export interface WaterParam {
  parameter: string
  definition: string
  units: string
  category: string
  label: string
  mdl?: number
  lrl?: number
  method?: string
  fraction?: string
}

// Soil Chemistry types
export interface SoilRecord {
  site_param: string
  siteid: string
  parameter: string
  value: number
}

export interface SoilParam {
  parameter: string
  definition?: string
  units: string
  label: string
  method?: string
  mdl?: number
}

// Macroinvertebrate types
export interface InvertRecord {
  site_taxa: string
  siteid: string
  taxon: string
  abundance: number
}

export interface InvertTaxon {
  taxon: string
  level: string
  feed_group: string
  order: string
  class: string
  phylum: string
  group: string
}

export interface FlagRecord {
  site_param: string
  siteid: string
  parameter: string
  value: number
  flag: string
}

// Column selections for each table (excludes geom, oid, and other unused columns)
const SITE_ATTR_COLUMNS = ['siteid', 'latitude', 'longitude', 'ecoregion', 'huc8', 'huc_name', 'wet_type', 'sysclass', 'project', 'name', 'date']
const WATER_COLUMNS = ['site_param', 'siteid', 'parameter', 'value']
const WATER_PARAM_COLUMNS = ['parameter', 'definition', 'units', 'category', 'label', 'mdl', 'lrl', 'method']
const SOIL_COLUMNS = ['site_param', 'siteid', 'parameter', 'value']
const SOIL_PARAM_COLUMNS = ['parameter', 'definition', 'units', 'label', 'method', 'mdl']
const INVERT_COLUMNS = ['site_taxa', 'siteid', 'taxon', 'abundance']
const INVERT_PARAM_COLUMNS = ['taxon', 'level', 'feed_group', 'order', 'class', 'phylum', 'group']
const FLAG_COLUMNS = ['site_param', 'flag']

// Query options for shared site attributes
export const siteAttributesQueryOptions = queryOptions({
  queryKey: ['site-attributes'],
  queryFn: () => fetchFromAPI<SiteAttribute>('siteattributes', SITE_ATTR_COLUMNS),
})

// Query options for water chemistry data
export const waterRecordsQueryOptions = queryOptions({
  queryKey: ['water-records'],
  queryFn: () => fetchFromAPI<WaterRecord>('water', WATER_COLUMNS),
})

export const waterParamsQueryOptions = queryOptions({
  queryKey: ['water-params'],
  queryFn: () => fetchFromAPI<WaterParam>('waterparameters', WATER_PARAM_COLUMNS),
})

// Query options for soil chemistry data
export const soilRecordsQueryOptions = queryOptions({
  queryKey: ['soil-records'],
  queryFn: () => fetchFromAPI<SoilRecord>('soil', SOIL_COLUMNS),
})

export const soilParamsQueryOptions = queryOptions({
  queryKey: ['soil-params'],
  queryFn: () => fetchFromAPI<SoilParam>('soilparameters', SOIL_PARAM_COLUMNS),
})

// Query options for macroinvertebrate data
export const invertRecordsQueryOptions = queryOptions({
  queryKey: ['invert-records'],
  queryFn: () => fetchFromAPI<InvertRecord>('inverts', INVERT_COLUMNS),
})

export const invertTaxaQueryOptions = queryOptions({
  queryKey: ['invert-taxa'],
  queryFn: () => fetchFromAPI<InvertTaxon>('invertparameters', INVERT_PARAM_COLUMNS),
})

export const flagsQueryOptions = queryOptions({
  queryKey: ['flags'],
  queryFn: () => fetchFromAPI<FlagRecord>('flags', FLAG_COLUMNS),
})
