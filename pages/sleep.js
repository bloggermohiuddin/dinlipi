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
import { Moon, Plus, Pencil, Trash2, Clock, Award, BedDouble, TrendingUp, Sunrise, Info } from "lucide-react";
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
import { SleepForm } from "../components/forms";
import { useStore } from "../store/useStore";
import { sleepSummary, sleepHoursOf, itemsOn, fmtNum, sumMinutesInRange } from "../lib/calc";
import { todayISO, lastNDates, addDays, formatDateShort, formatDateFull, weekdayBangla } from "../lib/dateUtils";
import { CHART, tooltipStyle, axisTick, chartMargin } from "../lib/chart";

export default function SleepPage() {
  const state = useStore();
  const [editor, setEditor] = useState(null);
  const today = todayISO();
  const last30 = useMemo(() => lastNDates(30), []);
  const last14 = useMemo(() => lastNDates(14), []);

  const todayEntries = itemsOn(state.sleep, today).filter((e) => sleepHoursOf(e) !== null);
  const todayHours = todayEntries.reduce((a, e) => a + sleepHoursOf(e), 0);

  const week = useMemo(() => sleepSummary(state.sleep, addDays(today, -6), today), [state.sleep, today]);
  const month = useMemo(() => sleepSummary(state.sleep, addDays(today, -29), today), [state.sleep, today]);

  const chartData = useMemo(
    () =>
      last14.map((d) => {
        const entries = itemsOn(state.sleep, d).filter((e) => sleepHoursOf(e) !== null);
        const hours = entries.reduce((a, e) => a + sleepHoursOf(e), 0);
        const quality = entries.map((e) => Number(e.quality)).filter((v) => v > 0);
        return {
          date: formatDateShort(d),
          ঘুম: entries.length ? Number(hours.toFixed(1)) : null,
          মান: quality.length ? Number((quality.reduce((a, b) => a + b, 0) / quality.length).toFixed(1)) : null,
        };
      }),
    [state.sleep, last14]
  );

  const heat = useMemo(
    () =>
      last30.map((d) => {
        const entries = itemsOn(state.sleep, d).filter((e) => sleepHoursOf(e) !== null);
        const hours = entries.reduce((a, e) => a + sleepHoursOf(e), 0);
        return { date: d, hours: entries.length ? hours : null };
      }),
    [state.sleep, last30]
  );

  const entries = useMemo(
    () =>
      state.sleep
        .slice()
        .sort((a, b) => (a.date === b.date ? (a.bedtime || "") < (b.bedtime || "") ? 1 : -1 : a.date < b.date ? 1 : -1)),
    [state.sleep]
  );

  const lateNights = useMemo(
    () =>
      state.sleep.filter((e) => {
        if (e.date < addDays(today, -13)) return false;
        if (!e.bedtime) return false;
        return e.bedtime >= "23:30" || e.bedtime <= "03:00";
      }),
    [state.sleep, today]
  );

  function save(values) {
    if (editor && editor.id) state.updateItem("sleep", editor.id, values);
    else state.addItem("sleep", values);
    setEditor(null);
  }

  function remove(id) {
    if (window.confirm("এই ঘুমের এন্ট্রি মুছে ফেলবেন?")) state.removeItem("sleep", id);
  }

  function heatClass(hours) {
    if (hours === null) return "";
    const ratio = hours / state.settings.sleepTargetHrs;
    if (ratio < 0.5) return "l1";
    if (ratio < 0.85) return "l2";
    if (ratio < 1) return "l3";
    return "l4";
  }

  return (
    <div>
      <PageHeader
        icon={Moon}
        title="ঘুম"
        subtitle="প্রতিটি ঘুম আলাদা এন্ট্রি — রাতের ঘুম, ভাতঘুম বা ভাঙা ঘুম সব হিসাবে আসবে।"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditor({ date: today })}>
            <Plus size={16} /> ঘুম যোগ
          </button>
        }
      />

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div className="row row-wrap" style={{ justifyContent: "space-between", gap: 10 }}>
          <div>
            <div className="tiny muted">আজকের মোট ঘুম · {formatDateFull(today)}</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: 2 }}>
              {todayEntries.length ? `${todayHours.toFixed(1)} ঘণ্টা` : "—"}
            </div>
            <div className="tiny muted" style={{ marginTop: 2 }}>
              {todayEntries.length}টি এন্ট্রি · লক্ষ্য {state.settings.sleepTargetHrs} ঘণ্টা
            </div>
          </div>
          <Badge tone={todayHours >= state.settings.sleepTargetHrs ? "good" : todayHours > 0 ? "warn" : "mute"}>
            {todayHours > 0 ? `${Math.round((todayHours / state.settings.sleepTargetHrs) * 100)}% পূরণ` : "তথ্য নেই"}
          </Badge>
        </div>
        <div style={{ marginTop: 12 }}>
          <ProgressMeta
            label="আজকের লক্ষ্য"
            value={todayHours / state.settings.sleepTargetHrs}
            right={`${todayHours.toFixed(1)} / ${state.settings.sleepTargetHrs} ঘণ্টা`}
          />
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard icon={Moon} label="গত ৭ দিনের গড়" value={fmtNum(week.avgHrs, 1, "—")} unit="ঘণ্টা" tone={CHART.violet} hint={`${week.nights} রাত`} />
        <KpiCard icon={BedDouble} label="গত ৩০ দিনের গড়" value={fmtNum(month.avgHrs, 1, "—")} unit="ঘণ্টা" tone={CHART.cyan} hint={`${month.nights} রাত`} />
        <KpiCard
          icon={Award}
          label="নিয়মিত ঘুমের স্কোর"
          value={month.consistency === null ? "—" : `${Math.round(month.consistency * 100)}%`}
          tone={CHART.green}
          hint="ঘুমানোর সময় কতটা স্থির"
        />
        <KpiCard icon={TrendingUp} label="গড় ঘুমের মান" value={fmtNum(month.avgQuality, 1, "—")} unit="/৫" tone={CHART.amber} />
        <KpiCard icon={Sunrise} label="দেরিতে ঘুম (১৪ দিন)" value={lateNights.length} unit="বার" tone={CHART.rose} />
      </div>

      {month.nights === 0 ? (
        <div style={{ marginBottom: 14 }}>
          <StatusBanner>
            <Info size={18} />
            <span>এখনো ঘুমের কোনো এন্ট্রি নেই। ঘুমানোর ও ওঠার সময় দিলে মোট ঘুম স্বয়ংক্রিয়ভাবে হিসাব হবে।</span>
          </StatusBanner>
        </div>
      ) : null}

      <div className="grid-2" style={{ marginBottom: 14 }}>
        <ChartCard icon={Moon} title="দৈনিক ঘুম (শেষ ১৪ দিন)" height={230}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(167,139,250,0.08)" }} />
              <ReferenceLine y={state.settings.sleepTargetHrs} stroke={CHART.violet} strokeDasharray="4 4" />
              <Bar dataKey="ঘুম" fill={CHART.violet} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard icon={Award} title="ঘুমের মান (শেষ ১৪ দিন)" height={230}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={[0, 5]} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid }} />
              <Line type="monotone" dataKey="মান" stroke={CHART.amber} strokeWidth={2.2} dot={{ r: 2.5 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <SectionCard icon={Clock} title="শেষ ৩০ দিনের ঘুম" subtitle="গাঢ় রং মানে লক্ষ্যের কাছাকাছি ঘুম">
        <div className="heat-grid">
          {heat.map((h) => (
            <div
              key={h.date}
              className={`heat-cell ${heatClass(h.hours)}`}
              title={`${formatDateFull(h.date)} · ${h.hours === null ? "তথ্য নেই" : `${h.hours.toFixed(1)} ঘণ্টা`}`}
            />
          ))}
        </div>
        <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
          <span className="tiny muted">{formatDateShort(last30[0])}</span>
          <span className="tiny muted">{formatDateShort(today)}</span>
        </div>
      </SectionCard>

      <SectionCard
        icon={Moon}
        title="ঘুমের এন্ট্রি"
        subtitle={`মোট ${state.sleep.length}টি এন্ট্রি`}
        right={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditor({ date: today })}>
            <Plus size={14} /> যোগ
          </button>
        }
        flush
      >
        {entries.length === 0 ? (
          <EmptyState icon={Moon} title="এখনো ঘুমের এন্ট্রি নেই" hint="ঘুমানোর ও ওঠার সময় লিখে প্রথম এন্ট্রি যোগ করুন।" />
        ) : (
          entries.map((e) => {
            const h = sleepHoursOf(e);
            return (
              <EventRow
                key={e.id}
                icon={Moon}
                tone={CHART.violet}
                title={`${e.bedtime || "—"} – ${e.waketime || "—"}`}
                subtitle={`${formatDateShort(e.date)} · ${weekdayBangla(e.date)}বার · ${h === null ? "সময় অসম্পূর্ণ" : `${h.toFixed(1)} ঘণ্টা`}${
                  e.quality ? ` · মান ${e.quality}/৫` : ""
                }`}
                right={h !== null ? <Badge tone={h >= state.settings.sleepTargetHrs ? "good" : "warn"}>{h.toFixed(1)} ঘণ্টা</Badge> : null}
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
            );
          })
        )}
      </SectionCard>

      <Sheet
        open={Boolean(editor)}
        title={editor && editor.id ? "ঘুম সম্পাদনা" : "ঘুম যোগ করুন"}
        subtitle="একই দিনে একাধিকবার ঘুমালে প্রতিটি আলাদা করে যোগ করুন।"
        onClose={() => setEditor(null)}
        wide
      >
        {editor ? <SleepForm initial={editor} onSave={save} onCancel={() => setEditor(null)} /> : null}
      </Sheet>

      <div className="row tiny muted" style={{ justifyContent: "center", gap: 6, marginTop: 6 }}>
        <Info size={13} />
        <span>রাত ১টায় ঘুমিয়ে সকাল ৮টায় উঠলে ৭ ঘণ্টা হিসাব হবে — রাত পেরোলেও হিসাব ঠিক থাকে।</span>
      </div>
    </div>
  );
}