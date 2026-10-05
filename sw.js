/* Le Saint Teh : mode hors ligne. La copie en cache est servie tout de suite, puis rafraîchie en arrière-plan. */
const V='lst-10db32c1';
const SHELL=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET'||!/^https?:/.test(r.url))return;
  e.respondWith(caches.open(V).then(async c=>{
    const hit=await c.match(r,{ignoreSearch:r.mode==='navigate'});
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    const res=await net;return res||new Response('Hors ligne',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }));
});
