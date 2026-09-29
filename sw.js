/**
 * Service worker cho chế độ gian hàng.
 *
 * Mục tiêu duy nhất: sau lần tải đầu thành công, app reload được khi mất mạng.
 * Chiến lược cache-first cho mọi tài nguyên đã precache — đồng thời đảm bảo
 * bản build KHÔNG tự đổi giữa lượt chơi: worker mới chỉ dọn cache cũ khi
 * được kích hoạt, và không gọi skipWaiting.
 *
 * Khi phát hành bản mới: tăng CACHE_VERSION.
 */

const CACHE_VERSION = 'dd-v1.2.0';

const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/css/app.css',
  'assets/fonts.css',
  'assets/img/logo.svg',
  'assets/img/background-main.jpg',
  'assets/img/background-2.jpg',
  'assets/img/result-props.svg',
  'assets/img/evidence-1.webp',
  'assets/img/evidence-2.webp',
  'assets/img/evidence-3.webp',
  'assets/img/evidence-4.webp',
  'src/app.js',
  'src/content.js',
  'src/icons.js',
  'src/session.js',
  'src/storage.js',
  'src/screens/dialog.js',
  'src/screens/welcome.js',
  'src/screens/briefing.js',
  'src/screens/game.js',
  'src/screens/result.js',
  'assets/fonts/QdVMSTAyLFyeg_IDWvOJmVES_HSMIG81Rb0.woff2',
  'assets/fonts/QdVMSTAyLFyeg_IDWvOJmVES_HSMIG86Rb0bcw.woff2',
  'assets/fonts/QdVMSTAyLFyeg_IDWvOJmVES_HSMIG87Rb0bcw.woff2',
  'assets/fonts/QdVMSTAyLFyeg_IDWvOJmVES_HSQI281Rb0.woff2',
  'assets/fonts/QdVMSTAyLFyeg_IDWvOJmVES_HSQI286Rb0bcw.woff2',
  'assets/fonts/QdVMSTAyLFyeg_IDWvOJmVES_HSQI287Rb0bcw.woff2',
  'assets/fonts/QdVMSTAyLFyeg_IDWvOJmVES_HTEJm81Rb0.woff2',
  'assets/fonts/QdVMSTAyLFyeg_IDWvOJmVES_HTEJm86Rb0bcw.woff2',
  'assets/fonts/QdVMSTAyLFyeg_IDWvOJmVES_HTEJm87Rb0bcw.woff2',
  'assets/fonts/QdVMSTAyLFyeg_IDWvOJmVES_HToIW81Rb0.woff2',
  'assets/fonts/QdVMSTAyLFyeg_IDWvOJmVES_HToIW86Rb0bcw.woff2',
  'assets/fonts/QdVMSTAyLFyeg_IDWvOJmVES_HToIW87Rb0bcw.woff2',
  'assets/fonts/QdVPSTAyLFyeg_IDWvOJmVES_Hw3BXo.woff2',
  'assets/fonts/QdVPSTAyLFyeg_IDWvOJmVES_Hw4BXoKZA.woff2',
  'assets/fonts/QdVPSTAyLFyeg_IDWvOJmVES_Hw5BXoKZA.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // addAll thất bại nếu một file lỗi; thêm lẻ để một asset thiếu
      // không làm hỏng toàn bộ cache.
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn('[sw] bỏ qua', url, err);
          })
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Điều hướng: trả app shell đã cache để reload offline vẫn vào được game.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match('index.html', { ignoreSearch: true }).then((r) => r || caches.match('./'))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
