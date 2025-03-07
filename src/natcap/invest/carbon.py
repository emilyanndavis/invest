# coding=UTF-8
"""Carbon Storage and Sequestration."""
import codecs
import logging
import os
import time

from osgeo import gdal
import numpy
import pygeoprocessing
import taskgraph

from . import validation
from . import utils
from . import spec_utils
from .unit_registry import u
from .model_metadata import MODEL_METADATA
from . import gettext

LOGGER = logging.getLogger(__name__)

CARBON_OUTPUTS = {
    f"c_{pool}_{scenario}.tif": {
        "about": (
            f"Raster of {pool_name} carbon values in the {scenario_name} "
            "scenario, mapped from the Carbon Pools table to the LULC."),
        "bands": {1: {
            "type": "number",
            "units": u.metric_ton/u.hectare
        }}
    } for pool, pool_name in [
        ('above', 'aboveground'),
        ('below', 'belowground'),
        ('soil', 'soil'),
        ('dead', 'dead matter')
    ] for scenario, scenario_name in [
        ('bas', 'baseline'),
        ('alt', 'alternate')
    ]
}

MODEL_SPEC = {
    "model_id": "carbon",
    "model_name": MODEL_METADATA["carbon"].model_title,
    "pyname": MODEL_METADATA["carbon"].pyname,
    "userguide": MODEL_METADATA["carbon"].userguide,
    "args_with_spatial_overlap": {
        "spatial_keys": ["lulc_bas_path", "lulc_alt_path"],
    },
    "args": {
        "workspace_dir": spec_utils.WORKSPACE,
        "results_suffix": spec_utils.SUFFIX,
        "n_workers": spec_utils.N_WORKERS,
        "lulc_bas_path": {
            **spec_utils.LULC,
            "projected": True,
            "projection_units": u.meter,
            "about": gettext(
                "A map of LULC for the baseline scenario. "
                "All values in this raster must have corresponding "
                "entries in the Carbon Pools table."),
            "name": gettext("baseline LULC")
        },
        "calc_sequestration": {
            "type": "boolean",
            "required": "do_valuation",
            "about": gettext(
                "Run sequestration analysis. This requires inputs "
                "of LULC maps for both baseline and alternate "
                "scenarios. Required if run valuation model is selected."),
            "name": gettext("calculate sequestration")
        },
        "lulc_alt_path": {
            **spec_utils.LULC,
            "projected": True,
            "projection_units": u.meter,
            "required": "calc_sequestration",
            "about": gettext(
                "A map of LULC for the alternate scenario. "
                "All values in this raster must have corresponding entries in "
                "the Carbon Pools table. Required if Calculate Sequestration "
                "is selected."),
            "name": gettext("alternate LULC")
        },
        "carbon_pools_path": {
            "type": "csv",
            "columns": {
                "lucode": spec_utils.LULC_TABLE_COLUMN,
                "c_above": {
                    "type": "number",
                    "units": u.metric_ton/u.hectare,
                    "about": gettext("Carbon density of aboveground biomass.")},
                "c_below": {
                    "type": "number",
                    "units": u.metric_ton/u.hectare,
                    "about": gettext("Carbon density of belowground biomass.")},
                "c_soil": {
                    "type": "number",
                    "units": u.metric_ton/u.hectare,
                    "about": gettext("Carbon density of soil.")},
                "c_dead": {
                    "type": "number",
                    "units": u.metric_ton/u.hectare,
                    "about": gettext("Carbon density of dead matter.")}
            },
            "index_col": "lucode",
            "about": gettext(
                "A table that maps each LULC code to carbon pool data for "
                "that LULC type."),
            "name": gettext("carbon pools")
        },
        "lulc_bas_year": {
            "expression": "float(value).is_integer()",
            "type": "number",
            "units": u.year_AD,
            "required": "do_valuation",
            "about": gettext(
                "The calendar year of the baseline scenario depicted in the "
                "baseline LULC map. Required if Run Valuation model is selected."),
            "name": gettext("baseline LULC year")
        },
        "lulc_alt_year": {
            "expression": "float(value).is_integer() and value > MODEL_SPEC['lulc_bas_year']",
            "type": "number",
            "units": u.year_AD,
            "required": "do_valuation",
            "about": gettext(
                "The calendar year of the alternate scenario depicted in the "
                "alternate LULC map. Required if Run Valuation model is selected."),
            "name": gettext("alternate LULC year")
        },
        "do_valuation": {
            "type": "boolean",
            "required": False,
            "about": gettext(
                "Calculate net present value for the alternate scenario "
                "and report it in the final HTML document."),
            "name": gettext("run valuation model")
        },
        "price_per_metric_ton_of_c": {
            "type": "number",
            "units": u.currency/u.metric_ton,
            "required": "do_valuation",
            "about": gettext(
                "The present value of carbon. "
                "Required if Run Valuation model is selected."),
            "name": gettext("price of carbon")
        },
        "discount_rate": {
            "type": "ratio",
            "required": "do_valuation",
            "about": gettext(
                "The annual market discount rate in the price of carbon, "
                "which reflects society's preference for immediate benefits "
                "over future benefits. Required if Run Valuation model is "
                "selected. This assumes that the baseline scenario is current "
                "and the alternate scenario is in the future."),
            "name": gettext("annual market discount rate")
        },
        "rate_change": {
            "type": "ratio",
            "required": "do_valuation",
            "about": gettext(
                "The relative annual change of the price of carbon. "
                "Required if Run Valuation model is selected."),
            "name": gettext("annual price change")
        }
    },
    "outputs": {
        "report.html": {
            "about": "This file presents a summary of all data computed by the model. It also includes descriptions of all other output files produced by the model, so it is a good place to begin exploring and understanding model results. Because this is an HTML file, it can be opened with any web browser."
        },
        "tot_c_bas.tif": {
            "about": "Raster showing the amount of carbon stored in each pixel for the baseline scenario. It is a sum of all of the carbon pools provided by the biophysical table.",
            "bands": {1: {
                "type": "number",
                "units": u.metric_ton/u.hectare
            }}
        },
        "tot_c_alt.tif": {
            "about": "Raster showing the amount of carbon stored in each pixel for the alternate scenario. It is a sum of all of the carbon pools provided by the biophysical table.",
            "bands": {1: {
                "type": "number",
                "units": u.metric_ton/u.hectare
            }},
            "created_if": "lulc_alt_path"
        },
        "delta_bas_alt.tif": {
            "about": "Raster showing the difference in carbon stored between the alternate landscape and the baseline landscape. In this map some values may be negative and some positive. Positive values indicate sequestered carbon, negative values indicate carbon that was lost.",
            "bands": {1: {
                "type": "number",
                "units": u.metric_ton/u.hectare
            }},
            "created_if": "lulc_alt_path"
        },
        "npv_alt.tif": {
            "about": "Rasters showing the economic value of carbon sequestered between the baseline and the alternate landscape dates.",
            "bands": {1: {
                "type": "number",
                "units": u.currency/u.hectare
            }},
            "created_if": "lulc_alt_path"
        },
        "intermediate_outputs": {
            "type": "directory",
            "contents": {
                **CARBON_OUTPUTS
            }
        },
        "taskgraph_cache": spec_utils.TASKGRAPH_DIR
    }
}

