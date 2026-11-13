import { useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Moon,
  BookOpen,
  Dumbbell,
  Droplets,
  Briefcase,
  HeartPulse,
  ListChecks,
  Scale,
  Download,
  Upload,
  Printer,
  RotateCcw,
  CalendarRange,
  CalendarDays,
  Target,
  Info,
  FileJson,
  ShieldAlert,
} from "lucide-react";
import {
  PageHeader,
  SectionCard,
  KpiCard,
  Badge,
  ChartCard,
  ProgressMeta,
  Tabs,
  Field,
  TextArea,
  StatusBanner,
  EmptyState,
} from "../components/Ui";
import { useStore } from "../store/useStore";
import {
  daySummary,
  habitSummary,
  goalProgress,
  weightRangeChange,
  fmtNum,
  fmtDuration,
} from "../lib/calc";
import {
  todayISO,
  addDays,
  weekStartOf,
  weekEndOf,
  monthStartOf,
  monthEndOf,
  formatDateShort,
  formatDateFull,
  formatMonthYear,
  parseISODate,
} from "../lib/dateUtils";
import { CHART, tooltipStyle, axisTick, chartMargin } from "../lib/chart";
import { exportJSON, parseImportedJSON, backupSummary } from "../lib/exportImport";

function periodRange(mode, anchor) {
  if (mode === "week") {
    const start = weekStartOf(anchor);
    return { start, end: weekEndOf(anchor), prevAnchor: addDays(start, -1), nextAnchor: addDays(start, 7) };
  }
  const start = monthStartOf(anchor);
  const end = monthEndOf(anchor);
  const d = parseISODate(start);
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-01`;
  return { start, end, prevAnchor: iso(prev), nextAnchor: iso(next) };
}

function summarize(state, start, end) {
  const list = [];
  let cursor = start;
  while (cursor <= end) {
    list.push(cursor);
    cursor = addDays(cursor, 1);
  }
  const days = list.map((d) => daySummary(state, d));
  const sleepDays = days.filter((d) => d.sleepHrs !== null);
  const studyDays = days.filter((d) => d.studyMin > 0);
  const exerciseDays = days.filter((d) => d.exerciseMin > 0);
  const workDays = days.filter((d) => d.workMin > 0);
  const waterDays = days.filter((d) => d.waterGlasses !== null);
  const headacheEntries = state.health.filter((h) => h.date >= start && h.date <= end && h.kind !== "অন্যান্য");
  const habit = habitSummary(state.habitLogs, state.habits, start, end);
  const weight = weightRangeChange(state.weights, start, end);
  const routineDone = days.reduce((a, d) => a + d.routineDone, 0);
  const routineTotal = days.reduce((a, d) => a + d.routineTotal, 0);

  return {
    dates: list,
    days,
    count: list.length,
    avgSleep: sleepDays.length ? sleepDays.reduce((a, d) => a + d.sleepHrs, 0) / sleepDays.length : null,
    sleepNights: sleepDays.length,
    studyTotal: days.reduce((a, d) => a + d.studyMin, 0),
    studyDays: studyDays.length,
    exerciseTotal: days.reduce((a, d) => a + d.exerciseMin, 0),
    exerciseDays: exerciseDays.length,
    workTotal: days.reduce((a, d) => a + d.workMin, 0),
    workDays: workDays.length,
    waterAvg: waterDays.length ? waterDays.reduce((a, d) => a + (d.waterGlasses || 0), 0) / waterDays.length : null,
    waterDays: waterDays.length,
    mealsTotal: days.reduce((a, d) => a + d.meals.length, 0),
    headacheEntries,
    headacheDays: new Set(headacheEntries.map((h) => h.date)).size,
    habit,
    weight,
    routineDone,
    routineTotal,
  };
}

export default function ReportsPage() {
  const state = useStore();
  const today = todayISO();
  const [mode, setMode] = useState("week");
  const [anchor, setAnchor] = useState(today);
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef(null);

  const range = useMemo(() => periodRange(mode, anchor), [mode, anchor]);
  const prevRange = useMemo(() => periodRange(mode, range.prevAnchor), [mode, range.prevAnchor]);
  const data = useMemo(() => summarize(state, range.start, range.end), [state, range.start, range.end]);
  const prev = useMemo(() => summarize(state, prevRange.start, prevRange.end), [state, prevRange.start, prevRange.end]);
  const reflection = state.reflections[weekStartOf(range.start)] || {};

  const chartData = useMemo(
    () =>
      data.dates.map((d) => {
        const s = daySummary(state, d);
        const habitPct = s.habitPct;
        return {
          date: formatDateShort(d),
          ঘুম: s.sleepHrs === null ? null : Number(s.sleepHrs.toFixed(1)),
          পড়াশোনা: Math.round(s.studyMin),
          কাজ: Math.round(s.workMin),
          অভ্যাস: habitPct === null ? null : Math.round(habitPct * 100),
          পানি: s.waterGlasses,
        };
      }),
    [state, data.dates]
  );

  const goals = useMemo(() => state.goals.map((g) => ({ goal: g, progress: goalProgress(g, state) })), [state]);

  function delta(cur, prevValue, digits = 1, unit = "") {
    if (cur === null || prevValue === null || prevValue === undefined) return null;
    const diff = cur - prevValue;
    return `${diff > 0 ? "+" : ""}${diff.toFixed(digits)}${unit}`;
  }

  const title = mode === "week" ? `${formatDateShort(range.start)} – ${formatDateShort(range.end)}` : formatMonthYear(parseISODate(range.start).getFullYear(), parseISODate(range.start).getMonth());

  function doExport() {
    exportJSON(useStore.getState());
    setImportMsg("ব্যাকআপ ডাউনলোড শুরু হয়েছে।");
  }

  function doImport(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseImportedJSON(String(reader.result));
        if (!window.confirm("এই ফাইলের তথ্য দিয়ে বর্তমান সব তথ্য প্রতিস্থাপিত হবে। চালিয়ে যাবেন?")) {
          setImportMsg("ইমপোর্ট বাতিল হয়েছে।");
          return;
        }
        useStore.getState().importState(parsed);
        setImportMsg("ব্যাকআপ সফলভাবে ইমপোর্ট হয়েছে।");
      } catch (err) {
        setImportMsg(err.message || "ইমপোর্ট ব্যর্থ হয়েছে।");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function doReset() {
    if (!window.confirm("সব তথ্য মুছে শুরু থেকে যাবে। এটি ফেরানো যাবে না। নিশ্চিত?")) return;
    useStore.getState().resetAll();
    setImportMsg("সব তথ্য মুছে ফেলা হয়েছে।");
  }

  return (
    <div>
      <PageHeader
        icon={BarChart3}
        title="রিপোর্ট"
        subtitle="সাপ্তাহিক ও মাসিক সারসংক্ষেপ — সব সংখ্যা আপনার এন্ট্রি থেকেই আসে।"
        actions={
          <button type="button" className="btn btn-ghost no-print" onClick={() => window.print()}>
            <Printer size={16} /> প্রিন্ট
          </button>
        }
      />

      <div className="no-print" style={{ marginBottom: 14 }}>
        <Tabs
          value={mode}
          onChange={(v) => {
            setMode(v);
            setAnchor(today);
          }}
          tabs={[
            { value: "week", label: "সাপ্তাহিক" },
            { value: "month", label: "মাসিক" },
          ]}
        />
      </div>

      <div className="card no-print" style={{ padding: 12, marginBottom: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
          <button type="button" className="btn-icon" onClick={() => setAnchor(range.prevAnchor)} aria-label="আগের সময়">
            <ChevronLeft size={17} />
          </button>
          <div style={{ textAlign: "center", minWidth: 0 }}>
            <div className="small strong">{title}</div>
            <div className="tiny muted">
              {formatDateFull(range.start)} – {formatDateFull(range.end)}
            </div>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setAnchor(range.nextAnchor)}
            aria-label="পরের সময়"
            disabled={range.nextAnchor > today}
            style={range.nextAnchor > today ? { opacity: 0.4 } : undefined}
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAnchor(today)}>
            <CalendarDays size={13} /> চলতি {mode === "week" ? "সপ্তাহ" : "মাস"}
          </button>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard icon={Moon} label="গড় ঘুম" value={fmtNum(data.avgSleep, 1, "—")} unit="ঘণ্টা" tone={CHART.violet} hint={`${data.sleepNights} দিনের তথ্য`} />
        <KpiCard icon={BookOpen} label="মোট পড়াশোনা" value={fmtDuration(data.studyTotal)} tone={CHART.green} hint={`${data.studyDays} দিন`} />
        <KpiCard icon={Dumbbell} label="ব্যায়াম" value={fmtDuration(data.exerciseTotal)} tone={CHART.rose} hint={`${data.exerciseDays} দিন`} />
        <KpiCard icon={Briefcase} label="কাজ" value={fmtDuration(data.workTotal)} tone={CHART.blue} hint={`${data.workDays} দিন`} />
        <KpiCard icon={Droplets} label="গড় পানি" value={fmtNum(data.waterAvg, 1, "—")} unit="গ্লাস" tone={CHART.cyan} hint={`${data.waterDays} দিনের তথ্য`} />
        <KpiCard
          icon={ListChecks}
          label="গড় অভ্যাস"
          value={data.habit.avgPct === null ? "—" : `${Math.round(data.habit.avgPct * 100)}%`}
          tone={CHART.amber}
          hint={`${data.habit.answeredDayCount} দিনের তথ্য`}
        />
        <KpiCard icon={HeartPulse} label="মাথাব্যথার দিন" value={data.headacheDays} unit="দিন" tone={CHART.rose} hint={`${data.headacheEntries.length}টি এন্ট্রি`} />
        <KpiCard
          icon={Scale}
          label="ওজনের পরিবর্তন"
          value={data.weight ? `${data.weight.change > 0 ? "+" : ""}${data.weight.change.toFixed(1)}` : "—"}
          unit="কেজি"
          tone={CHART.green}
          hint={data.weight ? `${data.weight.samples}টি মাপ` : "তুলনার তথ্য নেই"}
        />
      </div>

      {mode === "week" ? (
        <SectionCard icon={CalendarRange} title="সাপ্তাহিক সারসংক্ষেপ" subtitle={title}>
          <div className="stack tight">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="small muted">পড়াশোনা (দিনে গড়)</span>
              <span className="small strong numeric">
                {fmtDuration(data.studyDays ? data.studyTotal / 7 : 0)} · লক্ষ্য {state.settings.studyTargetMin} মিনিট
              </span>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="small muted">রুটিন সম্পন্ন</span>
              <span className="small strong numeric">
                {data.routineDone}/{data.routineTotal}
              </span>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="small muted">খাবারের এন্ট্রি</span>
              <span className="small strong numeric">{data.mealsTotal}টি</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="small muted">কাজ (দিনে গড়)</span>
              <span className="small strong numeric">{fmtDuration(data.workTotal / 7)}</span>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard icon={BarChart3} title="আগের সময়ের সঙ্গে তুলনা" subtitle={mode === "week" ? "গত সপ্তাহের তুলনায়" : "গত মাসের তুলনায়"}>
        <div className="stack tight">
          <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
            <span className="small muted">গড় ঘুম</span>
            <span className="small numeric">
              {fmtNum(data.avgSleep, 1, "—")} <span className="muted">/ {fmtNum(prev.avgSleep, 1, "—")}</span>
            </span>
          </div>
          <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
            <span className="small muted">মোট পড়াশোনা</span>
            <span className="small numeric">
              {fmtDuration(data.studyTotal)} <span className="muted">/ {fmtDuration(prev.studyTotal)}</span>
            </span>
          </div>
          <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
            <span className="small muted">মোট কাজ</span>
            <span className="small numeric">
              {fmtDuration(data.workTotal)} <span className="muted">/ {fmtDuration(prev.workTotal)}</span>
            </span>
          </div>
          <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
            <span className="small muted">গড় অভ্যাস</span>
            <span className="small numeric">
              {data.habit.avgPct === null ? "—" : `${Math.round(data.habit.avgPct * 100)}%`}{" "}
              <span className="muted">/ {prev.habit.avgPct === null ? "—" : `${Math.round(prev.habit.avgPct * 100)}%`}</span>
            </span>
          </div>
          <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
            <span className="small muted">পড়াশোনার পার্থক্য</span>
            <span className="small strong numeric">{delta(data.studyTotal, prev.studyTotal, 0, " মিনিট") || "তুলনার তথ্য নেই"}</span>
          </div>
        </div>
      </SectionCard>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard icon={BookOpen} title={`পড়াশোনা (${title})`} height={230}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(52,211,153,0.06)" }} />
              <ReferenceLine y={state.settings.studyTargetMin} stroke={CHART.green} strokeDasharray="4 4" />
              <Bar dataKey="পড়াশোনা" fill={CHART.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={Moon} title={`ঘুম (${title})`} height={230}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={[0, "dataMax + 2"]} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid }} />
              <ReferenceLine y={state.settings.sleepTargetHrs} stroke={CHART.violet} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="ঘুম" stroke={CHART.cyan} strokeWidth={2.2} dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <SectionCard icon={ListChecks} title="অভ্যাসের ফলাফল" subtitle="শুধু উত্তর দেওয়া দিনের ভিত্তিতে">
        {data.habit.perHabit.length === 0 ? (
          <EmptyState icon={ListChecks} title="অভ্যাস নেই" hint="অভ্যাস মডিউল থেকে যোগ করুন।" />
        ) : (
          <div className="stack">
            {data.habit.perHabit.map(({ habit, yes, answered, rate }) => (
              <ProgressMeta
                key={habit.id}
                label={habit.name}
                value={rate || 0}
                right={rate === null ? "তথ্য নেই" : `${Math.round(rate * 100)}% (${yes}/${answered})`}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard icon={Target} title="লক্ষ্যের অগ্রগতি" subtitle="বর্তমান অবস্থা অনুযায়ী">
        {goals.length === 0 ? (
          <EmptyState icon={Target} title="কোনো লক্ষ্য নেই" hint="লক্ষ্য মডিউল থেকে নিজের লক্ষ্য তৈরি করুন।" />
        ) : (
          <div className="stack">
            {goals.map(({ goal, progress }) => (
              <ProgressMeta
                key={goal.id}
                label={goal.title || "লক্ষ্য"}
                value={progress && progress.pct !== null ? progress.pct : 0}
                right={
                  progress && progress.current !== null
                    ? `${Number(progress.current).toFixed(1)} / ${progress.target} ${progress.unit}`
                    : "তথ্য নেই"
                }
              />
            ))}
          </div>
        )}
      </SectionCard>

      {mode === "week" ? (
        <SectionCard icon={CalendarRange} title="সাপ্তাহিক প্রতিচ্ছবি" subtitle="নিজের পর্যবেক্ষণ লিখে রাখুন">
          <div className="form-grid">
            <Field label="যা ভালো হয়েছে">
              <TextArea
                value={reflection.good || ""}
                onChange={(e) => state.setReflection(weekStartOf(range.start), "good", e.target.value)}
                placeholder="যেমন: এই সপ্তাহে প্রতিদিন পড়তে পেরেছি"
              />
            </Field>
            <Field label="যা বদলাতে চাই">
              <TextArea
                value={reflection.improve || ""}
                onChange={(e) => state.setReflection(weekStartOf(range.start), "improve", e.target.value)}
                placeholder="যেমন: রাতে দেরিতে ঘুমানো কমাতে চাই"
              />
            </Field>
          </div>
          <div className="tiny muted" style={{ marginTop: 8 }}>
            এই নোটটি শুধু আপনার নিজের জন্য — কোনো মূল্যায়ন বা পরামর্শ নয়।
          </div>
        </SectionCard>
      ) : null}

      <SectionCard icon={FileJson} title="ডেটা ব্যাকআপ" subtitle="JSON ফাইলে সব তথ্য সংরক্ষণ ও ফিরিয়ে আনা">
        <div className="row row-wrap" style={{ gap: 8 }}>
          <button type="button" className="btn btn-primary" onClick={doExport}>
            <Download size={15} /> JSON ডাউনলোড
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => fileRef.current && fileRef.current.click()}>
            <Upload size={15} /> JSON ইমপোর্ট
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={doImport} style={{ display: "none" }} />
        </div>

        <div className="divider" />

        <div className="row row-wrap" style={{ gap: 8, marginBottom: 10 }}>
          {backupSummary(state).map((row) => (
            <Badge key={row.label} tone={row.count ? "info" : "mute"}>
              {row.label} {row.count}
            </Badge>
          ))}
        </div>

        {importMsg ? (
          <div className="tiny" style={{ color: "var(--accent)", fontWeight: 600, marginBottom: 10 }}>
            {importMsg}
          </div>
        ) : null}

        <StatusBanner tone="warn">
          <ShieldAlert size={18} />
          <span>ইমপোর্ট করলে বর্তমান সব তথ্য প্রতিস্থাপিত হবে। আগে ব্যাকআপ ডাউনলোড করে রাখুন।</span>
        </StatusBanner>

        <div className="divider" />

        <button type="button" className="btn btn-danger" onClick={doReset}>
          <RotateCcw size={15} /> সব তথ্য মুছে ফেলুন
        </button>
      </SectionCard>

      <div className="row tiny muted" style={{ justifyContent: "center", gap: 6, marginTop: 6 }}>
        <Info size={13} />
        <span>রিপোর্টের সংখ্যা বদলাতে চাইলে সংশ্লিষ্ট মডিউলে এন্ট্রি যোগ বা সম্পাদনা করুন।</span>
      </div>
    </div>
  );
}