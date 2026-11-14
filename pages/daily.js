import { useMemo, useState } from "react";
import {
  CalendarDays,
  Moon,
  Utensils,
  Droplets,
  BookOpen,
  Briefcase,
  Dumbbell,
  HeartPulse,
  Scale,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Info,
} from "lucide-react";
import {
  PageHeader,
  SectionCard,
  KpiCard,
  Badge,
  EventRow,
  EmptyState,
  DayNav,
  Sheet,
} from "../components/Ui";
import {
  SleepForm,
  MealForm,
  WaterForm,
  StudyForm,
  WorkForm,
  ExerciseForm,
  HealthForm,
  WeightForm,
} from "../components/forms";
import { useStore } from "../store/useStore";
import { daySummary, dayEvents, eventMinutes, fmtNum, sleepHoursOf } from "../lib/calc";
import { todayISO, lastNDates, formatDateShort, relativeDayLabel, weekdayBangla } from "../lib/dateUtils";

const META = {
  sleep: { label: "ঘুম", icon: Moon, tone: "#a78bfa", Form: SleepForm },
  meals: { label: "খাবার", icon: Utensils, tone: "#fbbf24", Form: MealForm },
  water: { label: "পানি", icon: Droplets, tone: "#22d3ee", Form: WaterForm },
  study: { label: "পড়াশোনা", icon: BookOpen, tone: "#34d399", Form: StudyForm },
  work: { label: "কাজ", icon: Briefcase, tone: "#60a5fa", Form: WorkForm },
  exercise: { label: "ব্যায়াম", icon: Dumbbell, tone: "#fb7185", Form: ExerciseForm },
  health: { label: "স্বাস্থ্য", icon: HeartPulse, tone: "#f472b6", Form: HealthForm },
  weights: { label: "ওজন", icon: Scale, tone: "#34d399", Form: WeightForm },
};

const ADD_ORDER = ["sleep", "meals", "water", "study", "work", "exercise", "health", "weights"];

function eventSubtitle(e) {
  if (e.collection === "sleep") {
    const h = sleepHoursOf(e.item);
    return `${e.time || "—"} · ${h === null ? "সময় অসম্পূর্ণ" : `${h.toFixed(1)} ঘণ্টা`}`;
  }
  if (e.collection === "meals") return [e.item.time, e.item.name].filter(Boolean).join(" · ");
  if (e.collection === "water") return `${e.item.glasses} গ্লাস${e.item.time ? ` · ${e.item.time}` : ""}`;
  if (e.collection === "study") return `${eventMinutes(e.item)} মিনিট${e.item.status ? ` · ${e.item.status}` : ""}`;
  if (e.collection === "work") return `${eventMinutes(e.item)} মিনিট${e.item.category ? ` · ${e.item.category}` : ""}`;
  if (e.collection === "exercise") return `${eventMinutes(e.item)} মিনিট`;
  if (e.collection === "health")
    return [
      e.item.severity ? `তীব্রতা ${e.item.severity}/১০` : "",
      e.item.durationMin ? `${e.item.durationMin} মিনিট` : "",
      e.item.trigger || "",
    ]
      .filter(Boolean)
      .join(" · ");
  if (e.collection === "weights") return `${e.item.weight} কেজি${e.item.time ? ` · ${e.item.time}` : ""}`;
  return "";
}

