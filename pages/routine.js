import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Clock, Plus, Pencil, Trash2, CheckCircle2, Circle, CalendarDays, Settings2, Info, RotateCcw } from "lucide-react";
import {
  PageHeader,
  SectionCard,
  KpiCard,
  Badge,
  ChartCard,
  EmptyState,
  DayNav,
  Sheet,
  Field,
  TextInput,
  TimeInput,
  Select,
  ProgressMeta,
  StatusBanner,
} from "../components/Ui";
import { useStore } from "../store/useStore";
import { fmtNum } from "../lib/calc";
import { todayISO, lastNDates, addDays, formatDateShort, formatDateFull, weekdayBangla } from "../lib/dateUtils";
import { ROUTINE_CATEGORIES, YES } from "../lib/defaultData";
import { CHART, tooltipStyle, axisTick, chartMargin } from "../lib/chart";

function RoutineForm({ initial, onSave, onCancel }) {
  const [v, setV] = useState({
    startTime: "",
    endTime: "",
    activity: "",
    category: "",
    ...initial,
  });
  const [error, setError] = useState("");
  const set = (k) => (e) => setV((p) => ({ ...p, [k]: e.target ? e.target.value : e }));

  function submit() {
    if (!v.activity.trim()) return setError("কাজের নাম দিন।");
    onSave(v);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="form-grid">
        <Field label="শুরুর সময়">
          <TimeInput value={v.startTime} onChange={set("startTime")} />
        </Field>
        <Field label="শেষের সময়">
          <TimeInput value={v.endTime} onChange={set("endTime")} />
        </Field>
        <Field label="ক্যাটাগরি">
          <Select value={v.category} onChange={set("category")} options={ROUTINE_CATEGORIES} placeholder="বেছে নিন" />
        </Field>
        <Field label="কাজ">
          <TextInput value={v.activity} onChange={set("activity")} placeholder="যেমন: যুক্তিবিদ্যা পড়া" />
        </Field>
      </div>
      {error ? (
        <div className="tiny" style={{ color: "var(--danger)", marginTop: 8, fontWeight: 600 }}>
          {error}
        </div>
      ) : null}
      <div className="row" style={{ gap: 8, marginTop: 16 }}>
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
          সেভ করুন
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          বাতিল
        </button>
      </div>
    </form>
  );
}