_OUTPUT_BASE_FILES = {
    'tot_c_bas': 'tot_c_bas.tif',
    'tot_c_alt': 'tot_c_alt.tif',
    'delta_bas_alt': 'delta_bas_alt.tif',
    'npv_alt': 'npv_alt.tif',
    'html_report': 'report.html',
}

_INTERMEDIATE_BASE_FILES = {
    'c_above_bas': 'c_above_bas.tif',
    'c_below_bas': 'c_below_bas.tif',
    'c_soil_bas': 'c_soil_bas.tif',
    'c_dead_bas': 'c_dead_bas.tif',
    'c_above_alt': 'c_above_alt.tif',
    'c_below_alt': 'c_below_alt.tif',
    'c_soil_alt': 'c_soil_alt.tif',
    'c_dead_alt': 'c_dead_alt.tif',
}

_TMP_BASE_FILES = {
    'aligned_lulc_bas_path': 'aligned_lulc_bas.tif',
    'aligned_lulc_alt_path': 'aligned_lulc_alt.tif',
}

# -1.0 since carbon stocks are 0 or greater
_CARBON_NODATA = -1.0


def execute(args):
    """Carbon.

    Calculate the amount of carbon stocks given a landscape, or the difference
    due to some change, and calculate economic valuation on those scenarios.

    The model can operate on a single scenario or a combined baseline and
    alternate scenario.

    Args:
        args['workspace_dir'] (string): a path to the directory that will
            write output and other temporary files during calculation.
        args['results_suffix'] (string): appended to any output file name.
        args['lulc_bas_path'] (string): a path to a raster representing the
            baseline carbon stocks.
        args['calc_sequestration'] (bool): if true, sequestration should
            be calculated and 'lulc_alt_path' should be defined.
        args['lulc_alt_path'] (string): a path to a raster representing alternate
            landcover scenario.  Optional, but if present and well defined
            will trigger a sequestration calculation.
        args['carbon_pools_path'] (string): path to CSV or that indexes carbon
            storage density to lulc codes. (required if 'do_uncertainty' is
            false)
        args['lulc_bas_year'] (int/string): an integer representing the year
            of `args['lulc_bas_path']` used if `args['do_valuation']`
            is True.
        args['lulc_alt_year'](int/string): an integer representing the year
            of `args['lulc_alt_path']` used in valuation if it exists.
            Required if  `args['do_valuation']` is True and
            `args['lulc_alt_path']` is present and well defined.
        args['do_valuation'] (bool): if true then run the valuation model on
            available outputs. Calculate NPV for an alternate scenario and
            report in final HTML document.
        args['price_per_metric_ton_of_c'] (float): Is the present value of
            carbon per metric ton. Used if `args['do_valuation']` is present
            and True.
        args['discount_rate'] (float): Discount rate used if NPV calculations
            are required.  Used if `args['do_valuation']` is  present and
            True.
        args['rate_change'] (float): Annual rate of change in price of carbon
            as a percentage.  Used if `args['do_valuation']` is  present and
            True.
        args['n_workers'] (int): (optional) The number of worker processes to
            use for processing this model.  If omitted, computation will take
            place in the current process.

    Returns:
        None.
    """
    file_suffix = utils.make_suffix_string(args, 'results_suffix')
    intermediate_output_dir = os.path.join(
        args['workspace_dir'], 'intermediate_outputs')
    output_dir = args['workspace_dir']
    utils.make_directories([intermediate_output_dir, output_dir])

    LOGGER.info('Building file registry')
    file_registry = utils.build_file_registry(
        [(_OUTPUT_BASE_FILES, output_dir),
         (_INTERMEDIATE_BASE_FILES, intermediate_output_dir),
         (_TMP_BASE_FILES, output_dir)], file_suffix)

    if args['do_valuation'] and args['lulc_bas_year'] >= args['lulc_alt_year']:
        raise ValueError(
            f"Invalid input: The Alternate LULC Year ({args['lulc_alt_year']}) "
            "must be greater than the Baseline LULC Year ({args['lulc_bas_year']}). "
            "Ensure that the Baseline LULC Year is earlier than the Alternate LULC Year."
        )

    carbon_pool_df = validation.get_validated_dataframe(
        args['carbon_pools_path'], **MODEL_SPEC['args']['carbon_pools_path'])

    try:
        n_workers = int(args['n_workers'])
    except (KeyError, ValueError, TypeError):
        # KeyError when n_workers is not present in args
        # ValueError when n_workers is an empty string.
        # TypeError when n_workers is None.
        n_workers = -1  # Synchronous mode.
    graph = taskgraph.TaskGraph(
        os.path.join(args['workspace_dir'], 'taskgraph_cache'), n_workers)

    cell_size_set = set()
    raster_size_set = set()
    valid_lulc_keys = []
    valid_scenarios = []
    tifs_to_summarize = set()  # passed to _generate_report()

    for scenario_type in ['bas', 'alt']:
        lulc_key = "lulc_%s_path" % (scenario_type)
        if lulc_key in args and args[lulc_key]:
            raster_info = pygeoprocessing.get_raster_info(args[lulc_key])
            cell_size_set.add(raster_info['pixel_size'])
            raster_size_set.add(raster_info['raster_size'])
            valid_lulc_keys.append(lulc_key)
            valid_scenarios.append(scenario_type)
    if len(cell_size_set) > 1:
        raise ValueError(
            "the pixel sizes of %s are not equivalent. Here are the "
            "different sets that were found in processing: %s" % (
                valid_lulc_keys, cell_size_set))
    if len(raster_size_set) > 1:
        raise ValueError(
            "the raster dimensions of %s are not equivalent. Here are the "
            "different sizes that were found in processing: %s" % (
                valid_lulc_keys, raster_size_set))

    # calculate total carbon storage
    LOGGER.info('Map all carbon pools to carbon storage rasters.')
    carbon_map_task_lookup = {}
    sum_rasters_task_lookup = {}
    for scenario_type in valid_scenarios:
        carbon_map_task_lookup[scenario_type] = []
        storage_path_list = []
        for pool_type in ['c_above', 'c_below', 'c_soil', 'c_dead']:
            carbon_pool_by_type = carbon_pool_df[pool_type].to_dict()

            lulc_key = 'lulc_%s_path' % scenario_type
            storage_key = '%s_%s' % (pool_type, scenario_type)
            LOGGER.info(
                "Mapping carbon from '%s' to '%s' scenario.",
                lulc_key, storage_key)

            carbon_map_task = graph.add_task(
                _generate_carbon_map,
                args=(args[lulc_key], carbon_pool_by_type,
                      file_registry[storage_key]),
                target_path_list=[file_registry[storage_key]],
                task_name='carbon_map_%s' % storage_key)
            storage_path_list.append(file_registry[storage_key])
            carbon_map_task_lookup[scenario_type].append(carbon_map_task)

        output_key = 'tot_c_' + scenario_type
        LOGGER.info(
            "Calculate carbon storage for '%s'", output_key)

        sum_rasters_task = graph.add_task(
            func=pygeoprocessing.raster_map,
            kwargs=dict(
                op=sum_op,
                rasters=storage_path_list,
                target_path=file_registry[output_key],
                target_nodata=_CARBON_NODATA),
            target_path_list=[file_registry[output_key]],
            dependent_task_list=carbon_map_task_lookup[scenario_type],
            task_name='sum_rasters_for_total_c_%s' % output_key)
        sum_rasters_task_lookup[scenario_type] = sum_rasters_task
        tifs_to_summarize.add(file_registry[output_key])

    # calculate sequestration
    diff_rasters_task_lookup = {}
    if 'alt' in valid_scenarios:
        output_key = 'delta_bas_alt'
        LOGGER.info("Calculate sequestration scenario '%s'", output_key)

        diff_rasters_task = graph.add_task(
            func=pygeoprocessing.raster_map,
            kwargs=dict(
                op=numpy.subtract,  # delta = scenario C - baseline C
                rasters=[file_registry['tot_c_alt'],
                         file_registry['tot_c_bas']],
                target_path=file_registry[output_key],
                target_nodata=_CARBON_NODATA),
            target_path_list=[file_registry[output_key]],
            dependent_task_list=[
                sum_rasters_task_lookup['bas'],
                sum_rasters_task_lookup['alt']],
            task_name='diff_rasters_for_%s' % output_key)
        diff_rasters_task_lookup['alt'] = diff_rasters_task
        tifs_to_summarize.add(file_registry[output_key])

    # calculate net present value
    calculate_npv_tasks = []
    if 'do_valuation' in args and args['do_valuation']:
        LOGGER.info('Constructing valuation formula.')
        valuation_constant = _calculate_valuation_constant(
            int(args['lulc_bas_year']), int(args['lulc_alt_year']),
            float(args['discount_rate']), float(args['rate_change']),
            float(args['price_per_metric_ton_of_c']))

        if 'alt' in valid_scenarios:
            output_key = 'npv_alt'
            LOGGER.info("Calculating NPV for scenario 'alt'")

            calculate_npv_task = graph.add_task(
                _calculate_npv,
                args=(file_registry['delta_bas_alt'],
                      valuation_constant, file_registry[output_key]),
                target_path_list=[file_registry[output_key]],
                dependent_task_list=[diff_rasters_task_lookup['alt']],
                task_name='calculate_%s' % output_key)
            calculate_npv_tasks.append(calculate_npv_task)
            tifs_to_summarize.add(file_registry[output_key])

    # Report aggregate results
    tasks_to_report = (list(sum_rasters_task_lookup.values())
                       + list(diff_rasters_task_lookup.values())
                       + calculate_npv_tasks)
    _ = graph.add_task(
        _generate_report,
        args=(tifs_to_summarize, args, file_registry),
        target_path_list=[file_registry['html_report']],
        dependent_task_list=tasks_to_report,
        task_name='generate_report')
    graph.join()

    for tmp_filename_key in _TMP_BASE_FILES:
        try:
            tmp_filename = file_registry[tmp_filename_key]
            if os.path.exists(tmp_filename):
                os.remove(tmp_filename)
        except OSError as os_error:
            LOGGER.warning(
                "Can't remove temporary file: %s\nOriginal Exception:\n%s",
                file_registry[tmp_filename_key], os_error)


