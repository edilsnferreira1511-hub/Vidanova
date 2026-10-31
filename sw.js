// Service worker: deixa o app instalável e abre a "casca" mesmo sem internet.
// Dados do Firebase e scripts de outros domínios NUNCA são guardados aqui (sempre vão à rede).
// Ao publicar uma mudança nos arquivos, aumente o número da VERSAO para os celulares atualizarem.
const VERSAO = 'v2';
const CACHE = `coopmetro-backup-${VERSAO}`;
const CASCA = [
  './', './index.html', './estilo.css', './app.js', './telas.js', './ui.js', './servicos.js', './leitorqr.js',
  './qr.js', './status.js', './acesso.js', './planilha.js', './perfil.js', './config.js',
  './manifest.webmanifest', './icone-192.png', './icone-512.png', './apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CASCA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firebase e CDNs: direto na rede
  // Rede primeiro (pega atualizações); sem internet, usa a cópia guardada.
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html'))),
  );
});
