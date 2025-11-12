from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from pathlib import Path
from datetime import datetime
import sys
import os

# Ensure backend directory is on sys.path so we can import models when running
# from the repo root (e.g. `python backend/app.py`).
sys.path.insert(0, str(Path(__file__).resolve().parent))
import models

app = Flask(__name__)
CORS(app)


@app.route('/')
def hello():
    return "Hello, World!"


@app.route('/posts', methods=['GET'])
def posts_list():
    """Return list of posts (most recent last)."""
    return jsonify(models.get_posts())


@app.route('/posts', methods=['POST'])
def posts_create():
    data = request.get_json() or {}
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': 'content is required'}), 400

    post = {
        'content': content,
        'created_at': datetime.utcnow().isoformat() + 'Z'
    }
    models.add_post(post)
    return jsonify(post), 201


@app.route('/resources')
def resources_list():
    return jsonify(models.get_resources())

@app.route('/resources/<resource_id>/click', methods=['POST'])
def resource_click(resource_id):
    """Record a click on a resource, potentially removing it if clicks exhausted."""
    exists = models.click_resource(resource_id)
    return jsonify({'exists': exists})


@app.route('/resources', methods=['POST'])
def resources_create():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    rtype = (data.get('type') or '').strip()
    notes = (data.get('notes') or '').strip()
    lat = data.get('lat')
    lon = data.get('lon')

    if not name or lat is None or lon is None:
        return jsonify({'error': 'name, lat and lon are required'}), 400

    try:
        lat = float(lat)
        lon = float(lon)
    except (TypeError, ValueError):
        return jsonify({'error': 'lat and lon must be numbers'}), 400

    resource = {
        'name': name,
        'type': rtype or 'unknown',
        'notes': notes,
        'lat': lat,
        'lon': lon,
        'created_at': datetime.utcnow().isoformat() + 'Z'
    }
    models.add_resource(resource)
    return jsonify(resource), 201


if __name__ == '__main__':
    # Bind to 127.0.0.1 for local dev
    app.run(debug=True, host='127.0.0.1', port=5000)
