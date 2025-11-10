from flask import Flask, jsonify
import json

app = Flask(__name__)

@app.route('/resources')
def get_resources():
    with open('../data/initial_resources.json') as f:
        resources = json.load(f)
    return jsonify(resources)

if __name__ == '__main__':
    app.run(debug=True)
