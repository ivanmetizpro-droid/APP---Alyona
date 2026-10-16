import fs from 'node:fs';
import {createHash} from 'node:crypto';
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const files=['index.html','manifest.webmanifest',...walk('js'),...walk('css'),...walk('assets').filter(p=>/\.(js|ttf|svg|png)$/.test(p))];
const hash=createHash('sha256');files.forEach(p=>hash.update(fs.readFileSync(p)));
const cache='elektrosmeta-1.0.0-'+hash.digest('hex').slice(0,12);
fs.writeFileSync('sw.js',`const CACHE=${JSON.stringify(cache)};\nconst FILES=${JSON.stringify(['./',...files])};\nself.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));\nself.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));\nself.addEventListener('fetch',event=>{if(event.request.method==='GET'&&new URL(event.request.url).origin===self.location.origin)event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));});\n`);
console.log('Offline resources:',files.length,cache);
