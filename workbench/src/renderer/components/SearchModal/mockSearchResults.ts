import type { SearchResult } from './models';

export const mockSearchResults: SearchResult[] = [
  {
    // @TODO: generate unique id, if not provided
    id: 'result-1',
    title: 'NASA HGT DEM - Global Dataset',
    // @TODO: handle URLs in descriptions
    description: `
      NASA DEM HGT version 1 - Global Layer. 30m pixel size. NASADEM 1
      arc second (30m) elevation data (collected over the Grand Canyon
      between 2000-02-11 to 2000-02-21). All tiles were downloaded from
      NASA Earth Data and stitched into one Cloud Optimized GeoTiff
      raster. More information on the dataset can be found in the
      metadata YML file available for download. More information on the
      source data can found here: https://lpdaac.usgs.gov/products/nasadem_hgtv001/.
    `,
    tags: ['DEM', 'DIGITAL ELEVATION MODEL', 'INVEST INPUT', 'INVEST-READY', 'NASA'],
    places: ['GLOBAL'],
    license: 'Public Domain',
    author: 'Natural Capital Alliance, Stanford University',
    lastUpdated: new Date(2026, 0, 8, 16, 40),
    created: new Date(2024, 9, 24, 18, 57),
    dataHubUrl: 'https://data.naturalcapitalalliance.stanford.edu/dataset/sts-2b13519934614f4b36243eaeab5c712f37043413fb6fc314d588229a47808157',
  },
  {
    id: 'result-2',
    title: 'ASTER DEM v3 30m - Global Dataset',
    description: `
      ASTER DEM v3 30m Global Dataset. Raw source data tiles were retrieved
      from the Advanced Spaceborne Thermal Emission and Reflection Radiometer
      (ASTER) Version 3 dataset. Temporal resolution: March 1, 2000, and
      November 30, 2013. Tiles were downloaded and stitched together to create
      a global Cloud Optimized GeoTiff. See the accompanying metadata (YML)
      file for more information on this dataset and the source data.
    `,
    tags: ['ASTER', 'DEM', 'DIGITAL ELEVATION MODEL', 'INVEST INPUT', 'INVEST-READY', 'NASA'],
    places: ['GLOBAL'],
    license: 'Public Domain',
    author: 'Natural Capital Alliance, Stanford University',
    lastUpdated: new Date(2026, 0, 8, 16, 37),
    created: new Date(2024, 10, 12, 14, 46),
    dataHubUrl: 'https://data.naturalcapitalalliance.stanford.edu/dataset/sts-632af8dc05ae810188cb2a4862f8a85022f0204daf78a040c9aa9cc248db0fd7',
  },
];
