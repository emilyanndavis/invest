export interface DataHubSearchQuery {
  tags: string[],
  datatype: string,
  extent: number[],
  collection: string,
}

export interface DataHubSearchResult {
  id: string,
  title: string,
  description: string,
  tags: string[],
  places: string[],
  license: string,
  author: string,
  lastUpdated: Date,
  created: Date,
  dataHubUrl: string,
}
