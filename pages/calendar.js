import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Moon,
  BookOpen,
  HeartPulse,
  Scale,
  ListChecks,
  ArrowRight,
  CalendarDays,
  Clock,
  Info,
} from "lucide-react";
import {
  PageHeader,
  SectionCard,
  Badge,
  EmptyState,
  ProgressMeta,
  KpiCard,
} from "../components/Ui";
import { useStore } from "../store/useStore";
import { daySummary, dayEvents, fmtNum } from "../lib/calc";
import {
  todayISO,
  monthMatrix,
  monthStartOf,
  monthEndOf,
  formatMonthYear,
  formatDateFull,
  formatDateShort,
  weekdayBangla,
  parseISODate,
  addDays,
} from "../lib/dateUtils";
import { CHART } from "../lib/chart";
import { BANGLA_WEEKDAYS } from "../lib/dateUtils";

function dayMarks(state, d) {
  const sleep = state.sleep.some((e) => e.date === d);
  const study = state.study.some((e) => e.date === d);
  const health = state.health.some((e) => e.date === d);
  const weight = state.weights.some((e) => e.date === d);
  const habit = Object.values(state.habitLogs[d] || {}).some((v) => v === "হ্যাঁ");
  return { sleep, study, health, weight, habit };
}

export default function CalendarPage() {
  const state = useStore();
  const today = todayISO();
  const [anchor, setAnchor] = useState(today);
  const [selected, setSelected] = useState(today);

  const d = parseISODate(anchor) || new Date();
  const year = d.getFullYear();
  const monthIndex = d.getMonth();
  const cells = useMemo(() => monthMatrix(year, monthIndex), [year, monthIndex]);

  const shift = (n) => {
    const next = new Date(year, monthIndex + n, 1);
    setAnchor(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`);
  };

  const summary = useMemo(() => daySummary(state, selected), [state, selected]);
  const events = useMemo(() => dayEvents(state, selected), [state, selected]);

  const monthStats = useMemo(() => {
    const start = monthStartOf(anchor);
    const end = monthEndOf(anchor);
    const days = [];
    let cursor = start;
    while (cursor <= end) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    const rows = days.map((x) => ({ date: x, ...dayMarks(state, x), s: daySummary(state, x) }));
    return {
      rows,
      activeDays: rows.filter((r) => r.sleep || r.study || r.health || r.weight || r.habit).length,
      studyDays: rows.filter((r) => r.study).length,
      sleepDays: rows.filter((r) => r.sleep).length,
      headacheDays: rows.filter((r) => r.health).length,
      weightDays: rows.filter((r) => r.weight).length,
      habitDays: rows.filter((r) => r.habit).length,
    };
  }, [state, anchor]);

  const list = events;

  return (
    <div>
      <PageHeader
        icon={CalendarRange}
        title="ক্যালেন্ডার"
        subtitle="মাসের প্রতিটি দিনে কী হয়েছে এক নজরে — কোনো দিনে ক্লিক করে বিস্তারিত দেখুন।"
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard icon={CalendarDays} label="সক্রিয় দিন" value={monthStats.activeDays} unit="দিন" tone={CHART.green} />
        <KpiCard icon={Moon} label="ঘুমের দিন" value={monthStats.sleepDays} unit="দিন" tone={CHART.violet} />
        <KpiCard icon={BookOpen} label="পড়ার দিন" value={monthStats.studyDays} unit="দিন" tone={CHART.cyan} />
        <KpiCard icon={HeartPulse} label="স্বাস্থ্য রেকর্ড" value={monthStats.headacheDays} unit="দিন" tone={CHART.rose} />
      </div>

      <SectionCard
        icon={CalendarRange}
        title={formatMonthYear(year, monthIndex)}
        subtitle="রঙিন বিন্দু মানে সেই দিনে সেই ধরনের তথ্য আছে"
        right={
          <div className="row" style={{ gap: 4 }}>
            <button type="button" className="btn-icon" onClick={() => shift(-1)} aria-label="আগের মাস">
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setAnchor(today);
                setSelected(today);
              }}
            >
              আজ
            </button>
            <button type="button" className="btn-icon" onClick={() => shift(1)} aria-label="পরের মাস">
              <ChevronRight size={17} />
            </button>
          </div>
        }
      >
        <div className="cal-grid">
          {BANGLA_WEEKDAYS.map((w) => (
            <div key={w} className="cal-dow">
              {w}
            </div>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <div key={`blank-${i}`} className="cal-cell blank" />;
            const marks = dayMarks(state, iso);
            return (
              <button
                key={iso}
                type="button"
                className={`cal-cell ${iso === today ? "today" : ""} ${iso === selected ? "selected" : ""}`}
                onClick={() => setSelected(iso)}
                title={`${formatDateFull(iso)}`}
              >
                <b>{parseISODate(iso).getDate()}</b>
                <span className="cal-dots">
                  <i className={marks.sleep ? "on-sleep" : ""} />
                  <i className={marks.study ? "on-study" : ""} />
                  <i className={marks.health ? "on-health" : ""} />
                  <i className={marks.weight ? "on-weight" : ""} />
                  <i className={marks.habit ? "on-habit" : ""} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="row row-wrap" style={{ gap: 10, marginTop: 12 }}>
          {[
            { cls: "on-sleep", label: "ঘুম" },
            { cls: "on-study", label: "পড়াশোনা" },
            { cls: "on-health", label: "স্বাস্থ্য" },
            { cls: "on-weight", label: "ওজন" },
            { cls: "on-habit", label: "অভ্যাস" },
          ].map((x) => (
            <span key={x.cls} className="row tiny muted" style={{ gap: 5 }}>
              <span className="cal-dots" style={{ height: "auto" }}>
                <i className={x.cls} style={{ width: 6, height: 6 }} />
              </span>
              {x.label}
            </span>
          ))}
        </div>
      </SectionCard>

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div className="row row-wrap" style={{ justifyContent: "space-between", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "1rem", fontWeight: 800 }}>{formatDateFull(selected)}</div>
            <div className="tiny muted" style={{ marginTop: 2 }}>
              {weekdayBangla(selected)}বার · {events.length}টি এন্ট্রি
            </div>
          </div>
          <Link href="/daily" className="btn btn-ghost btn-sm">
            দৈনিক লগে খুলুন <ArrowRight size={13} />
          </Link>
        </div>

        <div className="kpi-grid" style={{ marginTop: 12 }}>
          <KpiCard icon={Moon} label="ঘুম" value={fmtNum(summary.sleepHrs, 1, "—")} unit="ঘণ্টা" tone={CHART.violet} />
          <KpiCard icon={BookOpen} label="পড়াশোনা" value={Math.round(summary.studyMin)} unit="মিনিট" tone={CHART.cyan} />
          <KpiCard icon={ListChecks} label="অভ্যাস" value={summary.habitPct === null ? "—" : `${Math.round(summary.habitPct * 100)}%`} tone={CHART.amber} />
          <KpiCard icon={Scale} label="ওজন" value={summary.weight === null ? "—" : summary.weight.toFixed(1)} unit="কেজি" tone={CHART.green} />
        </div>

        <div style={{ marginTop: 12 }}>
          <ProgressMeta
            label="রুটিন"
            value={summary.routineTotal ? summary.routineDone / summary.routineTotal : 0}
            right={`${summary.routineDone}/${summary.routineTotal}`}
          />
        </div>
      </div>

      <SectionCard icon={Clock} title="দিনের এন্ট্রি" subtitle={formatDateShort(selected)} flush>
        {list.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="এই দিনে কোনো এন্ট্রি নেই"
            hint="দৈনিক লগ পেজে গিয়ে এই দিনের তথ্য যোগ করুন।"
          />
        ) : (
          list.map((e) => (
            <div key={`${e.collection}-${e.id}`} className="list-row">
              <span className="timeline-time">{e.time || "—"}</span>
              <div className="list-row-main">
                <div className="list-row-title">{e.title}</div>
                <div className="list-row-sub">{e.detail}</div>
              </div>
              <Badge tone="mute">{e.collection === "weights" ? "ওজন" : e.collection === "sleep" ? "ঘুম" : e.collection === "study" ? "পড়া" : e.collection === "health" ? "স্বাস্থ্য" : e.collection === "meals" ? "খাবার" : e.collection === "water" ? "পানি" : e.collection === "work" ? "কাজ" : "ব্যায়াম"}</Badge>
            </div>
          ))
        )}
      </SectionCard>

      <div className="row tiny muted" style={{ justifyContent: "center", gap: 6, marginTop: 6 }}>
        <Info size={13} />
        <span>ক্যালেন্ডারে শুধু আপনার করা এন্ট্রিগুলোই দেখানো হয় — ফাঁকা দিন মানে তথ্য দেওয়া হয়নি।</span>
      </div>
    </div>
  );
}