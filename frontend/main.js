// Single clean frontend script: adds 'Use' and 'Directions' buttons in resource popups
document.addEventListener('DOMContentLoaded', () => {
  const postsList = document.getElementById('postsList');
  const postForm = document.getElementById('postForm');
  const postInput = document.getElementById('postInput');

  const resourceForm = document.getElementById('resourceForm');
  const resName = document.getElementById('resName');
  const resType = document.getElementById('resType');
  const resNotes = document.getElementById('resNotes');
  const resLat = document.getElementById('resLat');
  const resLon = document.getElementById('resLon');
  const resourceMsg = document.getElementById('resourceMsg');
  const centerMe = document.getElementById('centerMe');

  if (typeof L === 'undefined') {
    const mapEl = document.getElementById('map');
    if (mapEl) mapEl.innerHTML = '<p style="color: red; padding: 16px;">Map failed to load. Check network or CDN.</p>';
    console.error('Leaflet (L) is not available.');
    return;
  }

  const map = L.map('map').setView([32.7157, -117.1611], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  const resourcesLayer = L.layerGroup().addTo(map);

  function escapeHtml(str){
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  const resourceIcons = {
    water: L.icon({iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41]}),
    food: L.icon({iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41]}),
    shelter: L.icon({iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl:'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41]})
  };

  function getResourceIcon(type){
    const k = (type||'').toLowerCase().trim();
    return resourceIcons[k] || L.Icon.Default.prototype;
  }

  function renderPosts(items){
    postsList.innerHTML = '';
    if (!items || items.length === 0){ postsList.innerHTML = '<div class="post-card">No posts yet — be the first to share.</div>'; return; }
    items.slice().reverse().forEach(p=>{
      const card = document.createElement('div'); card.className='post-card';
      const meta = document.createElement('div'); meta.className='meta'; meta.textContent = p.created_at || '';
      const content = document.createElement('div'); content.textContent = p.content || '';
      card.appendChild(meta); card.appendChild(content); postsList.appendChild(card);
    });
  }

  function fetchPosts(){ fetch('http://127.0.0.1:5000/posts').then(r=>r.json()).then(renderPosts).catch(e=>console.error('posts fetch',e)); }

  function fetchResources(){
    fetch('http://127.0.0.1:5000/resources').then(r=>r.json()).then(data=>{
      resourcesLayer.clearLayers();
      data.forEach(r=>{
        const icon = getResourceIcon(r.type);
        const m = L.marker([r.lat, r.lon], {icon}).addTo(resourcesLayer);
        const clicks = r.clicks_remaining != null ? r.clicks_remaining : 0;
        const popupHtml = `
          <div class="resource-popup">
            <b>${escapeHtml(r.name)}</b>
            <div>${escapeHtml(r.type||'')}</div>
            <div>${escapeHtml(r.notes||'')}</div>
            <div><small>${clicks} clicks remaining</small></div>
            <div class="popup-actions">
              ${r.id?`<button class="btn use-btn" data-id="${escapeHtml(r.id)}">Use</button>`:''}
              <a class="btn directions" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lon}">Directions</a>
            </div>
          </div>
        `;
        m.bindPopup(popupHtml);
        m.on('popupopen', function(e){
          const popupNode = e.popup.getElement(); if (!popupNode) return;
          const useBtn = popupNode.querySelector('.use-btn');
          if (useBtn){
            const handler = function(){
              const id = this.getAttribute('data-id'); if (!id) return;
              fetch(`http://127.0.0.1:5000/resources/${id}/click`, {method:'POST'})
                .then(r=>r.json()).then(resp=>{ if (!resp.exists){ resourcesLayer.removeLayer(m); } else { fetchResources(); } })
                .catch(err=>console.error('click error',err));
            };
            // attach once
            useBtn.removeEventListener('click', handler);
            useBtn.addEventListener('click', handler);
          }
        });
      });
    }).catch(e=>console.error('resources fetch', e));
  }

  // initial load and polling
  fetchResources(); fetchPosts(); setInterval(fetchResources,7000); setInterval(fetchPosts,6000);

  // post submit
  postForm.addEventListener('submit', e=>{ e.preventDefault(); const content = postInput.value && postInput.value.trim(); if (!content) return; fetch('http://127.0.0.1:5000/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content})}).then(r=>r.json()).then(()=>{ postInput.value=''; fetchPosts(); }).catch(e=>console.error('post create',e)); });

  // resource submit
  resourceForm.addEventListener('submit', e=>{
    e.preventDefault(); const payload = { name:(resName.value||'').trim(), type:(resType.value||'').trim(), notes:(resNotes.value||'').trim(), lat:parseFloat(resLat.value), lon:parseFloat(resLon.value) };
    if (!payload.name || !isFinite(payload.lat) || !isFinite(payload.lon)){ resourceMsg.textContent='Name, latitude and longitude are required and must be valid numbers.'; resourceMsg.style.color='var(--danger)'; return; }
    fetch('http://127.0.0.1:5000/resources',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(r=>r.json()).then(()=>{ resourceMsg.textContent='Resource pinged — thanks!'; resourceMsg.style.color='inherit'; resName.value=''; resType.value=''; resNotes.value=''; resLat.value=''; resLon.value=''; fetchResources(); }).catch(e=>{ resourceMsg.textContent='Failed to ping resource'; resourceMsg.style.color='var(--danger)'; console.error(e); });
  });

  // map click fills coords
  map.on('click', function(e){ const lat = e.latlng.lat.toFixed(6); const lon = e.latlng.lng.toFixed(6); if (resLat) resLat.value = lat; if (resLon) resLon.value = lon; });

  centerMe && centerMe.addEventListener('click', ()=>{ if (!navigator.geolocation){ alert('Geolocation not supported'); return; } navigator.geolocation.getCurrentPosition(pos=>{ map.setView([pos.coords.latitude, pos.coords.longitude], 15); }, ()=>{ alert('Unable to get your location'); }); });

  setTimeout(()=>{ try{ map.invalidateSize(); }catch(e){} },500);
});
