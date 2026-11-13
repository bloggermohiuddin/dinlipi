import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Dumbbell, Plus, Pencil, Trash2, Flame, Timer, CalendarDays, Target, Activity, Info } from "lucide-react";
import {
  PageHeader,
  SectionCard,
  KpiCard,
  Badge,
  ChartCard,
  EmptyState,
  Sheet,
  EventRow,
  ProgressMeta,
} from "../components/Ui";
import { ExerciseForm } from "../components/forms";
import { useStore } from "../store/useStore";
import { itemsOn, sumMinutes, sumMinutesInRange, eventsInRange, eventMinutes, activeDayStreak, fmtDuration, minutesByKey } from "../lib/calc";
import { todayISO, lastNDates, addDays, formatDateShort, weekdayBangla } from "../lib/dateUtils";
import { CHART, tooltipStyle, axisTick, chartMargin } from "../lib/chart";

export default function ExercisePage() {
  const state = useStore();
  const today = todayISO();
  const [editor, setEditor] = useState(null);
  const last14 = useMemo(() => lastNDates(14), []);

  const todayMin = sumMinutes(itemsOn(state.exercise, today));
  const weekMin = sumMinutesInRange(state.exercise, addDays(today, -6), today);
  const streak = activeDayStreak(state.exercise);
  const days14 = last14.filter((d) => itemsOn(state.exercise, d).length > 0).length;

  const chartData = useMemo(
    () =>
      last14.map((d) => ({
        date: formatDateShort(d),
        মিনিট: Math.round(sumMinutes(itemsOn(state.exercise, d))),
      })),
    [state.exercise, last14]
  );

  const types = useMemo(() => minutesByKey(eventsInRange(state.exercise, addDays(today, -29), today), (e) => e.type || "অন্যান্য"), [state.exercise, today]);
  const maxType = Math.max(1, ...Object.values(types));

  const entries = useMemo(
    () => state.exercise.slice().sort((a, b) => (a.date === b.date ? (a.startTime || "") < (b.startTime || "") ? 1 : -1 : a.date < b.date ? 1 : -1)),
    [state.exercise]
  );

  function save(values) {
    if (editor && editor.id) state.updateItem("exercise", editor.id, values);
    else state.addItem("exercise", values);
    setEditor(null);
  }

  function remove(id) {
    if (window.confirm("এই ব্যায়ামের এন্ট্রি মুছে ফেলবেন?")) state.removeItem("exercise", id);
  }

  return (
    <div>
      <PageHeader
        icon={Dumbbell}
        title="ব্যায়াম"
        subtitle="হাঁটা, হালকা ব্যায়াম বা স্ট্রেচিং — যা করেছেন আলাদা এন্ট্রি হিসেবে যোগ করুন।"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditor({ date: today })}>
            <Plus size={16} /> ব্যায়াম যোগ
          </button>
        }
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard icon={Timer} label="আজ" value={Math.round(todayMin)} unit="মিনিট" tone={CHART.rose} />
        <KpiCard icon={Activity} label="গত ৭ দিন" value={fmtDuration(weekMin)} tone={CHART.green} />
        <KpiCard icon={Flame} label="টানা ব্যায়াম" value={streak} unit="দিন" tone={CHART.amber} />
        <KpiCard icon={CalendarDays} label="১৪ দিনে" value={days14} unit="দিন" tone={CHART.cyan} />
        <KpiCard icon={Target} label="লক্ষ্য" value={state.settings.exerciseTargetMin} unit="মিনিট/দিন" tone={CHART.violet} />
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <ProgressMeta
          label="আজকের ব্যায়ামের লক্ষ্য"
          value={todayMin / Math.max(1, state.settings.exerciseTargetMin)}
          right={`${Math.round(todayMin)} / ${state.settings.exerciseTargetMin} মিনিট`}
        />
        <div className="tiny muted" style={{ marginTop: 6 }}>
          নিজের সামর্থ্য অনুযায়ী সেটিংস থেকে লক্ষ্য বদলানো যাবে।
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard icon={Dumbbell} title="দৈনিক ব্যায়াম (শেষ ১৪ দিন)" height={230}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(251,113,133,0.08)" }} />
              <ReferenceLine y={state.settings.exerciseTargetMin} stroke={CHART.green} strokeDasharray="4 4" />
              <Bar dataKey="মিনিট" fill={CHART.rose} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <SectionCard icon={Activity} title="ধরন অনুযায়ী (শেষ ৩০ দিন)">
          {Object.keys(types).length === 0 ? (
            <EmptyState icon={Activity} title="তথ্য নেই" hint="ব্যায়াম যোগ করলে ধরন অনুযায়ী বিভাজন দেখা যাবে।" />
          ) : (
            <div className="stack">
              {Object.entries(types)
                .sort((a, b) => b[1] - a[1])
                .map(([name, min]) => (
                  <div key={name}>
                    <div className="progress-meta">
                      <span className="small">{name}</span>
                      <span className="tiny numeric muted">{Math.round(min)} মিনিট</span>
                    </div>
                    <div className="progress">
                      <span style={{ width: `${Math.round((min / maxType) * 100)}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        icon={Dumbbell}
        title="ব্যায়ামের এন্ট্রি"
        subtitle={`${state.exercise.length}টি এন্ট্রি`}
        right={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditor({ date: today })}>
            <Plus size={14} /> যোগ
          </button>
        }
        flush
      >
        {entries.length === 0 ? (
          <EmptyState icon={Dumbbell} title="কোনো এন্ট্রি নেই" hint="আজকের হাঁটা বা ব্যায়াম যোগ করুন।" />
        ) : (
          entries.map((e) => (
            <EventRow
              key={e.id}
              icon={Dumbbell}
              tone={CHART.rose}
              title={`${e.type || "ব্যায়াম"} · ${eventMinutes(e)} মিনিট`}
              subtitle={`${formatDateShort(e.date)} · ${weekdayBangla(e.date)}বার${
                e.startTime || e.endTime ? ` · ${e.startTime || "—"}–${e.endTime || "—"}` : ""
              }${e.note ? ` · ${e.note}` : ""}`}
              right={<Badge tone={eventMinutes(e) >= state.settings.exerciseTargetMin ? "good" : "mute"}>{eventMinutes(e)} মিনিট</Badge>}
              actions={
                <>
                  <button type="button" className="btn-icon" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => setEditor(e)} aria-label="সম্পাদনা">
                    <Pencil size={13} />
                  </button>
                  <button type="button" className="btn-icon danger" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => remove(e.id)} aria-label="মুছুন">
                    <Trash2 size={13} />
                  </button>
                </>
              }
            />
          ))
        )}
      </SectionCard>

      <div className="row tiny muted" style={{ justifyContent: "center", gap: 6, marginTop: 6 }}>
        <Info size={13} />
        <span>একই দিনে সকালে হাঁটা আর বিকেলে ব্যায়াম — দুটোই আলাদা এন্ট্রি হিসেবে রাখুন।</span>
      </div>

      <Sheet open={Boolean(editor)} title={editor && editor.id ? "ব্যায়াম সম্পাদনা" : "ব্যায়াম যোগ করুন"} onClose={() => setEditor(null)} wide>
        {editor ? <ExerciseForm initial={editor} onSave={save} onCancel={() => setEditor(null)} /> : null}
      </Sheet>
    </div>
  );
}