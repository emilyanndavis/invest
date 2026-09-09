import type { DataHubSearchResult } from './models';

export const mockSearchResults: DataHubSearchResult[] = [
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
    tags: ['DEM', 'DIGITAL ELEVATION MODEL', 'INVEST INPUT', 'INVEST-READY', 'NASA', 'SOME OTHER TAG', 'ANOTHER TAG', 'YET ANOTHER TAG', 'ONE MORE TAG TO TEST HOW THIS ELEMENT RENDERS WHEN THE LIST OF TAGS IS VERY LONG'],
    places: ['GLOBAL'],
    collections: [],
    license: 'Public Domain',
    author: 'Natural Capital Alliance, Stanford University',
    lastUpdated: 'January 8, 2026, 4:37 PM (UTC-07:00)',
    created: 'November 12, 2024, 2:46 PM (UTC-07:00)',
    datasetUrl: 'https://data.naturalcapitalalliance.stanford.edu/download/global/nasa-hgt-v1-1s/nasa-hgt-v1-1s.tif',
    webpageUrl: 'https://data.naturalcapitalalliance.stanford.edu/dataset/sts-2b13519934614f4b36243eaeab5c712f37043413fb6fc314d588229a47808157',
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
    collections: [],
    license: 'Public Domain',
    author: 'Natural Capital Alliance, Stanford University',
    lastUpdated: 'January 8, 2026, 4:37 PM (UTC-07:00)',
    created: 'November 12, 2024, 2:46 PM (UTC-07:00)',
    datasetUrl: 'https://data.naturalcapitalalliance.stanford.edu/download/global/aster-v3-1s/aster-v3-1s.tif',
    webpageUrl: 'https://data.naturalcapitalalliance.stanford.edu/dataset/sts-632af8dc05ae810188cb2a4862f8a85022f0204daf78a040c9aa9cc248db0fd7',
  },
  {
    id: 'result-3',
    title: 'Sediment Delivery Ratio Biophysical Table - Global Parameters for ESA CCI LULC (2020-2022)',
    description: `
      Global parameter biophysical table for the Sediment Delivery Ratio InVEST
      model. This table is to be paired with the ESA CCI LULC raster. Note:
      these are global parameters for testing models and providing baselines,
      it is important to use local parameters for your region. For more
      information on sources, please see the accompanying Excel file.
    `,
    tags: ['BIOPHYSICAL TABLE', 'LAND USE LAND COVER', 'SEDIMENT DELIVERY RATIO', 'USLE C FACTOR', 'USLE P FACTOR'],
    places: ['GLOBAL'],
    collections: ['ESA CCI LULC'],
    license: 'Public Domain',
    author: 'Natural Capital Alliance, Stanford University',
    lastUpdated: 'April 29, 2026, 4:13 PM (UTC-06:00)',
    created: 'April 29, 2026, 4:13 PM (UTC-06:00)',
    datasetUrl: 'https://data.naturalcapitalalliance.stanford.edu/download/natcap-projects/global-parameters/SDR_biophysical_table/SDR_biophysical_table_ESA_CCI_2020_global_values.csv',
    webpageUrl: 'https://data.naturalcapitalalliance.stanford.edu/dataset/sts-3514aabe09f18091bee2774646e7c49bf5fbeeff2cec35464f6ed29bf99be70d',
  },
  {
    id: 'result-4',
    title: '2022 ESA CCI Global Land Use Land Cover',
    description: `
      2022 Global Land Cover Dataset at 300m resolution, originally produced by
      the European Space Agency (ESA) Climate Change Initiative (CCI). Dataset
      includes 22 classes using the United Nations Food and Agriculture
      Organization's (UN FAO) Land Cover Classification System (LCCS). Original
      NetCDF data was downloaded by members of the NatCap internal team and
      converted to a COG GeoTIFF. For more information on the source data,
      visit: https://cds.climate.copernicus.eu/datasets/satellite-land-cover?tab=overview
      For more information on the processing steps, source data, and land use
      classifications, please see the 'Lineage' and 'Band Description' sections
      of the accompanying metadata YAML file.
    `,
    tags: ['LAND COVER', 'LAND USE LAND COVER', 'LULC', 'ESA', 'INVEST INPUT', 'INVEST-READY'],
    places: ['GLOBAL'],
    collections: ['ESA CCI LULC', 'BANANA'],
    license: 'Public Domain',
    author: 'Natural Capital Alliance, Stanford University',
    lastUpdated: 'April 29, 2026, 3:57 PM (UTC-06:00)',
    created: 'April 29, 2026, 3:57 PM (UTC-06:00)',
    datasetUrl: 'https://data.naturalcapitalalliance.stanford.edu/download/global/esa_CCI/ESA-CCI-LULC-300m-P1Y-2022-v2.1.1.tif',
    webpageUrl: 'https://data.naturalcapitalalliance.stanford.edu/dataset/sts-1a410f75622cb976ce1f28a7d5085741da7a52d53c66bae3be4489d6bb47de7f',
  },
];
