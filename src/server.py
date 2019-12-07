import importlib
import json
import sys

from flask import Flask
from flask import request
import natcap.invest.cli

app = Flask(__name__)

MODEL_MODULE_MAP = {
    "carbon": "carbon",
    "coastal_blue_carbon": "coastal_blue_carbon.coastal_blue_carbon",
    "coastal_blue_carbon_preprocessor": "coastal_blue_carbon.preprocessor",
    "coastal_vulnerability": "coastal_vulnerability",
    "crop_production_percentile": "crop_production_percentile",
    "crop_production_regression": "crop_production_regression",
    "delineateit": "delineateit",
    "finfish_aquaculture": "finfish_aquaculture.finfish_aquaculture",
    "fisheries": "fisheries.fisheries",
    "fisheries_hst": "fisheries.fisheries_hst",
    "forest_carbon_edge_effect": "forest_carbon_edge_effect",
    "globio": "globio",
    "habitat_quality": "habitat_quality",
    "habitat_risk_assessment": "hra",
    "hydropower_water_yield": "hydropower.hydropower_water_yield",
    "ndr": "ndr.ndr",
    "pollination": "pollination",
    "recreation": "recreation.recmodel_client",
    "routedem": "routedem",
    "scenario_generator_proximity": "scenario_gen_proximity",
    "scenic_quality": "scenic_quality.scenic_quality",
    "sdr": "sdr.sdr",
    "seasonal_water_yield": "seasonal_water_yield",
    "urban_flood_risk_mitigation": "urban_flood_risk_mitigation",
    "wave_energy": "wave_energy",
    "wind_energy": "wind_energy"
}


def shutdown_server():
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    func()

@app.route('/ready', methods=['GET'])
def get_is_ready():
    return json.dumps('Flask ready')


@app.route('/shutdown', methods=['POST'])
def shutdown():
    shutdown_server()
    return 'Flask server shutting down...'


@app.route('/models', methods=['GET'])
def get_invest_models():
    return natcap.invest.cli.build_model_list_json()


@app.route('/getspec', methods=['POST'])
def get_invest_getspec():
    target_model = request.get_json()['model']
    target_module = 'natcap.invest.' + MODEL_MODULE_MAP[target_model]
    model_module = importlib.import_module(name=target_module)
    spec = model_module.ARGS_SPEC
    return json.dumps(spec)


@app.route('/validate', methods=['POST'])
def get_invest_validate():
    payload = request.get_json()
    target_module = payload['model_module']
    args_dict = json.loads(payload['args'])
    try:
        limit_to = payload['limit_to']
    except KeyError:
        limit_to = None
    # target_module = 'natcap.invest.' + MODEL_MODULE_MAP[target_model]
    model_module = importlib.import_module(name=target_module)
    results = model_module.validate(args_dict, limit_to=limit_to)
    return json.dumps(results)