# element-wise sum function to pass to raster_map
def sum_op(*xs): return numpy.sum(xs, axis=0)


def _accumulate_totals(raster_path):
    """Sum all non-nodata pixels in `raster_path` and return result."""
    nodata = pygeoprocessing.get_raster_info(raster_path)['nodata'][0]
    raster_sum = 0.0
    for _, block in pygeoprocessing.iterblocks((raster_path, 1)):
        # The float64 dtype in the sum is needed to reduce numerical error in
        # the sum.  Users calculated the sum with ArcGIS zonal statistics,
        # noticed a difference and wrote to us about it on the forum.
        raster_sum += numpy.sum(
            block[~pygeoprocessing.array_equals_nodata(
                    block, nodata)], dtype=numpy.float64)
    return raster_sum


def _generate_carbon_map(
        lulc_path, carbon_pool_by_type, out_carbon_stock_path):
    """Generate carbon stock raster by mapping LULC values to carbon pools.

    Args:
        lulc_path (string): landcover raster with integer pixels.
        out_carbon_stock_path (string): path to output raster that will have
            pixels with carbon storage values in them with units of Mg/ha.
        carbon_pool_by_type (dict): a dictionary that maps landcover values
            to carbon storage densities per area (Mg C/Ha).

    Returns:
        None.
    """
    carbon_stock_by_type = dict([
        (lulcid, stock)
        for lulcid, stock in carbon_pool_by_type.items()])

    reclass_error_details = {
        'raster_name': 'LULC', 'column_name': 'lucode',
        'table_name': 'Carbon Pools'}
    utils.reclassify_raster(
        (lulc_path, 1), carbon_stock_by_type, out_carbon_stock_path,
        gdal.GDT_Float32, _CARBON_NODATA, reclass_error_details)


