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
  Utensils,
  Droplets,
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Apple,
  Leaf,
  Drumstick,
  Info,
} from "lucide-react";
import {
  PageHeader,
  SectionCard,
  KpiCard,
  Badge,
  ChartCard,
  EmptyState,
  Sheet,
  EventRow,
  Tabs,
  DayNav,
  StatusBanner,
  ProgressMeta,
} from "../components/Ui";
import { MealForm, WaterForm } from "../components/forms";
import { useStore } from "../store/useStore";
import { daySummary, itemsOn, fmtNum } from "../lib/calc";
import { todayISO, lastNDates, formatDateShort, formatDateFull, weekdayBangla } from "../lib/dateUtils";
import { CHART, tooltipStyle, axisTick, chartMargin } from "../lib/chart";
import { MEAL_TYPES } from "../lib/defaultData";

const MEAL_META = {
  "সকালের নাশতা": { icon: Coffee, tone: CHART.amber },
  "দুপুরের খাবার": { icon: Sun, tone: CHART.green },
  "রাতের খাবার": { icon: Moon, tone: CHART.violet },
  নাশতা: { icon: Cookie, tone: CHART.cyan },
};

export default function NutritionPage() {
  const state = useStore();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [tab, setTab] = useState("meals");
  const [editor, setEditor] = useState(null);
  const dates = useMemo(() => lastNDates(30), []);
  const last14 = useMemo(() => lastNDates(14), []);
  const summary = useMemo(() => daySummary(state, date), [state, date]);

  const meals = useMemo(
    () => itemsOn(state.meals, date).slice().sort((a, b) => (a.time || "") < (b.time || "") ? -1 : 1),
    [state.meals, date]
  );
  const water = useMemo(() => itemsOn(state.water, date).slice().sort((a, b) => (a.time || "") < (b.time || "") ? -1 : 1), [state.water, date]);

  const chartData = useMemo(
    () =>
      last14.map((d) => {
        const s = daySummary(state, d);
        return {
          date: formatDateShort(d),
          খাবার: s.meals.length ? s.mainMealCount : null,
          পানি: s.waterGlasses,
        };
      }),
    [state, last14]
  );

  const last7 = useMemo(() => {
    const rows = lastNDates(7).map((d) => daySummary(state, d));
    const mealDays = rows.filter((r) => r.meals.length > 0).length;
    const waterDays = rows.filter((r) => r.waterGlasses !== null && r.waterGlasses > 0).length;
    const avgWater = rows.filter((r) => r.waterGlasses !== null);
    return {
      mealDays,
      waterDays,
      avgWater: avgWater.length ? avgWater.reduce((a, r) => a + r.waterGlasses, 0) / avgWater.length : null,
    };
  }, [state]);

  function save(values) {
    const collection = editor.collection;
    if (editor.item && editor.item.id) state.updateItem(collection, editor.item.id, values);
    else state.addItem(collection, values);
    setEditor(null);
  }

  function remove(collection, id) {
    if (window.confirm("এই এন্ট্রিটি মুছে ফেলবেন?")) state.removeItem(collection, id);
  }

  function quickWater() {
    state.addItem("water", { date, time: "", glasses: 1, note: "" });
  }

  const proteinCount = meals.filter((m) => m.protein === "হ্যাঁ").length;
  const fruitCount = meals.filter((m) => m.fruit === "হ্যাঁ").length;
  const vegCount = meals.filter((m) => m.veg === "হ্যাঁ").length;

  return (
    <div>
      <PageHeader
        icon={Utensils}
        title="খাবার ও পানি"
        subtitle="প্রতিটি খাবার আলাদা এন্ট্রি — নাশতা, দুপুর, রাত ও মাঝের নাশতা সবই হিসাবে আসবে।"
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setEditor({ collection: "water", item: { date } })}>
              <Droplets size={16} /> পানি
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setEditor({ collection: "meals", item: { date } })}>
              <Plus size={16} /> খাবার
            </button>
          </>
        }
      />

      <SectionCard icon={CalendarDays} title="তারিখ" subtitle="দিন বদলে সেই দিনের খাবার ও পানি দেখুন।">
        <DayNav date={date} onChange={setDate} dates={dates} hasData={(d) => daySummary(state, d).meals.length > 0 || daySummary(state, d).waterGlasses !== null} />
      </SectionCard>

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard icon={Utensils} label="প্রধান খাবার" value={summary.meals.length ? `${summary.mainMealCount}/৩` : "—"} tone={CHART.amber} />
        <KpiCard icon={Droplets} label="পানি" value={summary.waterGlasses ?? "—"} unit="গ্লাস" tone={CHART.cyan} hint={`লক্ষ্য ${state.settings.waterTarget} গ্লাস`} />
        <KpiCard icon={Drumstick} label="প্রোটিন" value={proteinCount} unit="বার" tone={CHART.rose} />
        <KpiCard icon={Apple} label="ফল" value={fruitCount} unit="বার" tone={CHART.violet} />
        <KpiCard icon={Leaf} label="সবজি" value={vegCount} unit="বার" tone={CHART.green} />
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <span className="small strong">দিনের সারাংশ · {formatDateFull(date)}</span>
          <span className="tiny muted">{weekdayBangla(date)}বার</span>
        </div>
        <ProgressMeta
          label="প্রধান খাবার"
          value={summary.meals.length ? summary.mainMealCount / 3 : 0}
          right={summary.meals.length ? `${summary.mainMealCount}/৩` : "তথ্য নেই"}
        />
        <div style={{ height: 8 }} />
        <ProgressMeta
          label="পানি"
          value={(summary.waterGlasses || 0) / state.settings.waterTarget}
          right={`${summary.waterGlasses ?? 0} / ${state.settings.waterTarget} গ্লাস`}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "meals", label: `খাবার (${meals.length})` },
            { value: "water", label: `পানি (${water.length})` },
            { value: "stats", label: "পরিসংখ্যান" },
          ]}
        />
      </div>

      {tab === "meals" ? (
        <SectionCard
          icon={Utensils}
          title="খাবারের এন্ট্রি"
          subtitle={`${meals.length}টি এন্ট্রি · ${formatDateShort(date)}`}
          right={
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditor({ collection: "meals", item: { date } })}>
              <Plus size={14} /> যোগ
            </button>
          }
          flush
        >
          {meals.length === 0 ? (
            <EmptyState icon={Utensils} title="এই দিনে খাবারের এন্ট্রি নেই" hint="নাশতা, দুপুর বা রাতের খাবার যোগ করুন।" />
          ) : (
            meals.map((m) => {
              const meta = MEAL_META[m.type] || { icon: Utensils, tone: CHART.amber };
              const tags = [m.fruit === "হ্যাঁ" ? "ফল" : "", m.veg === "হ্যাঁ" ? "সবজি" : "", m.protein === "হ্যাঁ" ? "প্রোটিন" : ""].filter(Boolean);
              return (
                <EventRow
                  key={m.id}
                  icon={meta.icon}
                  tone={meta.tone}
                  title={`${m.type}${m.time ? ` · ${m.time}` : ""}`}
                  subtitle={`${m.name || "বিবরণ নেই"}${tags.length ? ` · ${tags.join(", ")}` : ""}`}
                  actions={
                    <>
                      <button type="button" className="btn-icon" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => setEditor({ collection: "meals", item: m })} aria-label="সম্পাদনা">
                        <Pencil size={13} />
                      </button>
                      <button type="button" className="btn-icon danger" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => remove("meals", m.id)} aria-label="মুছুন">
                        <Trash2 size={13} />
                      </button>
                    </>
                  }
                />
              );
            })
          )}
        </SectionCard>
      ) : null}

      {tab === "water" ? (
        <SectionCard
          icon={Droplets}
          title="পানি পানের এন্ট্রি"
          subtitle={`${summary.waterGlasses ?? 0} গ্লাস · লক্ষ্য ${state.settings.waterTarget} গ্লাস`}
          right={
            <div className="row" style={{ gap: 4 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={quickWater}>
                <Plus size={14} /> ১ গ্লাস
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditor({ collection: "water", item: { date } })}>
                বিস্তারিত
              </button>
            </div>
          }
          flush
        >
          {water.length === 0 ? (
            <EmptyState icon={Droplets} title="এই দিনে পানি রেকর্ড নেই" hint="'১ গ্লাস' চাপলে দ্রুত এন্ট্রি হয়ে যাবে।" />
          ) : (
            water.map((w) => (
              <EventRow
                key={w.id}
                icon={Droplets}
                tone={CHART.cyan}
                title={`${w.glasses} গ্লাস`}
                subtitle={[w.time, w.note].filter(Boolean).join(" · ") || "সময় দেওয়া নেই"}
                actions={
                  <>
                    <button type="button" className="btn-icon" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => setEditor({ collection: "water", item: w })} aria-label="সম্পাদনা">
                      <Pencil size={13} />
                    </button>
                    <button type="button" className="btn-icon danger" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => remove("water", w.id)} aria-label="মুছুন">
                      <Trash2 size={13} />
                    </button>
                  </>
                }
              />
            ))
          )}
        </SectionCard>
      ) : null}

      {tab === "stats" ? (
        <>
          <div className="kpi-grid" style={{ marginBottom: 14 }}>
            <KpiCard icon={Utensils} label="৭ দিনে খাবারের দিন" value={last7.mealDays} unit="দিন" tone={CHART.amber} />
            <KpiCard icon={Droplets} label="৭ দিনে পানির দিন" value={last7.waterDays} unit="দিন" tone={CHART.cyan} />
            <KpiCard icon={Droplets} label="৭ দিনের গড় পানি" value={fmtNum(last7.avgWater, 1, "—")} unit="গ্লাস" tone={CHART.blue} />
          </div>

          <div className="grid-2" style={{ marginBottom: 14 }}>
            <ChartCard icon={Utensils} title="প্রধান খাবার (শেষ ১৪ দিন)" height={220}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={axisTick} tickLine={false} axisLine={false} domain={[0, 3]} ticks={[0, 1, 2, 3]} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(251,191,36,0.08)" }} />
                  <Bar dataKey="খাবার" fill={CHART.amber} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard icon={Droplets} title="পানি (শেষ ১৪ দিন)" height={220}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                  <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART.grid }} />
                  <ReferenceLine y={state.settings.waterTarget} stroke={CHART.cyan} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="পানি" stroke={CHART.cyan} strokeWidth={2.2} dot={{ r: 2.5 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      ) : null}

      <div className="row tiny muted" style={{ justifyContent: "center", gap: 6, marginTop: 6 }}>
        <Info size={13} />
        <span>খাবারের ক্যালরি বা পুষ্টিমান অনুমান করা হয় না — শুধু আপনি যা লিখেছেন তা দেখানো হয়।</span>
      </div>

      <Sheet
        open={Boolean(editor)}
        title={editor && editor.item && editor.item.id ? "এন্ট্রি সম্পাদনা" : editor && editor.collection === "water" ? "পানি যোগ করুন" : "খাবার যোগ করুন"}
        subtitle={`${formatDateShort(date)} · ${weekdayBangla(date)}বার`}
        onClose={() => setEditor(null)}
        wide
      >
        {editor && editor.collection === "meals" ? (
          <MealForm initial={{ date, ...editor.item }} onSave={save} onCancel={() => setEditor(null)} />
        ) : null}
        {editor && editor.collection === "water" ? (
          <WaterForm initial={{ date, ...editor.item }} onSave={save} onCancel={() => setEditor(null)} />
        ) : null}
      </Sheet>
    </div>
  );
}