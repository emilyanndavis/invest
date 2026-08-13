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
