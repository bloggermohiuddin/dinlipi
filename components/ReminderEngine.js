import { useEffect } from "react";
import { useStore } from "../store/useStore";
import {
  checkAndNotify,
  registerBackgroundSync,
  syncReminderConfig,
} from "../lib/reminders";

// Runs on every page. Shows a local notification when the interval has passed,
// including one catch-up reminder when the app is opened after a long gap.
export default function ReminderEngine() {
  const reminders = useStore((s) => s.reminders);

  useEffect(() => {
    if (!reminders || !reminders.enabled) return undefined;

    let alive = true;
    const tick = () => {
      if (!alive) return;
      checkAndNotify(reminders).catch(() => {});
    };

    syncReminderConfig(reminders);
    registerBackgroundSync(reminders);

    // Catch up immediately if the app was closed past the interval.
    tick();

    const timer = setInterval(tick, 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [reminders]);

  return null;
}