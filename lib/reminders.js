// Local, offline-first reminders. No push server is involved.
// - While the app is open, a 3-hour timer shows a notification.
// - When the app is reopened after a gap, one missed reminder is shown.
// - On Android, Periodic Background Sync is registered as best effort.
//   The browser decides when it actually runs, so it is not an exact alarm.

export const REMINDER_CACHE = "life-tracker-reminder-cache-v1";
export const REMINDER_KEY = "/__reminder-config";
const NOTIFICATION_TAG = "life-tracker-reminder";

export const MOTIVATION_TEXTS = [
  "এখনই একটু সময় নিন — নিজের জন্য।",
  "ছোট ছোট ধাপই বড় পরিবর্তন আনে।",
  "আজকের চেষ্টা কালকের ফল।",
  "নিজের যত্ন নেওয়া মানে নিজের দায়িত্ব নেওয়া।",
  "একটু পানি খান, একটু বিশ্রাম নিন।",
  "আপনি যতটা ভাবছেন, তার চেয়ে বেশি পারেন।",
  "ধারাবাহিকতাই সবচেয়ে বড় শক্তি।",
  "আজ একটু পড়াশোনা বা হাঁটা — যেটা ভালো লাগে।",
  "শরীর ও মন — দুইয়ের যত্ন নিন।",
  "একটি ছোট বিরতি নতুন শক্তি দেয়।",
];

export const MAX_CUSTOM_TEXTS = 20;
export const MAX_TEXT_LENGTH = 160;

// Custom messages are trimmed, de-duplicated and length-limited so the
// notification never carries broken or empty text.
export function customTextsOf(reminders) {
  const list = reminders && Array.isArray(reminders.customTexts) ? reminders.customTexts : [];
  const seen = new Set();
  const clean = [];
  list.forEach((item) => {
    if (typeof item !== "string") return;
    const text = item.trim().slice(0, MAX_TEXT_LENGTH);
    if (!text || seen.has(text)) return;
    seen.add(text);
    clean.push(text);
  });
  return clean.slice(0, MAX_CUSTOM_TEXTS);
}

// The pool a reminder is picked from: user messages first, then built-ins.
export function reminderTexts(reminders) {
  return [...customTextsOf(reminders), ...MOTIVATION_TEXTS];
}


export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function reminderPermission() {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestReminderPermission() {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch (err) {
    return "denied";
  }
}

export function inQuietHours(reminders, date = new Date()) {
  const start = reminders && reminders.quietStart;
  const end = reminders && reminders.quietEnd;
  if (!start || !end || start === end) return false;
  const toMinutes = (value) => {
    const [h, m] = String(value).split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (startMin === null || endMin === null) return false;
  const now = date.getHours() * 60 + date.getMinutes();
  if (startMin < endMin) return now >= startMin && now < endMin;
  return now >= startMin || now < endMin;
}

async function readConfig() {
  if (typeof window === "undefined" || !("caches" in window)) return null;
  try {
    const cache = await caches.open(REMINDER_CACHE);
    const res = await cache.match(REMINDER_KEY);
    return res ? await res.json() : null;
  } catch (err) {
    return null;
  }
}

async function writeConfig(config) {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    const cache = await caches.open(REMINDER_CACHE);
    await cache.put(
      REMINDER_KEY,
      new Response(JSON.stringify(config), { headers: { "Content-Type": "application/json" } })
    );
  } catch (err) {
    // Cache storage can be unavailable in private mode; reminders then stay in-app only.
  }
}

// Config writes are serialized so a settings sync cannot overwrite the
// lastNotifiedAt timestamp written by the timer (or vice versa).
let configQueue = Promise.resolve();

function queueConfig(task) {
  const run = configQueue.then(task, task);
  configQueue = run.catch(() => {});
  return run;
}

// Keep the service worker's copy in sync with the current settings.
export function syncReminderConfig(reminders) {
  return queueConfig(async () => {
    const previous = (await readConfig()) || {};
    await writeConfig({
      ...previous,
      ...reminders,
      texts: reminderTexts(reminders),
      updatedAt: Date.now(),
    });
  });
}

export function resetReminderClock() {
  return queueConfig(async () => {
    const previous = (await readConfig()) || {};
    await writeConfig({ ...previous, lastNotifiedAt: Date.now() });
  });
}

export function pickMotivationText(texts = MOTIVATION_TEXTS) {
  const list = Array.isArray(texts) && texts.length ? texts : MOTIVATION_TEXTS;
  return list[Math.floor(Math.random() * list.length)];
}

export async function showReminder(body, options = {}) {
  if (reminderPermission() !== "granted") return false;
  const text = body || pickMotivationText();
  const payload = {
    body: text,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: NOTIFICATION_TAG,
    renotify: true,
    data: { url: "/" },
    ...options,
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification("দিনলিপি", payload);
        return true;
      }
    }
  } catch (err) {
    // Fall through to the page-level Notification API.
  }

  try {
    new Notification("দিনলিপি", payload);
    return true;
  } catch (err) {
    return false;
  }
}

// Shows at most one reminder, and only when the interval has passed.
export async function checkAndNotify(reminders) {
  if (!reminders || !reminders.enabled) return false;
  if (reminderPermission() !== "granted") return false;
  if (inQuietHours(reminders)) return false;

  const config = (await readConfig()) || {};
  const intervalHours = Math.max(1, Number(reminders.intervalHours) || 3);
  const intervalMs = intervalHours * 60 * 60 * 1000;
  const last = Number(config.lastNotifiedAt) || 0;
  if (last && Date.now() - last < intervalMs) return false;

  const shown = await showReminder(pickMotivationText(reminderTexts(reminders)));
  if (shown) {
    await queueConfig(async () => {
      const latest = (await readConfig()) || {};
      await writeConfig({
        ...latest,
        ...reminders,
        texts: reminderTexts(reminders),
        lastNotifiedAt: Date.now(),
      });
    });
  }
  return shown;
}

// Periodic Background Sync is available on installed Chromium PWAs.
// Chrome enforces its own minimum interval, so this is intentionally best effort.
export async function registerBackgroundSync(reminders) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  if (!reminders || !reminders.enabled) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.periodicSync || !registration.periodicSync.register) return false;
    const requested = Math.max(1, Number(reminders.intervalHours) || 3) * 60 * 60 * 1000;
    try {
      await registration.periodicSync.register("life-reminder", { minInterval: requested });
    } catch (err) {
      // Older Chrome versions reject anything below their (higher) minimum.
      await registration.periodicSync.register("life-reminder", { minInterval: 12 * 60 * 60 * 1000 });
    }
    return true;
  } catch (err) {
    return false;
  }
}

export async function unregisterBackgroundSync() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.periodicSync && registration.periodicSync.unregister) {
      await registration.periodicSync.unregister("life-reminder");
    }
  } catch (err) {
    // Ignore: the browser may not support periodic sync.
  }
}