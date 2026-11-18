import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const walk = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
const files = walk("out").filter(
  (f) =>
    /\.(js|css|html|png|json|ico|txt|svg)$/.test(f) && !f.endsWith("sw.js"),
);
const hash = crypto.createHash("sha256");
for (const f of files) hash.update(fs.readFileSync(f));
const urls = files
  .map((f) => "/" + f.slice(4))
  .filter((f) => !f.includes("404"));
const version = "money-v2-" + hash.digest("hex").slice(0, 12);
fs.writeFileSync(
  "out/sw.js",
  `const CACHE=${JSON.stringify(version)};const ASSETS=${JSON.stringify(urls)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('money-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const url=new URL(e.request.url);if(url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/.well-known/'))return;if(!ASSETS.includes(url.pathname)&&!ASSETS.includes(url.pathname+'index.html')&&!ASSETS.includes(url.pathname+'/index.html'))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok&&!r.redirected){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(async()=>{const c=await caches.open(CACHE);return await c.match(e.request)||await c.match(url.pathname,{ignoreSearch:true})||(e.request.mode==='navigate'&&(await c.match(url.pathname+'index.html')||await c.match(url.pathname+'/index.html')))||new Response('Offline. Buka halaman ini saat online terlebih dahulu.',{status:503});}));});`,
);
