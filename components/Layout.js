import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  CalendarDays,
  BarChart3,
  Settings as SettingsIcon,
  Activity,
  Plus,
  Sun,
  Moon,
} from "lucide-react";
import { formatDateFull, todayISO } from "../lib/dateUtils";
import { useStore } from "../store/useStore";
import QuickAdd from "./QuickAdd";

const NAV = [
  { href: "/daily", label: "দৈনিক লগ", icon: CalendarDays },
  { href: "/reports", label: "রিপোর্ট", icon: BarChart3 },
];

function normalize(path) {
  return path.replace(/\/+$/, "") || "/";
}

export default function Layout({ children }) {
  const router = useRouter();
  const path = normalize(router.pathname);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const openQuickAdd = useStore((s) => s.openQuickAdd);

  const current = NAV.find((item) => item.href === path);
  const pageTitle = current ? current.label : path === "/settings" ? "সেটিংস" : "দিনলিপি";

  useEffect(() => {
    document.title = pageTitle === "দিনলিপি" ? "দিনলিপি" : `${pageTitle} · দিনলিপি`;
  }, [pageTitle]);

  const dark = settings.theme !== "light";

  return (
    <div className="app-shell">
      <aside className="sidebar no-print">
        <div className="sidebar-brand">
          <span className="brand-mark">
            <Activity size={19} strokeWidth={2.4} />
          </span>
          <span>দিনলিপি</span>
        </div>

        <button type="button" className="btn btn-primary" style={{ marginBottom: 10 }} onClick={() => openQuickAdd("menu")}>
          <Plus size={16} /> নতুন এন্ট্রি
        </button>

        <nav className="sidebar-nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = path === item.href;
            return (
              <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}>
                <Icon size={17} strokeWidth={1.9} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-foot">সম্পূর্ণ লোকাল — আপনার তথ্য শুধু এই ডিভাইসে থাকে।</div>
      </aside>

      <div className="main-area">
        <header className="topbar no-print">
          <div className="topbar-brand">
            <span className="brand-mark">
              <Activity size={18} strokeWidth={2.2} />
            </span>
            <div className="topbar-title">
              <strong>{pageTitle}</strong>
              <span>{formatDateFull(todayISO())}</span>
            </div>
          </div>

          <div className="topbar-actions">
            <Link
              href="/settings"
              className="btn-icon"
              aria-label="সেটিংস"
              title="সেটিংস"
            >
              <SettingsIcon size={17} />
            </Link>
            <button
              type="button"
              className="btn-icon"
              onClick={() => updateSettings({ theme: dark ? "light" : "dark" })}
              aria-label={dark ? "লাইট থিম চালু করুন" : "ডার্ক থিম চালু করুন"}
              title={dark ? "লাইট থিম" : "ডার্ক থিম"}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => openQuickAdd("menu")}>
              <Plus size={15} /> যোগ
            </button>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>

      <button type="button" className="fab no-print" onClick={() => openQuickAdd("menu")} aria-label="দ্রুত যোগ করুন">
        <Plus size={25} strokeWidth={2.3} />
      </button>

      <nav className="bottom-nav no-print">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href} className={`bottom-link ${active ? "active" : ""}`}>
              <Icon size={21} strokeWidth={active ? 2.3 : 1.9} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <QuickAdd />
    </div>
  );
}
