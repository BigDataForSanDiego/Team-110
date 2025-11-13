// Small IndexedDB helper for queuing failed requests
(function(window){
  const DB_NAME = 'linkedout-offline-db';
  const STORE_NAME = 'requests';
  const DB_VERSION = 1;

  function openDB(){
    return new Promise((resolve, reject)=>{
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e){
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)){
          db.createObjectStore(STORE_NAME, {keyPath: 'id'});
        }
      };
      req.onsuccess = function(e){ resolve(e.target.result); };
      req.onerror = function(e){ reject(e.target.error); };
    });
  }

  async function enqueueRequest(obj){
    const db = await openDB();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const id = obj.id || (Date.now().toString() + '-' + Math.random().toString(36).slice(2,9));
      const entry = Object.assign({id, createdAt: new Date().toISOString()}, obj);
      const r = store.put(entry);
      r.onsuccess = ()=>{ resolve(entry); };
      r.onerror = (e)=>{ reject(e.target.error); };
    });
  }

  async function getAllQueued(){
    const db = await openDB();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = ()=> resolve(req.result || []);
      req.onerror = (e)=> reject(e.target.error);
    });
  }

  async function dequeue(id){
    const db = await openDB();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = ()=> resolve();
      req.onerror = (e)=> reject(e.target.error);
    });
  }

  async function clearQueue(){
    const db = await openDB();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = ()=> resolve();
      req.onerror = (e)=> reject(e.target.error);
    });
  }

  window.offlineDB = {
    enqueueRequest,
    getAllQueued,
    dequeue,
    clearQueue
  };
})(window);
