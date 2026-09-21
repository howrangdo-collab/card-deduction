/* 오프라인에서도 열리게 하는 서비스워커.
 *
 * ★ network-first 를 쓴다 (cache-first 가 아니라)
 *   cache-first 로 두면 앱을 고쳐 올려도 폰에는 **옛 화면이 계속 뜬다**.
 *   세법이 바뀌어 금액이 달라졌는데 사용자만 모르는 상황이 가장 나쁘다.
 *   그래서 항상 네트워크를 먼저 보고, 실패했을 때만 캐시를 쓴다.
 *   지하철처럼 신호가 없는 곳에서도 열리되, 신호가 있으면 언제나 최신이다.
 */
const CACHE = 'cardded-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './web/icon-192.png',
  './web/icon-512.png',
  './web/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  // 새 버전을 올리면 기다리지 않고 바로 넘겨받는다
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // 구글 폰트 등 외부 자원은 건드리지 않는다 — 없으면 시스템 글꼴로 뜨면 된다
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