export default function DailyPage() {
  const state = useStore();
  const [date, setDate] = useState(todayISO());
  const [editor, setEditor] = useState(null);
  const dates = useMemo(() => lastNDates(30), []);
  const summary = useMemo(() => daySummary(state, date), [state, date]);
  const events = useMemo(() => dayEvents(state, date), [state, date]);

  const grouped = useMemo(() => {
    const out = {};
    ADD_ORDER.forEach((k) => {
      out[k] = [];
    });
    events.forEach((e) => {
      if (out[e.collection]) out[e.collection].push(e.item);
    });
    return out;
  }, [events]);

  function openEditor(collection, item) {
    setEditor({ collection, item: item || { date } });
  }

  function save(values) {
    if (!editor) return;
    if (editor.item && editor.item.id) state.updateItem(editor.collection, editor.item.id, values);
    else state.addItem(editor.collection, { ...values, date: values.date || date });
    setEditor(null);
  }

  function remove(collection, id) {
    if (window.confirm("এই এন্ট্রিটি মুছে ফেলতে চান? এটি ফেরানো যাবে না।")) {
      state.removeItem(collection, id);
    }
  }

  const Meta = editor ? META[editor.collection] : null;
  const Form = Meta ? Meta.Form : null;

  return (
    <div>
      <PageHeader
        icon={CalendarDays}
        title="দৈনিক লগ"
        subtitle="দিন বেছে নিন, যা করেছেন তা যোগ করুন — একই দিনে একাধিক এন্ট্রি করা যাবে।"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => state.openQuickAdd("menu")}>
            <Plus size={16} /> নতুন এন্ট্রি
          </button>
        }
      />

      <SectionCard icon={CalendarDays} title="তারিখ" subtitle="৩০ দিনের স্ট্রিপ থেকে বেছে নিন বা তারিখ লিখুন।">
        <DayNav date={date} onChange={setDate} dates={dates} hasData={(d) => dayEvents(state, d).length > 0} />
      </SectionCard>

      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div className="row row-wrap" style={{ justifyContent: "space-between", gap: 8 }}>
          <div>
            <div style={{ fontSize: "1.02rem", fontWeight: 800 }}>{relativeDayLabel(date)}</div>
            <div className="tiny muted" style={{ marginTop: 2 }}>
              {formatDateShort(date)} · {weekdayBangla(date)}বার
            </div>
          </div>
          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
            <Badge tone={events.length ? "good" : "mute"}>{events.length}টি এন্ট্রি</Badge>
          </div>
        </div>

        <div className="kpi-grid" style={{ marginTop: 14 }}>
          <KpiCard icon={Moon} label="ঘুম" value={fmtNum(summary.sleepHrs, 1, "—")} unit="ঘণ্টা" tone="#a78bfa" />
          <KpiCard icon={Utensils} label="প্রধান খাবার" value={summary.meals.length ? `${summary.mainMealCount}/৩` : "—"} tone="#fbbf24" />
          <KpiCard icon={Droplets} label="পানি" value={summary.waterGlasses ?? "—"} unit="গ্লাস" tone="#22d3ee" />
          <KpiCard icon={BookOpen} label="পড়াশোনা" value={Math.round(summary.studyMin)} unit="মিনিট" tone="#34d399" />
          <KpiCard icon={Briefcase} label="কাজ" value={Math.round(summary.workMin)} unit="মিনিট" tone="#60a5fa" />
          <KpiCard icon={Dumbbell} label="ব্যায়াম" value={Math.round(summary.exerciseMin)} unit="মিনিট" tone="#fb7185" />
          <KpiCard icon={Scale} label="ওজন" value={summary.weight === null ? "—" : summary.weight.toFixed(1)} unit="কেজি" tone="#34d399" />
          <KpiCard
            icon={HeartPulse}
            label="মাথাব্যথা"
            value={summary.headacheCount ? "হ্যাঁ" : summary.healthEntries.length ? "না" : "—"}
            tone="#f472b6"
          />
        </div>
      </div>

      <SectionCard icon={Plus} title="এই দিনে যোগ করুন" subtitle="প্রতিটি এন্ট্রি আলাদা — একই ধরনের একাধিক এন্ট্রি চলবে।">
        <div className="quick-grid">
          {ADD_ORDER.map((key) => {
            const m = META[key];
            const Icon = m.icon;
            return (
              <button
                key={key}
                type="button"
                className="quick-btn"
                style={{ "--quick-tone": m.tone }}
                onClick={() => openEditor(key)}
              >
                <Icon size={21} strokeWidth={1.9} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
          icon={Clock}
          title="দিনের সময়রেখা"
          subtitle={events.length ? `${events.length}টি এন্ট্রি` : "কোনো এন্ট্রি নেই"}
        >
          {events.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="এই দিনের কোনো এন্ট্রি নেই"
              hint="উপরের বাটন থেকে ঘুম, খাবার বা পড়ার সেশন যোগ করুন।"
            />
          ) : (
            <div className="timeline">
              {events.map((e) => {
                const m = META[e.collection];
                const Icon = m.icon;
                return (
                  <div key={`${e.collection}-${e.id}`} className="timeline-item">
                    <span className="timeline-time">{e.time || "—"}</span>
                    <span className="event-icon" style={{ "--tone": m.tone, width: 32, height: 32, borderRadius: 10 }}>
                      <Icon size={15} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="small strong">{e.title}</div>
                      <div className="tiny muted" style={{ marginTop: 2 }}>
                        {eventSubtitle(e)}
                      </div>
                    </div>
                    <div className="row" style={{ gap: 4, flex: "0 0 auto" }}>
                      <button type="button" className="btn-icon" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => openEditor(e.collection, e.item)} aria-label="সম্পাদনা">
                        <Pencil size={13} />
                      </button>
                      <button type="button" className="btn-icon danger" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => remove(e.collection, e.id)} aria-label="মুছুন">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

      {ADD_ORDER.filter((k) => grouped[k].length).map((key) => {
        const m = META[key];
        return (
          <SectionCard
            key={key}
            icon={m.icon}
            title={m.label}
            subtitle={`${grouped[key].length}টি এন্ট্রি`}
            right={
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEditor(key)}>
                <Plus size={14} /> যোগ
              </button>
            }
            flush
          >
            {grouped[key].map((item) => {
              const e = events.find((x) => x.id === item.id && x.collection === key);
              return (
                <EventRow
                  key={item.id}
                  icon={m.icon}
                  tone={m.tone}
                  title={e ? e.title : m.label}
                  subtitle={e ? eventSubtitle(e) : ""}
                  actions={
                    <>
                      <button type="button" className="btn-icon" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => openEditor(key, item)} aria-label="সম্পাদনা">
                        <Pencil size={13} />
                      </button>
                      <button type="button" className="btn-icon danger" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => remove(key, item.id)} aria-label="মুছুন">
                        <Trash2 size={13} />
                      </button>
                    </>
                  }
                />
              );
            })}
          </SectionCard>
        );
      })}

      <div className="row tiny muted" style={{ justifyContent: "center", gap: 6, marginTop: 6 }}>
        <Info size={13} />
        <span>একই দিনে একাধিক ঘুম, খাবার বা পড়ার সেশন আলাদা এন্ট্রি হিসেবে থাকবে।</span>
      </div>

      <Sheet
        open={Boolean(editor)}
        title={editor && editor.item && editor.item.id ? `${Meta ? Meta.label : ""} সম্পাদনা` : `${Meta ? Meta.label : ""} যোগ করুন`}
        subtitle={`${formatDateShort(date)} · ${weekdayBangla(date)}বার`}
        onClose={() => setEditor(null)}
        wide
      >
        {Form ? (
          <Form
            initial={{ date, ...(editor.item || {}) }}
            onSave={save}
            onCancel={() => setEditor(null)}
            subjects={state.subjects}
            chapters={state.chapters}
          />
        ) : null}
      </Sheet>
    </div>
  );
}