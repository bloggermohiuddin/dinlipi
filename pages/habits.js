import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ListChecks, Plus, Trash2, Flame, CheckCircle2, CalendarDays, Award, Info, CheckCheck, Settings2 } from "lucide-react";
import {
  PageHeader,
  SectionCard,
  KpiCard,
  Badge,
  ChartCard,
  EmptyState,
  DayNav,
  YesNo,
  TextInput,
  ProgressMeta,
  StatusBanner,
} from "../components/Ui";
import { useStore } from "../store/useStore";
import { habitDayPct, habitSummary, habitStreak, habitAnsweredCount, habitDoneCount, fmtNum } from "../lib/calc";
import { todayISO, lastNDates, addDays, formatDateShort, formatDateFull, weekdayBangla } from "../lib/dateUtils";
import { CHART, tooltipStyle, axisTick, chartMargin } from "../lib/chart";
import { YES } from "../lib/defaultData";

export default function HabitsPage() {
  const state = useStore();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [newHabit, setNewHabit] = useState("");
  const dates = useMemo(() => lastNDates(30), []);
  const dayMap = state.habitLogs[date] || {};
  const dayPct = habitDayPct(dayMap, state.habits);
  const answered = habitAnsweredCount(dayMap, state.habits);
  const done = habitDoneCount(dayMap, state.habits);

  const week = useMemo(() => habitSummary(state.habitLogs, state.habits, addDays(today, -6), today), [state.habitLogs, state.habits, today]);
  const month = useMemo(() => habitSummary(state.habitLogs, state.habits, addDays(today, -29), today), [state.habitLogs, state.habits, today]);

  const chartData = useMemo(
    () =>
      lastNDates(14).map((d) => {
        const pct = habitDayPct(state.habitLogs[d], state.habits);
        return { date: formatDateShort(d), শতাংশ: pct === null ? null : Math.round(pct * 100) };
      }),
    [state.habitLogs, state.habits]
  );

  const heat = useMemo(
    () =>
      dates.map((d) => {
        const pct = habitDayPct(state.habitLogs[d], state.habits);
        return { date: d, pct };
      }),
    [dates, state.habitLogs, state.habits]
  );

  const rows = useMemo(
    () =>
      state.habits.map((h) => ({
        habit: h,
        rate: month.perHabit.find((x) => x.habit.id === h.id) || { rate: null, yes: 0, answered: 0 },
        streak: habitStreak(state.habitLogs, h.id, today),
      })),
    [state.habits, month.perHabit, state.habitLogs, today]
  );

  const bestStreak = rows.length ? Math.max(...rows.map((r) => r.streak)) : 0;

  function markAll() {
    state.habits.forEach((h) => state.setHabitLog(date, h.id, YES));
  }

  function addHabit() {
    const name = newHabit.trim();
    if (!name) return;
    state.addItem("habits", { name });
    setNewHabit("");
  }

  function removeHabit(h) {
    if (!window.confirm("এই অভ্যাসটি মুছে ফেলবেন? পুরোনো দিনের তথ্য আর দেখানো হবে না।")) return;
    state.removeItem("habits", h.id);
  }

  return (
    <div>
      <PageHeader
        icon={ListChecks}
        title="অভ্যাস"
        subtitle="প্রতিদিনের অভ্যাস হ্যাঁ বা না দিয়ে ট্র্যাক করুন — উত্তর না দিলে সেটি ব্যর্থ হিসেবে গণনা হবে না।"
        actions={
          <button type="button" className="btn btn-primary" onClick={markAll} disabled={state.habits.every((h) => dayMap[h.id] === YES)}>
            <CheckCheck size={16} /> সব সম্পন্ন
          </button>
        }
      />

      <SectionCard icon={CalendarDays} title="তারিখ" subtitle="যেকোনো দিনের অভ্যাস পরে সম্পাদনা করা যাবে।">
        <DayNav date={date} onChange={setDate} dates={dates} hasData={(d) => habitAnsweredCount(state.habitLogs[d], state.habits) > 0} />
      </SectionCard>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard icon={CheckCircle2} label="এই দিনে" value={dayPct === null ? "—" : `${Math.round(dayPct * 100)}%`} tone={CHART.green} hint={`${done}/${state.habits.length} সম্পন্ন`} />
        <KpiCard icon={CalendarDays} label="৭ দিনের গড়" value={week.avgPct === null ? "—" : `${Math.round(week.avgPct * 100)}%`} tone={CHART.cyan} hint={`${week.answeredDayCount} দিনের তথ্য`} />
        <KpiCard icon={Award} label="৩০ দিনের গড়" value={month.avgPct === null ? "—" : `${Math.round(month.avgPct * 100)}%`} tone={CHART.violet} />
        <KpiCard icon={Flame} label="সেরা টানা ধারা" value={bestStreak} unit="দিন" tone={CHART.amber} />
        <KpiCard icon={ListChecks} label="৩০ দিনে উত্তর" value={`${answered ? Math.round((done / Math.max(1, answered)) * 100) : 0}%`} tone={CHART.blue} hint="শুধু উত্তর দেওয়া অভ্যাস" />
      </div>

      {state.habits.length === 0 ? (
        <StatusBanner>
          <Info size={18} />
          <span>এখনো কোনো অভ্যাস নেই। নিচের ব্যবস্থাপনা অংশ থেকে নতুন অভ্যাস যোগ করুন।</span>
        </StatusBanner>
      ) : null}

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <div>
            <div className="small strong">{formatDateFull(date)}</div>
            <div className="tiny muted">
              {weekdayBangla(date)}বার · {answered}/{state.habits.length} অভ্যাসে উত্তর দেওয়া হয়েছে
            </div>
          </div>
          <Badge tone={dayPct === null ? "mute" : dayPct >= state.settings.habitTargetPct / 100 ? "good" : "warn"}>
            {dayPct === null ? "তথ্য নেই" : `${Math.round(dayPct * 100)}%`}
          </Badge>
        </div>
        <ProgressMeta
          label="দৈনিক লক্ষ্য"
          value={dayPct || 0}
          right={`${Math.round((dayPct || 0) * 100)} / ${state.settings.habitTargetPct}%`}
          tone={dayPct !== null && dayPct * 100 < state.settings.habitTargetPct ? "warn" : ""}
        />
      </div>

      <SectionCard icon={CheckCircle2} title="দৈনিক চেকলিস্ট" subtitle={`${done} সম্পন্ন · ${answered} উত্তর দেওয়া`} flush>
        {state.habits.length === 0 ? (
          <EmptyState icon={ListChecks} title="অভ্যাস নেই" hint="নিচে নতুন অভ্যাস যোগ করুন।" />
        ) : (
          state.habits.map((h) => (
            <div key={h.id} className="list-row" style={{ padding: "10px 16px" }}>
              <span className="list-row-main">
                <span className="list-row-title" style={{ display: "block" }}>{h.name}</span>
                <span className="list-row-sub">
                  {habitStreak(state.habitLogs, h.id, today) ? `টানা ${habitStreak(state.habitLogs, h.id, today)} দিন` : "ধারা শুরু হয়নি"}
                </span>
              </span>
              <div style={{ width: 122, flex: "0 0 auto" }}>
                <YesNo value={dayMap[h.id] || ""} onChange={(v) => state.setHabitLog(date, h.id, v)} />
              </div>
            </div>
          ))
        )}
      </SectionCard>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard icon={ListChecks} title="অভ্যাসের ধারা (শেষ ১৪ দিন)" height={230}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid }} />
              <Line type="monotone" dataKey="শতাংশ" stroke={CHART.green} strokeWidth={2.2} dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <SectionCard icon={CalendarDays} title="৩০ দিনের ছবি" subtitle="প্রতিটি ঘর এক দিনের সম্পন্নতার হার">
          <div className="heat-grid">
            {heat.map((h) => {
              const lvl = h.pct === null ? "" : h.pct >= 0.8 ? "l4" : h.pct >= 0.6 ? "l3" : h.pct >= 0.4 ? "l2" : "l1";
              return <div key={h.date} className={`heat-cell ${lvl}`} title={`${formatDateFull(h.date)} · ${h.pct === null ? "তথ্য নেই" : `${Math.round(h.pct * 100)}%`}`} />;
            })}
          </div>
          <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
            <span className="tiny muted">{formatDateShort(dates[0])}</span>
            <span className="tiny muted">{formatDateShort(today)}</span>
          </div>
        </SectionCard>
      </div>

      <SectionCard icon={Award} title="প্রতিটি অভ্যাসের সাফল্য (৩০ দিন)">
        {rows.length === 0 ? (
          <EmptyState icon={Award} title="তথ্য নেই" hint="অভ্যাস যোগ করে উত্তর দেওয়া শুরু করুন।" />
        ) : (
          <div className="stack">
            {rows.map(({ habit, rate, streak }) => (
              <div key={habit.id}>
                <div className="progress-meta">
                  <span className="small strong" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {habit.name}
                  </span>
                  <span className="tiny numeric muted" style={{ flex: "0 0 auto" }}>
                    {rate.rate === null ? "তথ্য নেই" : `${Math.round(rate.rate * 100)}%`}
                    {streak ? ` · ${streak} দিন` : ""}
                  </span>
                </div>
                <div className={`progress ${rate.rate !== null && rate.rate < 0.5 ? "warn" : ""}`}>
                  <span style={{ width: `${Math.round((rate.rate || 0) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard icon={Settings2} title="অভ্যাস ব্যবস্থাপনা" subtitle="নিজের অভ্যাস যোগ, নাম বদল বা বাদ দিন।">
        <div className="stack tight">
          {state.habits.map((h) => (
            <div key={h.id} className="row" style={{ gap: 6 }}>
              <TextInput value={h.name} onChange={(e) => state.setItemField("habits", h.id, "name", e.target.value)} />
              <button type="button" className="btn-icon danger" style={{ width: 34, height: 34, minHeight: 34 }} onClick={() => removeHabit(h)} aria-label="অভ্যাস মুছুন">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="row" style={{ gap: 8, marginTop: 14 }}>
          <TextInput placeholder="নতুন অভ্যাসের নাম" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHabit()} />
          <button type="button" className="btn btn-primary" onClick={addHabit} disabled={!newHabit.trim()}>
            <Plus size={15} /> যোগ
          </button>
        </div>
      </SectionCard>

      <div className="row tiny muted" style={{ justifyContent: "center", gap: 6, marginTop: 6 }}>
        <Info size={13} />
        <span>যেদিন কোনো অভ্যাসে উত্তর দেননি, সেদিন সেটি হিসাবে ধরা হয় না — শুধু উত্তর দেওয়া দিনের হার দেখানো হয়।</span>
      </div>
    </div>
  );
}