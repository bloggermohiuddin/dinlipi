import { useMemo, useState } from "react";
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
  Scale,
  Utensils,
  Target,
  Printer,
  CalendarRange,
  CalendarDays,
  Info,
} from "lucide-react";
import {
  PageHeader,
  SectionCard,
  KpiCard,
  ChartCard,
  ProgressMeta,
  Tabs,
  Field,
  TextArea,
  EmptyState,
} from "../components/Ui";
import { useStore } from "../store/useStore";
import {
  daySummary,
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
  const weight = weightRangeChange(state.weights, start, end);

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
    weight,
  };
}

export default function ReportsPage() {
  const state = useStore();
  const settings = state.settings;
  const today = todayISO();
  const [mode, setMode] = useState("week");
  const [anchor, setAnchor] = useState(today);

  const range = useMemo(() => periodRange(mode, anchor), [mode, anchor]);
  const prevRange = useMemo(() => periodRange(mode, range.prevAnchor), [mode, range.prevAnchor]);
  const data = useMemo(() => summarize(state, range.start, range.end), [state, range.start, range.end]);
  const prev = useMemo(() => summarize(state, prevRange.start, prevRange.end), [state, prevRange.start, prevRange.end]);
  const reflection = state.reflections[weekStartOf(range.start)] || {};

  const chartData = useMemo(
    () =>
      data.dates.map((d) => {
        const s = daySummary(state, d);
        return {
          date: formatDateShort(d),
          ঘুম: s.sleepHrs === null ? null : Number(s.sleepHrs.toFixed(1)),
          পড়াশোনা: Math.round(s.studyMin),
          কাজ: Math.round(s.workMin),
          পানি: s.waterGlasses,
          ব্যায়াম: Math.round(s.exerciseMin),
          খাবার: s.meals.length,
          ওজন: s.weight === null ? null : Number(s.weight.toFixed(1)),
        };
      }),
    [state, data.dates]
  );

  function delta(cur, prevValue, digits = 1, unit = "") {
    if (cur === null || prevValue === null || prevValue === undefined) return null;
    const diff = cur - prevValue;
    return `${diff > 0 ? "+" : ""}${diff.toFixed(digits)}${unit}`;
  }

  const title = mode === "week" ? `${formatDateShort(range.start)} – ${formatDateShort(range.end)}` : formatMonthYear(parseISODate(range.start).getFullYear(), parseISODate(range.start).getMonth());

  const avgStudyPerDay = data.count ? data.studyTotal / data.count : 0;
  const avgExercisePerDay = data.count ? data.exerciseTotal / data.count : 0;

  const targets = [
    {
      label: "ঘুম",
      actual: data.avgSleep === null ? "তথ্য নেই" : `${fmtNum(data.avgSleep, 1)} ঘণ্টা`,
      target: `${settings.sleepTargetHrs} ঘণ্টা`,
      value: data.avgSleep === null || !settings.sleepTargetHrs ? 0 : data.avgSleep / settings.sleepTargetHrs,
    },
    {
      label: "পড়াশোনা (দিনে গড়)",
      actual: `${Math.round(avgStudyPerDay)} মিনিট`,
      target: `${settings.studyTargetMin} মিনিট`,
      value: settings.studyTargetMin ? avgStudyPerDay / settings.studyTargetMin : 0,
    },
    {
      label: "পানি (দিনে গড়)",
      actual: data.waterAvg === null ? "তথ্য নেই" : `${fmtNum(data.waterAvg, 1)} গ্লাস`,
      target: `${settings.waterTarget} গ্লাস`,
      value: data.waterAvg === null || !settings.waterTarget ? 0 : data.waterAvg / settings.waterTarget,
    },
    {
      label: "ব্যায়াম (দিনে গড়)",
      actual: `${Math.round(avgExercisePerDay)} মিনিট`,
      target: `${settings.exerciseTargetMin} মিনিট`,
      value: settings.exerciseTargetMin ? avgExercisePerDay / settings.exerciseTargetMin : 0,
    },
  ];

  const hasWeightData = chartData.some((row) => row.ওজন !== null);

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

      <SectionCard icon={Target} title="লক্ষ্য অনুযায়ী অগ্রগতি" subtitle="দৈনিক লক্ষ্যের সঙ্গে এই সময়ের গড় তুলনা">
        <div className="stack">
          {targets.map((t) => (
            <ProgressMeta
              key={t.label}
              label={t.label}
              value={t.value}
              right={`${t.actual} / ${t.target}`}
            />
          ))}
        </div>
        <div className="divider" />
        <div className="tiny muted" style={{ lineHeight: 1.7 }}>
          লক্ষ্য সেটিংস থেকে বদলানো যায়। এখানে শুধু নিজের রেকর্ডের গড় ও লক্ষ্যের তুলনা দেখানো হয়, কোনো মূল্যায়ন নয়।
        </div>
      </SectionCard>

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

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard icon={Briefcase} title={`কাজ (${title})`} height={230}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(96,165,250,0.06)" }} />
              <ReferenceLine y={settings.workLimitMin} stroke={CHART.blue} strokeDasharray="4 4" />
              <Bar dataKey="কাজ" fill={CHART.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={Droplets} title={`পানি (${title})`} height={230}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(34,211,238,0.06)" }} />
              <ReferenceLine y={settings.waterTarget} stroke={CHART.cyan} strokeDasharray="4 4" />
              <Bar dataKey="পানি" fill={CHART.cyan} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard icon={Dumbbell} title={`ব্যায়াম (${title})`} height={230}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(251,113,133,0.06)" }} />
              <ReferenceLine y={settings.exerciseTargetMin} stroke={CHART.rose} strokeDasharray="4 4" />
              <Bar dataKey="ব্যায়াম" fill={CHART.rose} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={Utensils} title={`খাবারের এন্ট্রি (${title})`} height={230}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(251,191,36,0.06)" }} />
              <Bar dataKey="খাবার" fill={CHART.amber} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard icon={Scale} title={`ওজনের ধারা (${title})`} height={230}>
        {hasWeightData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid }} />
              <Line type="monotone" dataKey="ওজন" stroke={CHART.green} strokeWidth={2.2} dot={{ r: 2.5 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={Scale} title="এই সময়ে ওজনের মাপ নেই" hint="দৈনিক লগে ওজন যোগ করলে এখানে ধারা দেখা যাবে।" />
        )}
      </ChartCard>

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

      <div className="row tiny muted" style={{ justifyContent: "center", gap: 6, marginTop: 6 }}>
        <Info size={13} />
        <span>রিপোর্টের সংখ্যা বদলাতে চাইলে দৈনিক লগে এন্ট্রি যোগ বা সম্পাদনা করুন। ব্যাকআপ ও ইমপোর্ট সেটিংসে আছে।</span>
      </div>
    </div>
  );
}