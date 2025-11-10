from flask import Flask, jsonify, request
import json

app = Flask(__name__)

@app.route('/resources')
def get_resources():
    with open('../data/initial_resources.json') as f:
        resources = json.load(f)
    return jsonify(resources)

if __name__ == '__main__':
    app.run(debug=True)


posts = []

@app.route('/posts')
def get_posts():
    return jsonify(posts)

@app.route('/posts', methods=['POST'])
def add_post():
    data = request.json
    posts.append({"content": data['content']})
    return jsonify({"status": "success"}), 201
