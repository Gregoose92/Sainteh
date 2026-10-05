/* Le Saint Teh : mode hors ligne.
   Les fichiers de l'appli sont pris sur le réseau quand il répond (tout le monde a ainsi la même version),
   et dans la copie locale sinon. */
const V='lst-6';
const SHELL=['./','index.html','manifest.webmanifest','peerjs.min.js','qrcode.js','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET'||!/^https?:/.test(r.url))return;
  const same=new URL(r.url).origin===self.location.origin;
  e.respondWith(caches.open(V).then(async c=>{
    const hit=await c.match(r,{ignoreSearch:r.mode==='navigate'});
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>null);
    if(same){ /* réseau d'abord, 3 s maximum, puis copie locale */
      const res=await Promise.race([net,new Promise(ok=>setTimeout(()=>ok(null),hit?3000:15000))]);
      if(res)return res;if(hit)return hit;
    }else if(hit){e.waitUntil(net);return hit}
    const res=await net;return res||new Response('Hors ligne',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }));
});
