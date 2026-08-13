export interface DataHubSearchQuery {
  tags: string[],
  datatype: string,
  extent: number[],
  collection: string | null,
}
