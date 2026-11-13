import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Moon,
  Utensils,
  Scale,
  HeartPulse,
  Dumbbell,
  BookOpen,
  Briefcase,
  ListChecks,
  Clock,
  BarChart3,
  Target,
  Settings as SettingsIcon,
  Menu,
  X,
  Activity,
  Plus,
  Sun,
  MoreHorizontal,
} from "lucide-react";
import { formatDateFull, todayISO } from "../lib/dateUtils";
import { useStore } from "../store/useStore";
import QuickAdd from "./QuickAdd";

const GROUPS = [
  {
    label: "মূল",
    items: [
      { href: "/", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
      { href: "/daily", label: "দৈনিক লগ", icon: CalendarDays },
      { href: "/calendar", label: "ক্যালেন্ডার", icon: CalendarRange },
    ],
  },
  {
    label: "স্বাস্থ্য",
    items: [
      { href: "/sleep", label: "ঘুম", icon: Moon },
      { href: "/nutrition", label: "খাবার ও পানি", icon: Utensils },
      { href: "/weight", label: "ওজন", icon: Scale },
      { href: "/exercise", label: "ব্যায়াম", icon: Dumbbell },
      { href: "/health", label: "স্বাস্থ্য জার্নাল", icon: HeartPulse },
    ],
  },
  {
    label: "জীবনযাত্রা",
    items: [
      { href: "/study", label: "পড়াশোনা", icon: BookOpen },
      { href: "/work", label: "Smart Madaripur", icon: Briefcase },
      { href: "/habits", label: "অভ্যাস", icon: ListChecks },
      { href: "/routine", label: "রুটিন", icon: Clock },
    ],
  },
  {
    label: "বিশ্লেষণ ও সেটিংস",
    items: [
      { href: "/reports", label: "রিপোর্ট", icon: BarChart3 },
      { href: "/goals", label: "লক্ষ্য", icon: Target },
      { href: "/settings", label: "সেটিংস", icon: SettingsIcon },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.items);

const BOTTOM = [
  { href: "/", label: "হোম", icon: LayoutDashboard },
  { href: "/daily", label: "দৈনিক", icon: CalendarDays },
  { href: "/calendar", label: "ক্যালেন্ডার", icon: CalendarRange },
  { href: "/reports", label: "রিপোর্ট", icon: BarChart3 },
];

function normalize(path) {
  return path.replace(/\/+$/, "") || "/";
}

export default function Layout({ children }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const router = useRouter();
  const path = normalize(router.pathname);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const openQuickAdd = useStore((s) => s.openQuickAdd);

  const current = ALL.find((item) => item.href === path);
  const pageTitle = current ? current.label : "দিনলিপি";
  const moreActive = !BOTTOM.some((b) => b.href === path);

  useEffect(() => {
    setMoreOpen(false);
  }, [path]);

  useEffect(() => {
    document.title = pageTitle === "দিনলিপি" ? "দিনলিপি" : `${pageTitle} · দিনলিপি`;
  }, [pageTitle]);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

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
          {GROUPS.map((group) => (
            <div key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = path === item.href;
                return (
                  <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}>
                    <Icon size={17} strokeWidth={1.9} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
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
        {BOTTOM.map((item) => {
          const Icon = item.icon;
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href} className={`bottom-link ${active ? "active" : ""}`}>
              <Icon size={21} strokeWidth={active ? 2.3 : 1.9} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`bottom-link ${moreActive ? "active" : ""}`}
          onClick={() => setMoreOpen((v) => !v)}
          aria-label="আরও মেনু"
        >
          {moreOpen ? <X size={21} strokeWidth={2.1} /> : <MoreHorizontal size={21} strokeWidth={2.1} />}
          <span>আরও</span>
        </button>
      </nav>

      {moreOpen ? (
        <div className="sheet-backdrop no-print" onClick={() => setMoreOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title">সব মডিউল</div>
            {ALL.map((item) => {
              const Icon = item.icon;
              const active = path === item.href;
              return (
                <Link key={item.href} href={item.href} className={`sheet-link ${active ? "active" : ""}`}>
                  <span className="sheet-link-icon">
                    <Icon size={18} strokeWidth={1.9} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="tiny muted" style={{ padding: "14px 12px 0", lineHeight: 1.6 }}>
              ইন্টারনেট ছাড়াই কাজ করে — তথ্য ব্রাউজারের ভেতরেই সংরক্ষিত।
            </div>
          </div>
        </div>
      ) : null}

      <QuickAdd />
    </div>
  );
}