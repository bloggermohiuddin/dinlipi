import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Scale, Plus, Pencil, Trash2, TrendingDown, TrendingUp, Target, CalendarDays, Info, Minus } from "lucide-react";
import {
  PageHeader,
  SectionCard,
  KpiCard,
  Badge,
  ChartCard,
  EmptyState,
  Sheet,
  EventRow,
  Field,
  NumberInput,
  StatusBanner,
  ProgressMeta,
} from "../components/Ui";
import { WeightForm } from "../components/forms";
import { useStore } from "../store/useStore";
import { weightSeries, weightRangeChange, latestWeight, fmtNum } from "../lib/calc";
import { todayISO, lastNDates, addDays, formatDateShort, formatDateFull, weekdayBangla } from "../lib/dateUtils";
import { CHART, tooltipStyle, axisTick, chartMargin } from "../lib/chart";

export default function WeightPage() {
  const state = useStore();
  const latest = latestWeight(state.weights);
  const today = todayISO();
  const [editor, setEditor] = useState(null);
  const [goalDraft, setGoalDraft] = useState(state.profile.targetWeight);

  const series = useMemo(() => weightSeries(state.weights), [state.weights]);
  const chartData = useMemo(
    () => series.slice(-60).map((w) => ({ date: formatDateShort(w.date), ওজন: Number(w.weight) })),
    [series]
  );

  const first = series.length ? { date: series[0].date, weight: Number(series[0].weight) } : null;
  const startWeight = state.profile.startWeight === "" ? first : { date: null, weight: Number(state.profile.startWeight) };
  const totalChange = latest && startWeight ? latest.weight - startWeight.weight : null;
  const target = state.profile.targetWeight === "" ? null : Number(state.profile.targetWeight);

  const week = weightRangeChange(state.weights, addDays(today, -6), today);
  const prevWeek = weightRangeChange(state.weights, addDays(today, -13), addDays(today, -7));
  const month = weightRangeChange(state.weights, addDays(today, -29), today);

  const goalsPct =
    latest && startWeight && target && startWeight.weight !== target
      ? Math.max(0, Math.min(1, (startWeight.weight - latest.weight) / (startWeight.weight - target)))
      : null;

  function save(values) {
    if (editor && editor.id) state.updateItem("weights", editor.id, values);
    else state.addItem("weights", values);
    setEditor(null);
  }

  function remove(id) {
    if (window.confirm("এই ওজনের রেকর্ড মুছে ফেলবেন?")) state.removeItem("weights", id);
  }

  function saveGoal() {
    state.updateProfile({ targetWeight: goalDraft });
  }

  function changeBadge(change) {
    if (change === null || change === undefined) return { tone: "mute", text: "তথ্য নেই", Icon: Minus };
    if (change < 0) return { tone: "good", text: `${change.toFixed(1)} কেজি`, Icon: TrendingDown };
    if (change > 0) return { tone: "warn", text: `+${change.toFixed(1)} কেজি`, Icon: TrendingUp };
    return { tone: "mute", text: "অপরিবর্তিত", Icon: Minus };
  }

  const weekBadge = changeBadge(week ? week.change : null);
  const monthBadge = changeBadge(month ? month.change : null);

  return (
    <div>
      <PageHeader
        icon={Scale}
        title="ওজন"
        subtitle="যখন খুশি ওজন যোগ করুন — প্রতিদিন দিতে হবে না, আর কোনো কাল্পনিক তথ্য দেখানো হয় না।"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditor({ date: today })}>
            <Plus size={16} /> ওজন যোগ
          </button>
        }
      />

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div className="row row-wrap" style={{ justifyContent: "space-between", gap: 10 }}>
          <div>
            <div className="tiny muted">সর্বশেষ ওজন</div>
            <div style={{ fontSize: "1.9rem", fontWeight: 800, lineHeight: 1.15 }}>
              {latest ? latest.weight.toFixed(1) : "—"}
              <span className="kpi-unit" style={{ fontSize: "0.8rem" }}>কেজি</span>
            </div>
            <div className="tiny muted" style={{ marginTop: 2 }}>
              {latest ? `${formatDateFull(latest.date)} · ${weekdayBangla(latest.date)}বার` : "এখনো কোনো রেকর্ড নেই"}
            </div>
          </div>
          <div style={{ minWidth: 160, flex: "0 1 220px" }}>
            <Field label="লক্ষ্য ওজন (কেজি)">
              <div className="row" style={{ gap: 6 }}>
                <NumberInput value={goalDraft} step="0.1" min="0" onChange={(e) => setGoalDraft(e.target.value)} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={saveGoal} disabled={goalDraft === state.profile.targetWeight}>
                  সেভ
                </button>
              </div>
            </Field>
          </div>
        </div>

        {goalsPct !== null ? (
          <div style={{ marginTop: 12 }}>
            <ProgressMeta
              label="লক্ষ্যের দিকে অগ্রগতি"
              value={goalsPct}
              right={`${Math.round(goalsPct * 100)}% · ${target} কেজি`}
              hint={`শুরু ${startWeight.weight.toFixed(1)} কেজি`}
            />
          </div>
        ) : null}
      </div>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard icon={Scale} label="বর্তমান ওজন" value={latest ? latest.weight.toFixed(1) : "—"} unit="কেজি" tone={CHART.green} />
        <KpiCard
          icon={totalChange !== null && totalChange < 0 ? TrendingDown : TrendingUp}
          label="শুরু থেকে পরিবর্তন"
          value={totalChange === null ? "—" : `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(1)}`}
          unit="কেজি"
          tone={totalChange !== null && totalChange < 0 ? CHART.cyan : CHART.amber}
        />
        <KpiCard icon={weekBadge.Icon} label="৭ দিনের পরিবর্তন" value={weekBadge.text} tone={CHART.violet} hint={week ? `${week.samples}টি মাপ` : "তুলনার তথ্য নেই"} />
        <KpiCard icon={monthBadge.Icon} label="৩০ দিনের পরিবর্তন" value={monthBadge.text} tone={CHART.blue} hint={month ? `${month.samples}টি মাপ` : "তুলনার তথ্য নেই"} />
        <KpiCard icon={Target} label="লক্ষ্য ওজন" value={target === null ? "—" : target.toFixed(1)} unit="কেজি" tone={CHART.amber} />
      </div>

      {series.length === 0 ? (
        <StatusBanner>
          <Info size={18} />
          <span>এখনো ওজনের কোনো রেকর্ড নেই। যোগ করলে এখানে প্রবণতা ও তুলনা দেখা যাবে।</span>
        </StatusBanner>
      ) : null}

      <ChartCard icon={Scale} title="ওজনের প্রবণতা (কেজি)" height={260}>
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
              <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid }} />
              {target !== null ? <ReferenceLine y={target} stroke={CHART.amber} strokeDasharray="5 5" /> : null}
              <Line type="monotone" dataKey="ওজন" stroke={CHART.green} strokeWidth={2.4} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={Scale} title="ওজনের তথ্য নেই" hint="প্রথম ওজন যোগ করুন।" />
        )}
      </ChartCard>

      <SectionCard icon={CalendarDays} title="তুলনা" subtitle="বাস্তব মাপের ভিত্তিতে">
        <div className="stack tight">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="small muted">গত ৭ দিন</span>
            <span className="small strong">{week ? `${week.first.date === week.last.date ? `${week.last.weight} কেজি` : `${week.first.weight} → ${week.last.weight} কেজি`}` : "তথ্য নেই"}</span>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="small muted">আগের ৭ দিন</span>
            <span className="small strong">{prevWeek ? `${prevWeek.first.weight} → ${prevWeek.last.weight} কেজি` : "তথ্য নেই"}</span>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="small muted">গত ৩০ দিন</span>
            <span className="small strong">{month ? `${month.first.weight} → ${month.last.weight} কেজি` : "তথ্য নেই"}</span>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="small muted">প্রথম রেকর্ড</span>
            <span className="small strong">{first ? `${first.weight} কেজি · ${formatDateShort(first.date)}` : "তথ্য নেই"}</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Scale}
        title="ওজনের ইতিহাস"
        subtitle={`মোট ${series.length}টি রেকর্ড`}
        right={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditor({ date: today })}>
            <Plus size={14} /> যোগ
          </button>
        }
        flush
      >
        {series.length === 0 ? (
          <EmptyState icon={Scale} title="কোনো রেকর্ড নেই" hint="'ওজন যোগ' বাটন থেকে শুরু করুন।" />
        ) : (
          series
            .slice()
            .reverse()
            .map((w) => (
              <EventRow
                key={w.id}
                icon={Scale}
                tone={CHART.green}
                title={`${Number(w.weight).toFixed(1)} কেজি`}
                subtitle={`${formatDateFull(w.date)} · ${weekdayBangla(w.date)}বার${w.time ? ` · ${w.time}` : ""}${w.note ? ` · ${w.note}` : ""}`}
                right={
                  target !== null ? (
                    <Badge tone={Number(w.weight) <= target ? "good" : "mute"}>
                      {Number(w.weight) === target ? "লক্ষ্যে" : Number(w.weight) > target ? `+${(Number(w.weight) - target).toFixed(1)}` : "লক্ষ্যের নিচে"}
                    </Badge>
                  ) : null
                }
                actions={
                  <>
                    <button type="button" className="btn-icon" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => setEditor(w)} aria-label="সম্পাদনা">
                      <Pencil size={13} />
                    </button>
                    <button type="button" className="btn-icon danger" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => remove(w.id)} aria-label="মুছুন">
                      <Trash2 size={13} />
                    </button>
                  </>
                }
              />
            ))
        )}
      </SectionCard>

      <Sheet
        open={Boolean(editor)}
        title={editor && editor.id ? "ওজন সম্পাদনা" : "ওজন যোগ করুন"}
        onClose={() => setEditor(null)}
        wide
      >
        {editor ? <WeightForm initial={editor} onSave={save} onCancel={() => setEditor(null)} /> : null}
      </Sheet>
    </div>
  );
}