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
import { HeartPulse, Plus, Pencil, Trash2, CalendarDays, Timer, Gauge, Moon, Droplets, Brain, ShieldAlert, Info, Activity } from "lucide-react";
import {
  PageHeader,
  SectionCard,
  KpiCard,
  Badge,
  ChartCard,
  EmptyState,
  Sheet,
  EventRow,
  StatusBanner,
} from "../components/Ui";
import { HealthForm } from "../components/forms";
import { useStore } from "../store/useStore";
import { daySummary, fmtNum } from "../lib/calc";
import { todayISO, lastNDates, addDays, formatDateShort, formatDateFull, weekdayBangla } from "../lib/dateUtils";
import { CHART, tooltipStyle, axisTick, chartMargin } from "../lib/chart";

export default function HealthPage() {
  const state = useStore();
  const today = todayISO();
  const [editor, setEditor] = useState(null);
  const last14 = useMemo(() => lastNDates(14), []);
  const headaches = useMemo(() => state.health.filter((h) => h.kind !== "অন্যান্য"), [state.health]);

  const in7 = headaches.filter((h) => h.date >= addDays(today, -6));
  const in30 = headaches.filter((h) => h.date >= addDays(today, -29));
  const days30 = new Set(in30.map((h) => h.date)).size;
  const avgSeverity = in30.length ? in30.reduce((a, h) => a + (Number(h.severity) || 0), 0) / in30.length : null;
  const durations = in30.map((h) => Number(h.durationMin)).filter((v) => v > 0);
  const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null;
  const stresses = in30.map((h) => Number(h.stress)).filter((v) => v > 0);
  const avgStress = stresses.length ? stresses.reduce((a, b) => a + b, 0) / stresses.length : null;

  const chartData = useMemo(
    () =>
      last14.map((d) => {
        const rows = state.health.filter((h) => h.date === d && h.kind !== "অন্যান্য");
        const maxSev = rows.length ? Math.max(...rows.map((r) => Number(r.severity) || 0)) : null;
        return { date: formatDateShort(d), তীব্রতা: maxSev };
      }),
    [state.health, last14]
  );

  const comparison = useMemo(() => {
    const headDates = new Set(in30.map((h) => h.date));
    const rows = lastNDates(30).map((d) => ({ d, s: daySummary(state, d), head: headDates.has(d) }));
    const withData = rows.filter((r) => r.s.sleepHrs !== null || r.s.waterGlasses !== null || r.s.stress !== null);
    const head = withData.filter((r) => r.head);
    const other = withData.filter((r) => !r.head);
    const avg = (list, get) => {
      const vals = list.map(get).filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v)));
      return vals.length ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : null;
    };
    return {
      sleepHead: avg(head, (r) => r.s.sleepHrs),
      sleepOther: avg(other, (r) => r.s.sleepHrs),
      waterHead: avg(head, (r) => r.s.waterGlasses),
      waterOther: avg(other, (r) => r.s.waterGlasses),
      stressHead: avg(head, (r) => r.s.stress),
      stressOther: avg(other, (r) => r.s.stress),
    };
  }, [state, in30]);

  const entries = useMemo(
    () => state.health.slice().sort((a, b) => (a.date === b.date ? (a.startTime || "") < (b.startTime || "") ? 1 : -1 : a.date < b.date ? 1 : -1)),
    [state.health]
  );

  function save(values) {
    if (editor && editor.id) state.updateItem("health", editor.id, values);
    else state.addItem("health", values);
    setEditor(null);
  }

  function remove(id) {
    if (window.confirm("এই স্বাস্থ্য রেকর্ড মুছে ফেলবেন?")) state.removeItem("health", id);
  }

  return (
    <div>
      <PageHeader
        icon={HeartPulse}
        title="স্বাস্থ্য জার্নাল"
        subtitle="মাথাব্যথা ও অন্যান্য শারীরিক সমস্যা নিজের পর্যবেক্ষণের জন্য লিখে রাখুন।"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditor({ date: today, kind: "মাথাব্যথা" })}>
            <Plus size={16} /> রেকর্ড যোগ
          </button>
        }
      />

      <div style={{ marginBottom: 14 }}>
        <StatusBanner>
          <ShieldAlert size={18} />
          <span>
            এই জার্নাল শুধু ব্যক্তিগত পর্যবেক্ষণের জন্য। এটি কোনো রোগ নির্ণয় বা চিকিৎসার পরামর্শ দেয় না — শারীরিক সমস্যা
            গুরুতর হলে চিকিৎসকের পরামর্শ নিন।
          </span>
        </StatusBanner>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard icon={CalendarDays} label="৭ দিনে মাথাব্যথা" value={in7.length} unit="বার" tone={CHART.rose} />
        <KpiCard icon={CalendarDays} label="৩০ দিনে দিন" value={days30} unit="দিন" tone={CHART.amber} />
        <KpiCard icon={Gauge} label="গড় তীব্রতা" value={fmtNum(avgSeverity, 1, "—")} unit="/১০" tone={CHART.violet} />
        <KpiCard icon={Timer} label="গড় স্থায়িত্ব" value={fmtNum(avgDuration, 0, "—")} unit="মিনিট" tone={CHART.cyan} />
        <KpiCard icon={Brain} label="গড় স্ট্রেস" value={fmtNum(avgStress, 1, "—")} unit="/৫" tone={CHART.blue} />
      </div>

      <ChartCard icon={HeartPulse} title="মাথাব্যথার তীব্রতা (শেষ ১৪ দিন)" height={230}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
            <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(251,113,133,0.08)" }} />
            <Bar dataKey="তীব্রতা" fill={CHART.rose} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <SectionCard icon={Activity} title="নিজের পর্যবেক্ষণ" subtitle="মাথাব্যথার দিন ও অন্য দিনের তুলনা (শেষ ৩০ দিন)">
        {days30 === 0 ? (
          <EmptyState icon={Activity} title="তুলনার তথ্য নেই" hint="কয়েকটি রেকর্ড যোগ করলে ঘুম, পানি ও স্ট্রেসের সঙ্গে তুলনা দেখা যাবে।" />
        ) : (
          <div className="stack">
            <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
              <span className="row small" style={{ gap: 6 }}>
                <Moon size={14} color={CHART.violet} /> গড় ঘুম
              </span>
              <span className="small numeric">
                {fmtNum(comparison.sleepHead, 1, "—")} / {fmtNum(comparison.sleepOther, 1, "—")} ঘণ্টা
              </span>
            </div>
            <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
              <span className="row small" style={{ gap: 6 }}>
                <Droplets size={14} color={CHART.cyan} /> গড় পানি
              </span>
              <span className="small numeric">
                {fmtNum(comparison.waterHead, 1, "—")} / {fmtNum(comparison.waterOther, 1, "—")} গ্লাস
              </span>
            </div>
            <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
              <span className="row small" style={{ gap: 6 }}>
                <Brain size={14} color={CHART.blue} /> গড় স্ট্রেস
              </span>
              <span className="small numeric">
                {fmtNum(comparison.stressHead, 1, "—")} / {fmtNum(comparison.stressOther, 1, "—")} /৫
              </span>
            </div>
            <div className="tiny muted" style={{ lineHeight: 1.6 }}>
              বাঁ দিকের সংখ্যা মাথাব্যথার দিনের, ডান দিকের সংখ্যা অন্য দিনের। এটি কেবল সম্পর্কের ইঙ্গিত — কারণ নিশ্চিত করে না।
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={HeartPulse}
        title="জার্নাল এন্ট্রি"
        subtitle={`${state.health.length}টি রেকর্ড`}
        right={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditor({ date: today, kind: "মাথাব্যথা" })}>
            <Plus size={14} /> যোগ
          </button>
        }
        flush
      >
        {entries.length === 0 ? (
          <EmptyState icon={HeartPulse} title="কোনো রেকর্ড নেই" hint="মাথাব্যথা বা শারীরিক সমস্যা লিখে রাখুন।" />
        ) : (
          entries.map((h) => (
            <EventRow
              key={h.id}
              icon={HeartPulse}
              tone={h.kind === "অন্যান্য" ? CHART.blue : CHART.rose}
              title={h.kind === "অন্যান্য" ? "শারীরিক সমস্যা / নোট" : `মাথাব্যথা${h.severity ? ` · তীব্রতা ${h.severity}/১০` : ""}`}
              subtitle={`${formatDateFull(h.date)} · ${weekdayBangla(h.date)}বার${
                h.startTime ? ` · ${h.startTime}` : ""
              }${h.durationMin ? ` · ${h.durationMin} মিনিট` : ""}${h.location ? ` · ${h.location}` : ""}${
                h.trigger ? ` · ${h.trigger}` : ""
              }`}
              right={
                h.stress ? <Badge tone="info">স্ট্রেস {h.stress}/৫</Badge> : h.eyeDiscomfort === "হ্যাঁ" ? <Badge tone="warn">চোখে অস্বস্তি</Badge> : null
              }
              actions={
                <>
                  <button type="button" className="btn-icon" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => setEditor(h)} aria-label="সম্পাদনা">
                    <Pencil size={13} />
                  </button>
                  <button type="button" className="btn-icon danger" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => remove(h.id)} aria-label="মুছুন">
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
        <span>পানি ও ঘুমের তথ্য আলাদা মডিউল থেকে স্বয়ংক্রিয়ভাবে মিলিয়ে দেখানো হচ্ছে।</span>
      </div>

      <Sheet open={Boolean(editor)} title={editor && editor.id ? "স্বাস্থ্য রেকর্ড সম্পাদনা" : "স্বাস্থ্য রেকর্ড যোগ"} onClose={() => setEditor(null)} wide>
        {editor ? <HealthForm initial={editor} onSave={save} onCancel={() => setEditor(null)} /> : null}
      </Sheet>
    </div>
  );
}