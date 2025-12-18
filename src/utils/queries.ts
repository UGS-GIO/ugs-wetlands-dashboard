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

// Query options for shared site attributes
export const siteAttributesQueryOptions = queryOptions({
  queryKey: ['site-attributes'],
  queryFn: () => fetchFromAPI<SiteAttribute>('site_attr'),
})

// Query options for water chemistry data
export const waterRecordsQueryOptions = queryOptions({
  queryKey: ['water-records'],
  queryFn: () => fetchFromAPI<WaterRecord>('water'),
})

export const waterParamsQueryOptions = queryOptions({
  queryKey: ['water-params'],
  queryFn: () => fetchFromAPI<WaterParam>('water_param'),
})

// Query options for soil chemistry data
export const soilRecordsQueryOptions = queryOptions({
  queryKey: ['soil-records'],
  queryFn: () => fetchFromAPI<SoilRecord>('soil'),
})

export const soilParamsQueryOptions = queryOptions({
  queryKey: ['soil-params'],
  queryFn: () => fetchFromAPI<SoilParam>('soil_param'),
})

// Query options for macroinvertebrate data
export const invertRecordsQueryOptions = queryOptions({
  queryKey: ['invert-records'],
  queryFn: () => fetchFromAPI<InvertRecord>('inverts'),
})

export const invertTaxaQueryOptions = queryOptions({
  queryKey: ['invert-taxa'],
  queryFn: () => fetchFromAPI<InvertTaxon>('invert_param'),
})

export const flagsQueryOptions = queryOptions({
  queryKey: ['flags'],
  queryFn: () => fetchFromAPI<FlagRecord>('flags'),
})
