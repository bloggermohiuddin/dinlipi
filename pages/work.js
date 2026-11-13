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
import { Briefcase, Plus, Pencil, Trash2, Timer, AlertTriangle, Target, Scale, Layers, Info, CalendarDays } from "lucide-react";
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
  StatusBanner,
} from "../components/Ui";
import { WorkForm } from "../components/forms";
import { useStore } from "../store/useStore";
import { itemsOn, sumMinutes, sumMinutesInRange, eventsInRange, eventMinutes, fmtDuration, minutesByKey } from "../lib/calc";
import { todayISO, lastNDates, addDays, formatDateShort, weekdayBangla } from "../lib/dateUtils";
import { CHART, tooltipStyle, axisTick, chartMargin } from "../lib/chart";

export default function WorkPage() {
  const state = useStore();
  const today = todayISO();
  const [editor, setEditor] = useState(null);
  const last14 = useMemo(() => lastNDates(14), []);

  const todayMin = sumMinutes(itemsOn(state.work, today));
  const weekMin = sumMinutesInRange(state.work, addDays(today, -6), today);
  const monthMin = sumMinutesInRange(state.work, addDays(today, -29), today);
  const weekStudyMin = sumMinutesInRange(state.study, addDays(today, -6), today);
  const limit = state.settings.workLimitMin;
  const overLimit = limit > 0 && todayMin > limit;

  const chartData = useMemo(
    () =>
      last14.map((d) => ({
        date: formatDateShort(d),
        কাজ: Math.round(sumMinutes(itemsOn(state.work, d))),
        পড়াশোনা: Math.round(sumMinutes(itemsOn(state.study, d))),
      })),
    [state.work, state.study, last14]
  );

  const categories = useMemo(() => minutesByKey(eventsInRange(state.work, addDays(today, -29), today), (e) => e.category || "অন্যান্য"), [state.work, today]);
  const maxCat = Math.max(1, ...Object.values(categories));
  const entries = useMemo(
    () => state.work.slice().sort((a, b) => (a.date === b.date ? (a.startTime || "") < (b.startTime || "") ? 1 : -1 : a.date < b.date ? 1 : -1)),
    [state.work]
  );

  function save(values) {
    if (editor && editor.id) state.updateItem("work", editor.id, values);
    else state.addItem("work", values);
    setEditor(null);
  }

  function remove(id) {
    if (window.confirm("এই কাজের এন্ট্রি মুছে ফেলবেন?")) state.removeItem("work", id);
  }

  return (
    <div>
      <PageHeader
        icon={Briefcase}
        title="Smart Madaripur কাজ"
        subtitle="কাজে কত সময় যাচ্ছে তা দেখুন — যেন পড়াশোনা, ঘুম ও স্বাস্থ্যের সময় নষ্ট না হয়।"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditor({ date: today })}>
            <Plus size={16} /> কাজ যোগ
          </button>
        }
      />

      {overLimit ? (
        <div style={{ marginBottom: 14 }}>
          <StatusBanner tone="warn">
            <AlertTriangle size={18} />
            <span>
              আজকের কাজ {Math.round(todayMin)} মিনিট — নির্ধারিত সীমা {limit} মিনিট ছাড়িয়ে গেছে। পড়াশোনা ও বিশ্রামের সময়
              নিশ্চিত করুন।
            </span>
          </StatusBanner>
        </div>
      ) : null}

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard icon={Timer} label="আজকের কাজ" value={Math.round(todayMin)} unit="মিনিট" tone={CHART.blue} hint={`সীমা ${limit} মিনিট`} />
        <KpiCard icon={Briefcase} label="গত ৭ দিন" value={fmtDuration(weekMin)} tone={CHART.amber} />
        <KpiCard icon={Layers} label="গত ৩০ দিন" value={fmtDuration(monthMin)} tone={CHART.violet} />
        <KpiCard icon={Scale} label="পড়াশোনা বনাম কাজ (৭ দিন)" value={`${Math.round(weekStudyMin)} : ${Math.round(weekMin)}`} unit="মিনিট" tone={CHART.green} />
        <KpiCard icon={Target} label="সীমার মধ্যে" value={overLimit ? "না" : todayMin > 0 ? "হ্যাঁ" : "—"} tone={overLimit ? CHART.rose : CHART.green} />
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <ProgressMeta
          label="আজকের কাজের সীমা"
          value={limit ? todayMin / limit : 0}
          tone={overLimit ? "danger" : ""}
          right={`${Math.round(todayMin)} / ${limit} মিনিট`}
        />
        <div className="tiny muted" style={{ marginTop: 6 }}>
          সীমা অতিক্রম করলে সতর্কতা দেখানো হয় — এটি নিষেধ নয়, শুধু নিজের পর্যবেক্ষণ।
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard icon={Briefcase} title="কাজ বনাম পড়াশোনা (শেষ ১৪ দিন)" height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(96,165,250,0.08)" }} />
              <Bar dataKey="কাজ" fill={CHART.blue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="পড়াশোনা" fill={CHART.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={Target} title="আজকের সীমা" height={240}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ name: "আজ", মিনিট: Math.round(todayMin) }]} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(96,165,250,0.08)" }} />
              <ReferenceLine y={limit} stroke={CHART.rose} strokeDasharray="4 4" />
              <Bar dataKey="মিনিট" fill={overLimit ? CHART.rose : CHART.blue} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <SectionCard icon={Layers} title="কাজের ধরন (শেষ ৩০ দিন)" subtitle="কোন ধরনের কাজে সময় যাচ্ছে">
        {Object.keys(categories).length === 0 ? (
          <EmptyState icon={Layers} title="তথ্য নেই" hint="কাজ যোগ করলে ধরন অনুযায়ী বিভাজন দেখা যাবে।" />
        ) : (
          <div className="stack">
            {Object.entries(categories)
              .sort((a, b) => b[1] - a[1])
              .map(([name, min]) => (
                <div key={name}>
                  <div className="progress-meta">
                    <span className="small">{name}</span>
                    <span className="tiny numeric muted">{Math.round(min)} মিনিট</span>
                  </div>
                  <div className="progress">
                    <span style={{ width: `${Math.round((min / maxCat) * 100)}%` }} />
                  </div>
                </div>
              ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={CalendarDays}
        title="কাজের এন্ট্রি"
        subtitle={`${state.work.length}টি এন্ট্রি`}
        right={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditor({ date: today })}>
            <Plus size={14} /> যোগ
          </button>
        }
        flush
      >
        {entries.length === 0 ? (
          <EmptyState icon={Briefcase} title="কোনো কাজের এন্ট্রি নেই" hint="কাজের নাম ও সময় দিয়ে শুরু করুন।" />
        ) : (
          entries.map((e) => (
            <EventRow
              key={e.id}
              icon={Briefcase}
              tone={CHART.blue}
              title={`${e.title || "কাজ"} · ${eventMinutes(e)} মিনিট`}
              subtitle={`${formatDateShort(e.date)} · ${weekdayBangla(e.date)}বার${e.category ? ` · ${e.category}` : ""}${
                e.startTime || e.endTime ? ` · ${e.startTime || "—"}–${e.endTime || "—"}` : ""
              }`}
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
        <span>কাজের সেশনও একই দিনে একাধিকবার যোগ করা যাবে — প্রতিটি আলাদা হিসাবে থাকবে।</span>
      </div>

      <Sheet open={Boolean(editor)} title={editor && editor.id ? "কাজ সম্পাদনা" : "কাজ যোগ করুন"} onClose={() => setEditor(null)} wide>
        {editor ? <WorkForm initial={editor} onSave={save} onCancel={() => setEditor(null)} /> : null}
      </Sheet>
    </div>
  );
}