const CACHE_NAME = "health-tracker-cache-v8";
const APP_SHELL = ["/", "/manifest.json"];

// Reminder settings are shared with the page through Cache Storage,
// because a service worker cannot read localStorage.
const REMINDER_CACHE = "life-tracker-reminder-cache-v1";
const REMINDER_KEY = "/__reminder-config";
const FALLBACK_TEXTS = [
  "à¦à¦–à¦¨à¦‡ à¦à¦•à¦Ÿà§ à¦¸à¦®à¦¯à¦¼ à¦¨à¦¿à¦¨ â€” à¦¨à¦¿à¦œà§‡à¦° à¦œà¦¨à§à¦¯à¥¤",
  "à¦›à§‹à¦Ÿ à¦›à§‹à¦Ÿ à¦§à¦¾à¦ªà¦‡ à¦¬à¦¡à¦¼ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦†à¦¨à§‡à¥¤",
  "à¦†à¦œà¦•à§‡à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦¾à¦²à¦•à§‡à¦° à¦«à¦²à¥¤",
  "à¦¨à¦¿à¦œà§‡à¦° à¦¯à¦¤à§à¦¨ à¦¨à§‡à¦“à¦¯à¦¼à¦¾ à¦®à¦¾à¦¨à§‡ à¦¨à¦¿à¦œà§‡à¦° à¦¦à¦¾à¦¯à¦¼à¦¿à¦¤à§à¦¬ à¦¨à§‡à¦“à¦¯à¦¼à¦¾à¥¤",
  "à¦à¦•à¦Ÿà§ à¦ªà¦¾à¦¨à¦¿ à¦–à¦¾à¦¨, à¦à¦•à¦Ÿà§ à¦¬à¦¿à¦¶à§à¦°à¦¾à¦® à¦¨à¦¿à¦¨à¥¤",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== REMINDER_CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Network-first for navigation/HTML, cache-first for everything else (static assets).
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((res) => res || caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return res;
          })
          .catch(() => cached)
    )
  );
});

// ---------- Local reminders ----------

async function readReminderConfig() {
  try {
    const cache = await caches.open(REMINDER_CACHE);
    const response = await cache.match(REMINDER_KEY);
    return response ? await response.json() : null;
  } catch (error) {
    return null;
  }
}

async function writeReminderConfig(config) {
  try {
    const cache = await caches.open(REMINDER_CACHE);
    await cache.put(
      REMINDER_KEY,
      new Response(JSON.stringify(config), { headers: { "Content-Type": "application/json" } })
    );
  } catch (error) {
    // Ignore: the cache may be unavailable.
  }
}

function isQuietTime(config, now) {
  const start = config && config.quietStart;
  const end = config && config.quietEnd;
  if (!start || !end || start === end) return false;
  const toMinutes = (value) => {
    const parts = String(value).split(":").map(Number);
    if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
    return parts[0] * 60 + parts[1];
  };
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (startMin === null || endMin === null) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  if (startMin < endMin) return current >= startMin && current < endMin;
  return current >= startMin || current < endMin;
}

function pickText(config) {
  const list = config && Array.isArray(config.texts) && config.texts.length ? config.texts : FALLBACK_TEXTS;
  return list[Math.floor(Math.random() * list.length)];
}

async function showReminderNotification(config) {
  await self.registration.showNotification("à¦¦à¦¿à¦¨à¦²à¦¿à¦ªà¦¿", {
    body: pickText(config),
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "life-tracker-reminder",
    renotify: true,
    data: { url: "/" },
  });
}

// Best-effort background reminder. Chrome decides the real timing.
self.addEventListener("periodicsync", (event) => {
  if (event.tag !== "life-reminder") return;
  event.waitUntil(
    (async () => {
      const config = await readReminderConfig();
      if (!config || !config.enabled) return;
      if (isQuietTime(config, new Date())) return;
      const intervalHours = Math.max(1, Number(config.intervalHours) || 3);
      const last = Number(config.lastNotifiedAt) || 0;
      if (last && Date.now() - last < intervalHours * 60 * 60 * 1000) return;
      await showReminderNotification(config);
      await writeReminderConfig({ ...config, lastNotifiedAt: Date.now() });
    })().catch(() => {})
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.indexOf(self.location.origin) === 0);
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});