export default function RoutinePage() {
  const state = useStore();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [editor, setEditor] = useState(null);
  const [manage, setManage] = useState(false);
  const dates = useMemo(() => lastNDates(30), []);
  const dayMap = state.routineLogs[date] || {};
  const doneCount = state.routine.filter((r) => dayMap[r.id] === YES).length;

  const chartData = useMemo(
    () =>
      lastNDates(7).map((d) => {
        const map = state.routineLogs[d] || {};
        const done = state.routine.filter((r) => map[r.id] === YES).length;
        return { date: formatDateShort(d), শতাংশ: state.routine.length ? Math.round((done / state.routine.length) * 100) : 0 };
      }),
    [state.routineLogs, state.routine, lastNDates]
  );

  function addRow() {
    state.addItem("routine", { startTime: "", endTime: "", activity: "নতুন কাজ", category: "অন্যান্য" });
  }

  function saveRow(values) {
    if (editor && editor.id) state.updateItem("routine", editor.id, values);
    else state.addItem("routine", values);
    setEditor(null);
  }

  function removeRow(r) {
    if (!window.confirm("রুটিন থেকে এই কাজটি মুছে ফেলবেন?")) return;
    state.removeItem("routine", r.id);
  }

  return (
    <div>
      <PageHeader
        icon={Clock}
        title="দৈনিক রুটিন"
        subtitle="নমনীয় টেমপ্লেট — প্রতিদিন একই কাজের তালিকা, তবে কোনটা হয়েছে তা দিন অনুযায়ী আলাদা।"
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setManage((v) => !v)}>
              <Settings2 size={16} /> টেমপ্লেট
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setEditor({})}>
              <Plus size={16} /> কাজ যোগ
            </button>
          </>
        }
      />

      <SectionCard icon={CalendarDays} title="তারিখ" subtitle="দিন বদলে সেই দিনের সম্পন্ন কাজ দেখুন।">
        <DayNav date={date} onChange={setDate} dates={dates} hasData={(d) => Object.values(state.routineLogs[d] || {}).includes(YES)} />
      </SectionCard>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard icon={CheckCircle2} label="এই দিনে সম্পন্ন" value={`${doneCount}/${state.routine.length}`} tone={CHART.green} />
        <KpiCard icon={Clock} label="বাকি" value={Math.max(0, state.routine.length - doneCount)} unit="কাজ" tone={CHART.amber} />
        <KpiCard icon={IconPercent} label="সম্পন্নতার হার" value={state.routine.length ? `${Math.round((doneCount / state.routine.length) * 100)}%` : "—"} tone={CHART.cyan} />
        <KpiCard icon={CalendarDays} label="মোট রুটিন আইটেম" value={state.routine.length} tone={CHART.violet} />
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <div>
            <div className="small strong">{formatDateFull(date)}</div>
            <div className="tiny muted">{weekdayBangla(date)}বার</div>
          </div>
          <Badge tone={doneCount === state.routine.length && state.routine.length ? "good" : "mute"}>
            {doneCount}/{state.routine.length}
          </Badge>
        </div>
        <ProgressMeta
          label="দিনের সম্পন্নতা"
          value={state.routine.length ? doneCount / state.routine.length : 0}
          right={`${state.routine.length ? Math.round((doneCount / state.routine.length) * 100) : 0}%`}
        />
        <div className="row" style={{ gap: 6, marginTop: 10 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => state.clearRoutineLog(date)}>
            <RotateCcw size={13} /> দিনের চিহ্ন মুছুন
          </button>
        </div>
      </div>

      <SectionCard
        icon={Clock}
        title="আজকের রুটিন"
        subtitle="সম্পন্ন হলে 'চিহ্নিত করুন' চাপুন"
        right={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditor({})}>
            <Plus size={14} /> যোগ
          </button>
        }
        flush
      >
        {state.routine.length === 0 ? (
          <EmptyState icon={Clock} title="রুটিন খালি" hint="'কাজ যোগ' থেকে প্রথম কাজটি যোগ করুন।" />
        ) : (
          state.routine
            .slice()
            .sort((a, b) => (a.startTime || "") < (b.startTime || "") ? -1 : 1)
            .map((r) => {
              const done = dayMap[r.id] === YES;
              return (
                <div key={r.id} className="list-row" style={{ padding: "10px 14px" }}>
                  {done ? <CheckCircle2 size={17} color="var(--accent)" /> : <Circle size={17} color="var(--text-3)" />}
                  <div className="list-row-main">
                    <div className="list-row-title" style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.7 : 1 }}>
                      {r.activity}
                    </div>
                    <div className="list-row-sub">
                      {r.startTime || "—"} – {r.endTime || "—"}
                      {r.category ? ` · ${r.category}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm ${done ? "btn-ghost" : "btn-primary"}`}
                    onClick={() => state.setRoutineLog(date, r.id, done ? "" : YES)}
                  >
                    {done ? "সম্পন্ন" : "চিহ্নিত"}
                  </button>
                  {manage ? (
                    <>
                      <button type="button" className="btn-icon" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => setEditor(r)} aria-label="সম্পাদনা">
                        <Pencil size={13} />
                      </button>
                      <button type="button" className="btn-icon danger" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => removeRow(r)} aria-label="মুছুন">
                        <Trash2 size={13} />
                      </button>
                    </>
                  ) : null}
                </div>
              );
            })
        )}
      </SectionCard>

      <ChartCard icon={Clock} title="সাপ্তাহিক রুটিন সম্পন্নতা (%)" height={220}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(52,211,153,0.06)" }} />
            <Bar dataKey="শতাংশ" fill={CHART.green} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {manage ? (
        <SectionCard icon={Settings2} title="টেমপ্লেট ব্যবস্থাপনা" subtitle="এখানে বদলালে প্রতিদিনের তালিকায় প্রযোজ্য হবে।" flush>
          {state.routine.map((r) => (
            <div key={r.id} className="list-row">
              <div className="list-row-main">
                <div className="list-row-title">{r.activity}</div>
                <div className="list-row-sub">
                  {r.startTime || "—"} – {r.endTime || "—"} · {r.category || "অন্যান্য"}
                </div>
              </div>
              <button type="button" className="btn-icon" onClick={() => setEditor(r)} aria-label="সম্পাদনা">
                <Pencil size={14} />
              </button>
              <button type="button" className="btn-icon danger" onClick={() => removeRow(r)} aria-label="মুছুন">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div style={{ padding: 14 }}>
            <button type="button" className="btn btn-ghost" style={{ width: "100%" }} onClick={addRow}>
              <Plus size={15} /> নতুন কাজ যোগ
            </button>
          </div>
        </SectionCard>
      ) : null}

      <div className="row tiny muted" style={{ justifyContent: "center", gap: 6, marginTop: 6 }}>
        <Info size={13} />
        <span>Smart Madaripur-এর কাজ কখনোই ঘুম, স্বাস্থ্য বা পড়াশোনার আগে অগ্রাধিকার পাবে না।</span>
      </div>

      <Sheet open={Boolean(editor)} title={editor && editor.id ? "কাজ সম্পাদনা" : "নতুন রুটিন কাজ"} onClose={() => setEditor(null)} wide>
        {editor ? <RoutineForm initial={editor} onSave={saveRow} onCancel={() => setEditor(null)} /> : null}
      </Sheet>
    </div>
  );
}

function IconPercent(props) {
  return <CheckCircle2 {...props} />;
}