/* Le Saint Teh : mode hors ligne.
   Les fichiers de l'appli sont demandés au réseau à chaque fois, en revalidant (sans se fier au cache du
   navigateur), pour que tous les appareils aient la même version ; la copie locale ne sert que hors ligne. */
const V='lst-48';
const SHELL=['./','index.html','manifest.webmanifest','peerjs.min.js','qrcode.js','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET'||!/^https?:/.test(r.url))return;
  const u=new URL(r.url),same=u.origin===self.location.origin;
  if(same&&/version\.json$/.test(u.pathname))return; /* le numéro de version se lit toujours en direct */
  e.respondWith(caches.open(V).then(async c=>{
    const hit=await c.match(r,{ignoreSearch:same});
    if(same){ /* réseau d'abord, 4 s maximum, puis copie locale */
      const key=u.origin+u.pathname;
      const net=fetch(r.url,{cache:'no-cache'}).then(res=>{if(res&&res.ok)c.put(key,res.clone());return res}).catch(()=>null);
      const res=await Promise.race([net,new Promise(ok=>setTimeout(()=>ok(null),hit?4000:15000))]);
      if(res)return res;if(hit)return hit;
      return (await net)||new Response('Hors ligne',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    return (await net)||new Response('Hors ligne',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }));
});
