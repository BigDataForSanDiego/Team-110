// Initialize map
var map = L.map('map').setView([32.7157, -117.1611], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Fetch resources
fetch('http://127.0.0.1:5000/resources')
  .then(res => res.json())
  .then(data => {
    data.forEach(r => {
      L.marker([r.lat, r.lon]).addTo(map)
        .bindPopup(`<b>${r.name}</b><br>${r.type}<br>${r.notes}`);
    });
  });

const postForm = document.getElementById('postForm');
const postInput = document.getElementById('postInput');
const postsDiv = document.getElementById('posts');

postForm.addEventListener('submit', e => {
    e.preventDefault();
    const content = postInput.value;
    fetch('http://127.0.0.1:5000/posts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content})
    }).then(() => {
        const p = document.createElement('p');
        p.textContent = content;
        postsDiv.appendChild(p);
        postInput.value = '';
    });
});