def _calculate_valuation_constant(
        lulc_bas_year, lulc_alt_year, discount_rate, rate_change,
        price_per_metric_ton_of_c):
    """Calculate a net present valuation constant to multiply carbon storage.

    Args:
        lulc_bas_year (int): calendar year for baseline
        lulc_alt_year (int): calendar year for alternate
        discount_rate (float): annual discount rate as a percentage
        rate_change (float): annual change in price of carbon as a percentage
        price_per_metric_ton_of_c (float): currency amount of Mg of carbon

    Returns:
        a floating point number that can be used to multiply a delta carbon
        storage value by to calculate NPV.
    """
    n_years = lulc_alt_year - lulc_bas_year
    ratio = (
        1 / ((1 + discount_rate / 100) *
             (1 + rate_change / 100)))
    valuation_constant = (price_per_metric_ton_of_c / n_years)
    # note: the valuation formula in the user's guide uses sum notation.
    # here it's been simplified to remove the sum using the general rule
    # sum(r^k) from k=0 to N  ==  (r^(N+1) - 1) / (r - 1)
    # where N = n_years-1 and r = ratio
    if ratio == 1:
        # if ratio == 1, we would divide by zero in the equation below
        # so use the limit as ratio goes to 1, which is n_years
        valuation_constant *= n_years
    else:
        valuation_constant *= (1 - ratio ** n_years) / (1 - ratio)
    return valuation_constant


