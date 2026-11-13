import { useMemo } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  LayoutDashboard,
  Moon,
  Utensils,
  Droplets,
  BookOpen,
  Briefcase,
  Dumbbell,
  Scale,
  HeartPulse,
  ListChecks,
  Plus,
  ArrowRight,
  Info,
  CheckCircle2,
  Circle,
  Target,
  Activity,
} from "lucide-react";
import {
  PageHeader,
  SectionCard,
  KpiCard,
  Badge,
  StatusBanner,
  ChartCard,
  Progress,
  ProgressMeta,
  EmptyState,
} from "../components/Ui";
import { useStore } from "../store/useStore";
import { daySummary, dayEvents, habitDayPct, goalProgress, latestWeight, fmtNum, fmtDuration } from "../lib/calc";
import { todayISO, lastNDates, addDays, formatDateShort, formatDateFull, weekdayBangla, inRange } from "../lib/dateUtils";
import { CHART, tooltipStyle, axisTick, chartMargin } from "../lib/chart";

export default function Dashboard() {
  const state = useStore();
  const openQuickAdd = state.openQuickAdd;
  const today = todayISO();
  const settings = state.settings;
  const last7 = useMemo(() => lastNDates(7), []);
  const last14 = useMemo(() => lastNDates(14), []);

  const todaySummary = useMemo(() => daySummary(state, today), [state, today]);

  const weekSeries = useMemo(
    () =>
      last7.map((d) => {
        const s = daySummary(state, d);
        return {
          date: formatDateShort(d),
          ঘুম: s.sleepHrs === null ? null : Number(s.sleepHrs.toFixed(1)),
          পড়াশোনা: Math.round(s.studyMin),
          কাজ: Math.round(s.workMin),
          ব্যায়াম: Math.round(s.exerciseMin),
        };
      }),
    [state, last7]
  );

  const sleepSeries = useMemo(
    () =>
      last14.map((d) => {
        const s = daySummary(state, d);
        return { date: formatDateShort(d), ঘুম: s.sleepHrs === null ? null : Number(s.sleepHrs.toFixed(1)) };
      }),
    [state, last14]
  );

  const studySeries = useMemo(
    () =>
      last14.map((d) => {
        const s = daySummary(state, d);
        return { date: formatDateShort(d), মিনিট: Math.round(s.studyMin) };
      }),
    [state, last14]
  );

  const habitSeries = useMemo(
    () =>
      last14.map((d) => {
        const pct = habitDayPct((state.habitLogs || {})[d], state.habits);
        return { date: formatDateShort(d), শতাংশ: pct === null ? null : Math.round(pct * 100) };
      }),
    [state.habitLogs, state.habits, last14]
  );

  const weightSeriesData = useMemo(
    () =>
      state.weights
        .filter((w) => w.weight !== "" && Number(w.weight) > 0)
        .slice()
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .slice(-20)
        .map((w) => ({ date: formatDateShort(w.date), ওজন: Number(w.weight) })),
    [state.weights]
  );

  const currentWeight = latestWeight(state.weights);
  const startWeight = state.profile.startWeight === "" ? null : Number(state.profile.startWeight);
  const totalChange = currentWeight && startWeight ? currentWeight.weight - startWeight : null;

  const week = useMemo(() => {
    const from = addDays(today, -6);
    const summaries = last7.map((d) => daySummary(state, d));
    const sleep = summaries.filter((s) => s.sleepHrs !== null);
    const study = summaries.filter((s) => s.studyEntries.length > 0);
    const habits = last7.map((d) => habitDayPct((state.habitLogs || {})[d], state.habits)).filter((v) => v !== null);
    return {
      from,
      avgSleep: sleep.length ? sleep.reduce((a, s) => a + s.sleepHrs, 0) / sleep.length : null,
      studyTotal: summaries.reduce((a, s) => a + s.studyMin, 0),
      studyDays: study.length,
      exerciseDays: summaries.filter((s) => s.exerciseEntries.length > 0).length,
      habitAvg: habits.length ? habits.reduce((a, b) => a + b, 0) / habits.length : null,
      headacheDays: state.health.filter((h) => inRange(h.date, from, today) && h.kind !== "অন্যান্য").length,
    };
  }, [state, last7, today]);

  const goals = useMemo(() => state.goals.map((g) => ({ goal: g, progress: goalProgress(g, state) })), [state]);
  const pendingRoutine = state.routine.filter((r) => (state.routineLogs[today] || {})[r.id] !== "হ্যাঁ");

  const recent = useMemo(() => {
    const out = [];
    last7
      .slice()
      .reverse()
      .forEach((d) => {
        dayEvents(state, d).forEach((e) => out.push({ ...e, date: d }));
      });
    return out.slice(0, 8);
  }, [state, last7]);

  const hasAnyData =
    state.sleep.length +
      state.meals.length +
      state.water.length +
      state.study.length +
      state.work.length +
      state.exercise.length +
      state.health.length +
      state.weights.length >
    0;

  const sleepPct = todaySummary.sleepHrs === null ? 0 : todaySummary.sleepHrs / settings.sleepTargetHrs;
  const studyPct = settings.studyTargetMin ? todaySummary.studyMin / settings.studyTargetMin : 0;
  const waterPct = settings.waterTarget ? (todaySummary.waterGlasses || 0) / settings.waterTarget : 0;
  const exercisePct = settings.exerciseTargetMin ? todaySummary.exerciseMin / settings.exerciseTargetMin : 0;
  const workPct = settings.workLimitMin ? todaySummary.workMin / settings.workLimitMin : 0;

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        title="ড্যাশবোর্ড"
        subtitle="আজকের অবস্থা, সাম্প্রতিক অগ্রগতি ও দ্রুত এন্ট্রি — সব এক জায়গায়।"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => openQuickAdd("menu")}>
            <Plus size={16} /> নতুন এন্ট্রি
          </button>
        }
      />

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div className="row row-wrap" style={{ justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div className="tiny muted">আজ · {weekdayBangla(today)}বার</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, marginTop: 2 }}>{formatDateFull(today)}</div>
          </div>
          <Badge tone={todaySummary.habitPct === null ? "mute" : "good"}>
            {todaySummary.habitPct === null ? "আজকের তথ্য শুরু করুন" : `অভ্যাস ${Math.round(todaySummary.habitPct * 100)}%`}
          </Badge>
        </div>

        <div className="stack tight" style={{ marginTop: 14 }}>
          <ProgressMeta label="ঘুম" value={sleepPct} right={`${fmtNum(todaySummary.sleepHrs, 1, "0")} / ${settings.sleepTargetHrs} ঘণ্টা`} />
          <ProgressMeta label="পড়াশোনা" value={studyPct} right={`${Math.round(todaySummary.studyMin)} / ${settings.studyTargetMin} মিনিট`} />
          <ProgressMeta label="পানি" value={waterPct} right={`${todaySummary.waterGlasses ?? 0} / ${settings.waterTarget} গ্লাস`} />
          <ProgressMeta label="ব্যায়াম" value={exercisePct} right={`${Math.round(todaySummary.exerciseMin)} / ${settings.exerciseTargetMin} মিনিট`} />
          <ProgressMeta
            label="Smart Madaripur কাজ"
            value={Math.min(1, workPct)}
            tone={workPct > 1 ? "danger" : ""}
            right={`${Math.round(todaySummary.workMin)} / ${settings.workLimitMin} মিনিট`}
          />
        </div>
      </div>

      {!hasAnyData ? (
        <div style={{ marginBottom: 14 }}>
          <StatusBanner>
            <Info size={18} />
            <span>
              এখনো কোনো তথ্য নেই। নিচের দ্রুত যোগ বাটন থেকে আজকের ঘুম, খাবার বা পড়ার সেশন যোগ করুন — ড্যাশবোর্ড নিজে থেকেই
              হিসাব দেখাবে।
            </span>
          </StatusBanner>
        </div>
      ) : null}

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard icon={Moon} label="আজকের ঘুম" value={fmtNum(todaySummary.sleepHrs, 1, "—")} unit="ঘণ্টা" tone={CHART.violet} />
        <KpiCard
          icon={Utensils}
          label="আজকের খাবার"
          value={todaySummary.meals.length ? `${todaySummary.mainMealCount}/৩` : "—"}
          tone={CHART.amber}
          hint={todaySummary.meals.length ? `${todaySummary.meals.length}টি এন্ট্রি` : "এখনো নেই"}
        />
        <KpiCard icon={Droplets} label="আজকের পানি" value={todaySummary.waterGlasses ?? "—"} unit="গ্লাস" tone={CHART.cyan} />
        <KpiCard icon={BookOpen} label="আজকের পড়াশোনা" value={Math.round(todaySummary.studyMin)} unit="মিনিট" tone={CHART.green} />
        <KpiCard icon={Briefcase} label="আজকের কাজ" value={Math.round(todaySummary.workMin)} unit="মিনিট" tone={CHART.blue} />
        <KpiCard icon={Dumbbell} label="আজকের ব্যায়াম" value={Math.round(todaySummary.exerciseMin)} unit="মিনিট" tone={CHART.rose} />
        <KpiCard icon={Scale} label="বর্তমান ওজন" value={currentWeight ? currentWeight.weight.toFixed(1) : "—"} unit="কেজি" tone={CHART.green} />
        <KpiCard
          icon={HeartPulse}
          label="আজ মাথাব্যথা"
          value={todaySummary.headacheCount > 0 ? "হ্যাঁ" : todaySummary.healthEntries.length ? "না" : "—"}
          tone={CHART.rose}
          hint={todaySummary.headacheCount > 0 ? `${todaySummary.headacheCount}টি এন্ট্রি` : undefined}
        />
        <KpiCard
          icon={ListChecks}
          label="আজকের অভ্যাস"
          value={todaySummary.habitPct === null ? "—" : `${Math.round(todaySummary.habitPct * 100)}%`}
          tone={CHART.violet}
          hint={`${todaySummary.habitDone}/${todaySummary.habitTotal} সম্পন্ন`}
        />
        <KpiCard
          icon={Target}
          label="ওজন পরিবর্তন"
          value={totalChange === null ? "—" : `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(1)}`}
          unit="কেজি"
          tone={totalChange !== null && totalChange < 0 ? CHART.cyan : CHART.amber}
          hint="শুরুর ওজন থেকে"
        />
      </div>

      <SectionCard
        icon={Plus}
        title="দ্রুত যোগ করুন"
        subtitle="এক ট্যাপে আজকের এন্ট্রি — একই দিনে যতবার দরকার ততবার।"
      >
        <div className="quick-grid">
          {[
            { key: "sleep", label: "ঘুম", icon: Moon, tone: CHART.violet },
            { key: "meals", label: "খাবার", icon: Utensils, tone: CHART.amber },
            { key: "water", label: "পানি", icon: Droplets, tone: CHART.cyan },
            { key: "study", label: "পড়াশোনা", icon: BookOpen, tone: CHART.green },
            { key: "work", label: "কাজ", icon: Briefcase, tone: CHART.blue },
            { key: "exercise", label: "ব্যায়াম", icon: Dumbbell, tone: CHART.rose },
            { key: "health", label: "স্বাস্থ্য", icon: HeartPulse, tone: "#f472b6" },
            { key: "weights", label: "ওজন", icon: Scale, tone: CHART.green },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.key} type="button" className="quick-btn" style={{ "--quick-tone": c.tone }} onClick={() => openQuickAdd(c.key)}>
                <Icon size={21} strokeWidth={1.9} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard icon={Activity} title="সাপ্তাহিক সারসংক্ষেপ" height={230}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekSeries} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(52,211,153,0.06)" }} />
              <Bar dataKey="পড়াশোনা" fill={CHART.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="কাজ" fill={CHART.amber} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={Scale} title="ওজনের প্রবণতা (কেজি)" height={230}>
          {weightSeriesData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightSeriesData} margin={chartMargin}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid }} />
                <Line type="monotone" dataKey="ওজন" stroke={CHART.green} strokeWidth={2.4} dot={{ r: 2.5 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Scale} title="ওজনের তথ্য নেই" hint="ওজন যোগ করলে এখানে প্রবণতা দেখা যাবে।" />
          )}
        </ChartCard>
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard icon={Moon} title="ঘুমের ধারা (শেষ ১৪ দিন)" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sleepSeries} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={[0, "dataMax + 2"]} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid }} />
              <ReferenceLine y={settings.sleepTargetHrs} stroke={CHART.violet} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="ঘুম" stroke={CHART.cyan} strokeWidth={2.2} dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={BookOpen} title="পড়াশোনার ধারা (শেষ ১৪ দিন)" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={studySeries} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(52,211,153,0.06)" }} />
              <ReferenceLine y={settings.studyTargetMin} stroke={CHART.green} strokeDasharray="4 4" />
              <Bar dataKey="মিনিট" fill={CHART.cyan} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard icon={ListChecks} title="অভ্যাস সম্পন্ন (শেষ ১৪ দিন)" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={habitSeries} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid }} />
              <Line type="monotone" dataKey="শতাংশ" stroke={CHART.violet} strokeWidth={2.2} dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <SectionCard icon={Activity} title="সাপ্তাহিক সার" subtitle="শেষ ৭ দিনের বাস্তব তথ্য">
          <div className="stack tight">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="small muted">গড় ঘুম</span>
              <span className="small strong numeric">{fmtNum(week.avgSleep, 1, "—")} ঘণ্টা</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="small muted">মোট পড়াশোনা</span>
              <span className="small strong numeric">{fmtDuration(week.studyTotal)}</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="small muted">পড়াশোনার দিন</span>
              <span className="small strong numeric">{week.studyDays} দিন</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="small muted">ব্যায়ামের দিন</span>
              <span className="small strong numeric">{week.exerciseDays} দিন</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="small muted">মাথাব্যথার দিন</span>
              <span className="small strong numeric">{week.headacheDays} দিন</span>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="small muted">গড় অভ্যাস</span>
              <span className="small strong numeric">{fmtNum(week.habitAvg === null ? null : week.habitAvg * 100, 0, "—")}%</span>
            </div>
          </div>
          <Link href="/reports" className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 12 }}>
            পূর্ণ রিপোর্ট <ArrowRight size={14} />
          </Link>
        </SectionCard>
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <SectionCard
          icon={CheckCircle2}
          title="আজকের বাকি কাজ"
          subtitle="রুটিন ও লক্ষ্য অনুযায়ী"
          right={<Badge tone={pendingRoutine.length ? "warn" : "good"}>{pendingRoutine.length} বাকি</Badge>}
        >
          {pendingRoutine.length === 0 && goals.filter((g) => (g.progress ? g.progress.pct : 1) < 1).length === 0 ? (
            <EmptyState icon={CheckCircle2} title="সব সম্পন্ন" hint="আজকের রুটিনের সব কাজ সম্পন্ন হয়েছে।" />
          ) : (
            <div className="stack tight">
              {pendingRoutine.slice(0, 5).map((r) => (
                <Link key={r.id} href="/routine" className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                  <span className="row" style={{ gap: 8, minWidth: 0 }}>
                    <Circle size={14} color="var(--text-3)" />
                    <span className="small" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.activity}
                    </span>
                  </span>
                  <span className="tiny muted">{r.startTime || ""}</span>
                </Link>
              ))}
              {goals
                .filter((g) => (g.progress ? g.progress.pct : 1) < 1)
                .slice(0, 3)
                .map(({ goal, progress }) => (
                  <Link key={goal.id} href="/goals" className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                    <span className="row" style={{ gap: 8, minWidth: 0 }}>
                      <Target size={14} color="var(--text-3)" />
                      <span className="small" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {goal.title || "লক্ষ্য"}
                      </span>
                    </span>
                    <span className="tiny muted numeric">
                      {progress && progress.pct !== null ? `${Math.round(progress.pct * 100)}%` : "—"}
                    </span>
                  </Link>
                ))}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <Progress value={state.routine.length ? todaySummary.routineDone / state.routine.length : 0} />
            <div className="tiny muted" style={{ marginTop: 5 }}>
              রুটিন {todaySummary.routineDone}/{state.routine.length} সম্পন্ন
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={Activity}
          title="সাম্প্রতিক কার্যকলাপ"
          subtitle="শেষ ৭ দিনের সর্বশেষ এন্ট্রি"
          right={
            <Link href="/daily" className="btn btn-ghost btn-sm">
              সব দেখুন
            </Link>
          }
        >
          {recent.length === 0 ? (
            <EmptyState icon={Activity} title="কোনো এন্ট্রি নেই" hint="দ্রুত যোগ বাটন দিয়ে প্রথম তথ্য যোগ করুন।" />
          ) : (
            <div style={{ margin: "-6px 0" }}>
              {recent.map((e) => (
                <div key={`${e.collection}-${e.id}`} className="list-row" style={{ padding: "9px 0" }}>
                  <div className="list-row-main">
                    <div className="list-row-title">{e.title}</div>
                    <div className="list-row-sub">
                      {formatDateShort(e.date)} · {e.detail}
                    </div>
                  </div>
                  {e.time ? <span className="tiny muted numeric">{e.time}</span> : null}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="row tiny muted" style={{ justifyContent: "center", gap: 6, marginTop: 6 }}>
        <Info size={13} />
        <span>সব হিসাব আপনার এন্ট্রি থেকেই তৈরি — কোনো অনুমান করা তথ্য নেই।</span>
      </div>
    </div>
  );
}