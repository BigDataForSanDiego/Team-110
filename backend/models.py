from pathlib import Path
import json
from threading import Lock

_lock = Lock()


def _data_file(name: str) -> Path:
    
    base = Path(__file__).resolve().parent.parent
    return base / 'data' / name

def _load(filename: str):
    path = _data_file(filename)
    if not path.exists():
        return []
    try:
        with path.open('r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []


def _save(filename: str, data):
    path = _data_file(filename)
    # write atomically
    temp = path.with_suffix('.tmp')
    with _lock:
        with temp.open('w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        temp.replace(path)


def get_posts():
    return _load('initial_posts.json')


def add_post(post: dict):
    posts = _load('initial_posts.json')
    posts.append(post)
    _save('initial_posts.json', posts)


def get_resources():
    return _load('initial_resources.json')


def add_resource(resource: dict):
    resources = _load('initial_resources.json')
    # Initialize clicks tracking
    resource['clicks_remaining'] = resource.get('clicks_limit', 10)  # default 10 clicks if not specified
    resource['id'] = str(len(resources))  # Simple ID for tracking
    resources.append(resource)
    _save('initial_resources.json', resources)

def click_resource(resource_id: str) -> bool:
    """Returns True if resource still exists, False if it was removed due to no clicks remaining."""
    resources = _load('initial_resources.json')
    for resource in resources:
        if resource.get('id') == resource_id:
            clicks = resource.get('clicks_remaining', 0)
            if clicks <= 1:  # Remove if this was the last click
                resources.remove(resource)
                _save('initial_resources.json', resources)
                return False
            resource['clicks_remaining'] = clicks - 1
            _save('initial_resources.json', resources)
            return True
    return False  # Resource not found
