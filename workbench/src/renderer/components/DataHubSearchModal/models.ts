export interface DataHubSearchResult {
  id: string,
  title: string,
  description: string,
  tags: string[],
  places: string[],
  collections: string[],
  license: string,
  author: string,
  lastUpdated: string,
  created: string,
  datasetUrl: string,
  webpageUrl: string,
}

// For now, LULC/Biophysical Table pairs are the only "sibling" pairs supported.
export enum DataHubSearchSiblingType {
  LULC,
  BIOPHYSICAL_TABLE,
  NONE,
}