def _calculate_npv(delta_carbon_path, valuation_constant, npv_out_path):
    """Calculate net present value.

    Args:
        delta_carbon_path (string): path to change in carbon storage over
            time.
        valuation_constant (float): value to multiply each carbon storage
            value by to calculate NPV.
        npv_out_path (string): path to output net present value raster.

    Returns:
        None.
    """
    pygeoprocessing.raster_map(
        op=lambda carbon: carbon * valuation_constant,
        rasters=[delta_carbon_path],
        target_path=npv_out_path)


def _generate_report(raster_file_set, model_args, file_registry):
    """Generate a human readable HTML report of summary stats of model run.

    Args:
        raster_file_set (set): paths to rasters that need summary stats.
        model_args (dict): InVEST argument dictionary.
        file_registry (dict): file path dictionary for InVEST workspace.

    Returns:
        None.
    """
    html_report_path = file_registry['html_report']
    with codecs.open(html_report_path, 'w', encoding='utf-8') as report_doc:
        # Boilerplate header that defines style and intro header.
        header = (
            """
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="utf-8">
            <title>Carbon Results</title>
            <style type="text/css">
                body {
                    --invest-green: #148f68;
                    background: #ffffff;
                    color: #000000;
                    font-family: Roboto, "Helvetica Neue", Arial, sans-serif;
                }
                h1, h2, th {
                    font-weight: bold;
                }
                h1, h2 {
                    color: var(--invest-green);
                }
                h1 {
                    font-size: 2rem;
                }
                h2 {
                    font-size: 1.5rem;
                }
                table {
                    border: 0.25rem solid var(--invest-green);
                    border-collapse: collapse;
                }
                thead tr {
                    background: #e9ecef;
                    border-bottom: 0.1875rem solid var(--invest-green);
                }
                tbody tr:nth-child(even) {
                    background: ghostwhite;
                }
                th {
                    padding: 0.5rem;
                    text-align:left;
                }
                td {
                    padding: 0.375rem 0.5rem;
                }
                .number {
                    text-align: right;
                    font-family: monospace;
                }
            </style>
            </head>
            <body>
            <h1>InVEST Carbon Model Results</h1>
            <p>This document summarizes the results from
            running the InVEST carbon model with the following data.</p>
            """
        )

        report_doc.write(header)
        report_doc.write('<p>Report generated at %s</p>' % (
            time.strftime("%Y-%m-%d %H:%M")))

        # Report input arguments
        report_doc.write('<h2>Inputs</h2>')
        report_doc.write('<table><thead><tr><th>arg id</th><th>arg value</th>'
                         '</tr></thead><tbody>')
        for key, value in model_args.items():
            report_doc.write('<tr><td>%s</td><td>%s</td></tr>' % (key, value))
        report_doc.write('</tbody></table>')

        # Report aggregate results
        report_doc.write('<h2>Aggregate Results</h2>')
        report_doc.write(
            '<table><thead><tr><th>Description</th><th>Value</th><th>Units'
            '</th><th>Raw File</th></tr></thead><tbody>')

        carbon_units = 'metric tons'

        # value lists are [sort priority, description, statistic, units]
        report = [
            (file_registry['tot_c_bas'], 'Total bas', carbon_units),
            (file_registry['tot_c_alt'], 'Total alt', carbon_units),
            (file_registry['delta_bas_alt'], 'Change in C for alt',
             carbon_units),
            (file_registry['npv_alt'],
             'Net present value from bas to alt', 'currency units'),
        ]

        for raster_uri, description, units in report:
            if raster_uri in raster_file_set:
                total = _accumulate_totals(raster_uri)
                raster_info = pygeoprocessing.get_raster_info(raster_uri)
                pixel_area = abs(numpy.prod(raster_info['pixel_size']))
                # Since each pixel value is in Mg/ha, ``total`` is in (Mg/ha * px) = Mg•px/ha.
                # Adjusted sum = ([total] Mg•px/ha) * ([pixel_area] m^2 / 1 px) * (1 ha / 10000 m^2) = Mg.
                summary_stat = total * pixel_area / 10000
                report_doc.write(
                    '<tr><td>%s</td><td class="number" data-summary-stat="%s">'
                    '%.2f</td><td>%s</td><td>%s</td></tr>' % (
                        description, description, summary_stat, units,
                        raster_uri))
        report_doc.write('</tbody></table></body></html>')


@validation.invest_validator
def validate(args, limit_to=None):
    """Validate args to ensure they conform to `execute`'s contract.

    Args:
        args (dict): dictionary of key(str)/value pairs where keys and
            values are specified in `execute` docstring.
        limit_to (str): (optional) if not None indicates that validation
            should only occur on the args[limit_to] value. The intent that
            individual key validation could be significantly less expensive
            than validating the entire `args` dictionary.

    Returns:
        list of ([invalid key_a, invalid_keyb, ...], 'warning/error message')
            tuples. Where an entry indicates that the invalid keys caused
            the error message in the second part of the tuple. This should
            be an empty list if validation succeeds.
    """
    return validation.validate(
        args, MODEL_SPEC['args'], MODEL_SPEC['args_with_spatial_overlap'])
