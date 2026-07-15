// Service Worker for 个人工作台 PWA
const CACHE_NAME = 'workbench-cache-v1';
const STATIC_CACHE = 'workbench-static-v1';
const DYNAMIC_CACHE = 'workbench-dynamic-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
  console.log('[Service Worker] 正在安装...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] 缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] 安装完成');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[Service Worker] 安装失败:', err);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[Service Worker] 正在激活...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE && 
                     cacheName !== CACHE_NAME;
            })
            .map(cacheName => {
              console.log('[Service Worker] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] 激活完成');
        return self.clients.claim();
      })
  );
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 只缓存同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // 静态资源使用缓存优先
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname === asset.slice(1))) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            console.log('[Service Worker] 从缓存返回:', request.url);
            return cachedResponse;
          }
          
          return fetch(request)
            .then(response => {
              // 缓存新获取的资源
              const responseClone = response.clone();
              caches.open(STATIC_CACHE)
                .then(cache => {
                  cache.put(request, responseClone);
                });
              return response;
            });
        })
    );
    return;
  }

  // 其他请求使用网络优先，失败时回退缓存
  event.respondWith(
    fetch(request)
      .then(response => {
        // 缓存成功的响应
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // 网络失败时返回缓存
        return caches.match(request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // 如果是导航请求，返回主页
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('离线状态', { 
              status: 503, 
              statusText: 'Service Unavailable' 
            });
          });
      })
  );
});

// 后台同步（可选）
self.addEventListener('sync', event => {
  console.log('[Service Worker] 后台同步:', event.tag);
});

// 推送通知（可选）
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : '你有新的任务提醒！',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'explore', title: '查看任务' },
      { action: 'close', title: '关闭' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('工作台提醒', options)
  );
});

// 点击通知
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});