const CACHE='elektrosmeta-1.0.0';
const FILES=["./","index.html","manifest.webmanifest","js/app.js","js/calc/engine.js","js/domain/model.js","js/domain/units.js","js/editor/svg-editor.js","js/io/backup.js","js/pdf/generate.js","js/storage/db.js","js/ui.js","css/base.css","assets/fonts/DejaVuSans-Bold.ttf","assets/fonts/DejaVuSans.ttf","assets/icons/icon.svg","assets/vendor/jspdf.plugin.autotable.min.js","assets/vendor/jspdf.umd.min.js"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method==='GET'&&new URL(event.request.url).origin===self.location.origin)event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));});
