import { useEffect, useState } from "react";
import "../styles/globals.css";
import Layout from "../components/Layout";
import ReminderEngine from "../components/ReminderEngine";
import { useStore, STORAGE_KEY } from "../store/useStore";
import { Activity } from "lucide-react";

function applyTheme(theme) {
  if (typeof document === "undefined") return;
  if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
}

export default function App({ Component, pageProps }) {
  const [mounted, setMounted] = useState(false);
  const theme = useStore((s) => s.settings.theme);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // The food inventory module was removed; erase its old records from storage.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.state && "foodItems" in parsed.state) {
          delete parsed.state.foodItems;
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (err) {
      // Ignore malformed storage; the store will fall back to defaults.
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Local data lives in localStorage, so render a stable shell until mounted.
  if (!mounted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          background: "#0a0f14",
          color: "#34d399",
        }}
      >
        <span
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(150deg, #6ee7b7, #10b981)",
            color: "#062019",
            boxShadow: "0 10px 30px rgba(16,185,129,0.28)",
          }}
        >
          <Activity size={26} strokeWidth={2.4} />
        </span>
        <span style={{ fontSize: "0.86rem", color: "#a4b5c4", fontWeight: 600 }}>লোড হচ্ছে…</span>
      </div>
    );
  }

  return (
    <>
      <ReminderEngine />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}