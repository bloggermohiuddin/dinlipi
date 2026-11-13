import { useMemo, useState } from "react";
import { Target, Plus, Pencil, Trash2, Flag, CalendarDays, TrendingUp, Info, CheckCircle2, Sparkles } from "lucide-react";
import {
  PageHeader,
  SectionCard,
  KpiCard,
  Badge,
  EmptyState,
  Sheet,
  Field,
  TextInput,
  NumberInput,
  DateInput,
  Select,
  TextArea,
  Progress,
  StatusBanner,
} from "../components/Ui";
import { useStore } from "../store/useStore";
import { goalProgress, fmtNum } from "../lib/calc";
import { todayISO, addDays, formatDateShort, daysBetween } from "../lib/dateUtils";
import { CHART } from "../lib/chart";

const TYPES = [
  { value: "study", label: "পড়াশোনা (মিনিট/দিন)" },
  { value: "sleep", label: "ঘুম (ঘণ্টা/দিন)" },
  { value: "exercise", label: "ব্যায়াম (মিনিট/দিন)" },
  { value: "water", label: "পানি (গ্লাস/দিন)" },
  { value: "habit", label: "অভ্যাস (%)" },
  { value: "work_limit", label: "কাজের সীমা (মিনিট/দিন)" },
  { value: "weight", label: "ওজন (কেজি)" },
  { value: "custom", label: "নিজের লক্ষ্য" },
];

const PRESETS = [
  { title: "গড়ে ৭.৫ ঘণ্টা ঘুম", type: "sleep", target: "7.5" },
  { title: "দিনে ১৫০ মিনিট পড়াশোনা", type: "study", target: "150" },
  { title: "দিনে ৩০ মিনিট ব্যায়াম", type: "exercise", target: "30" },
  { title: "দিনে ৮ গ্লাস পানি", type: "water", target: "8" },
  { title: "কাজ দিনে ২ ঘণ্টার মধ্যে", type: "work_limit", target: "120" },
  { title: "অভ্যাস ৮০% পূরণ", type: "habit", target: "80" },
];

function GoalForm({ initial, onSave, onCancel }) {
  const [v, setV] = useState({
    title: "",
    type: "study",
    target: "",
    startDate: todayISO(),
    endDate: addDays(todayISO(), 29),
    current: "",
    unit: "",
    note: "",
    ...initial,
  });
  const [error, setError] = useState("");
  const set = (k) => (e) => setV((p) => ({ ...p, [k]: e.target ? e.target.value : e }));

  function submit() {
    if (!v.title.trim()) return setError("লক্ষ্যের নাম দিন।");
    if (v.target === "" || Number(v.target) <= 0) return setError("লক্ষ্যের মান দিন।");
    if (v.startDate && v.endDate && v.endDate < v.startDate) return setError("শেষ তারিখ শুরুর আগে হতে পারে না।");
    return onSave({
      ...v,
      title: v.title.trim(),
      target: Number(v.target),
      current: v.current === "" ? "" : Number(v.current),
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="form-grid">
        <Field label="লক্ষ্যের নাম">
          <TextInput value={v.title} onChange={set("title")} placeholder="যেমন: এই মাসে প্রতিদিন পড়া" />
        </Field>
        <Field label="ধরন">
          <Select
            value={v.type}
            onChange={(e) => setV((p) => ({ ...p, type: e.target.value }))}
            options={TYPES}
            placeholder="বেছে নিন"
          />
        </Field>
        <Field label="লক্ষ্যের মান" hint={v.type === "custom" ? "যেমন ১০টি বই, ৫০০০ ধাপ" : "সংখ্যাটি হিসাব হবে আপনার এন্ট্রি থেকে"}>
          <NumberInput value={v.target} step="0.1" min="0" onChange={set("target")} />
        </Field>
        {v.type === "custom" ? (
          <>
            <Field label="বর্তমান মান">
              <NumberInput value={v.current} step="0.1" min="0" onChange={set("current")} />
            </Field>
            <Field label="একক">
              <TextInput value={v.unit} onChange={set("unit")} placeholder="যেমন: বই, ধাপ" />
            </Field>
          </>
        ) : null}
        <Field label="শুরু">
          <DateInput value={v.startDate} onChange={set("startDate")} />
        </Field>
        <Field label="শেষ">
          <DateInput value={v.endDate} onChange={set("endDate")} />
        </Field>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="নোট">
          <TextArea value={v.note} onChange={set("note")} placeholder="কেন এই লক্ষ্য, কীভাবে মাপবেন" />
        </Field>
      </div>
      {error ? (
        <div className="tiny" style={{ color: "var(--danger)", fontWeight: 600, marginTop: 8 }}>
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

export default function GoalsPage() {
  const state = useStore();
  const [editor, setEditor] = useState(null);
  const today = todayISO();

  const goals = useMemo(
    () =>
      state.goals.map((g) => ({
        goal: g,
        progress: goalProgress(g, state),
        daysLeft: g.endDate ? daysBetween(today, g.endDate) : null,
      })),
    [state, today]
  );

  const completed = goals.filter((g) => g.progress && g.progress.pct !== null && g.progress.pct >= 1);
  const active = goals.filter((g) => !(g.progress && g.progress.pct !== null && g.progress.pct >= 1));

  function save(values) {
    if (editor && editor.id) state.updateItem("goals", editor.id, values);
    else state.addItem("goals", values);
    setEditor(null);
  }

  function remove(goal) {
    if (!window.confirm(`"${goal.title}" লক্ষ্যটি মুছে ফেলবেন?`)) return;
    state.removeItem("goals", goal.id);
  }

  function updateCustom(goal, value) {
    state.setItemField("goals", goal.id, "current", value === "" ? "" : Number(value));
  }

  return (
    <div>
      <PageHeader
        icon={Target}
        title="লক্ষ্য"
        subtitle="নিজের লক্ষ্য ঠিক করুন — অগ্রগতি আপনার এন্ট্রি থেকেই স্বয়ংক্রিয়ভাবে হিসাব হবে।"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditor({})}>
            <Plus size={16} /> নতুন লক্ষ্য
          </button>
        }
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard icon={Target} label="মোট লক্ষ্য" value={goals.length} unit="টি" tone={CHART.cyan} />
        <KpiCard icon={Flag} label="চলমান" value={active.length} unit="টি" tone={CHART.amber} />
        <KpiCard icon={CheckCircle2} label="পূরণ হয়েছে" value={completed.length} unit="টি" tone={CHART.green} />
        <KpiCard
          icon={TrendingUp}
          label="গড় অগ্রগতি"
          value={
            goals.filter((g) => g.progress && g.progress.pct !== null).length
              ? `${Math.round(
                  (goals.filter((g) => g.progress && g.progress.pct !== null).reduce((a, g) => a + g.progress.pct, 0) /
                    goals.filter((g) => g.progress && g.progress.pct !== null).length) *
                    100
                )}%`
              : "—"
          }
          tone={CHART.violet}
        />
      </div>

      {goals.length === 0 ? (
        <>
          <StatusBanner>
            <Sparkles size={18} />
            <span>নিচের প্রস্তাব থেকে এক ট্যাপে লক্ষ্য যোগ করতে পারেন — পরে যেকোনো সময় বদলানো যাবে।</span>
          </StatusBanner>
          <SectionCard icon={Sparkles} title="দ্রুত লক্ষ্য" subtitle="প্রস্তাবিত লক্ষ্যগুলো থেকে বেছে নিন">
            <div className="stack tight">
              {PRESETS.map((p) => (
                <div key={p.title} className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="small strong">{p.title}</div>
                    <div className="tiny muted">{TYPES.find((t) => t.value === p.type).label}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      state.addItem("goals", {
                        title: p.title,
                        type: p.type,
                        target: Number(p.target),
                        startDate: today,
                        endDate: addDays(today, 29),
                        current: "",
                        unit: "",
                        note: "",
                      })
                    }
                  >
                    <Plus size={13} /> যোগ
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      ) : null}

      {goals.map(({ goal, progress, daysLeft }) => (
        <SectionCard
          key={goal.id}
          icon={progress && progress.pct >= 1 ? CheckCircle2 : Target}
          title={goal.title}
          subtitle={`${TYPES.find((t) => t.value === goal.type)?.label || "লক্ষ্য"}${
            goal.startDate || goal.endDate ? ` · ${goal.startDate ? formatDateShort(goal.startDate) : "—"} – ${goal.endDate ? formatDateShort(goal.endDate) : "—"}` : ""
          }`}
          right={
            <div className="row" style={{ gap: 4 }}>
              <Badge tone={progress && progress.pct >= 1 ? "good" : progress && progress.pct >= 0.6 ? "info" : "warn"}>
                {progress && progress.pct !== null ? `${Math.round(progress.pct * 100)}%` : "তথ্য নেই"}
              </Badge>
              <button
                type="button"
                className="btn-icon"
                style={{ width: 30, height: 30, minHeight: 30 }}
                onClick={() => setEditor(goal)}
                aria-label="সম্পাদনা"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                className="btn-icon danger"
                style={{ width: 30, height: 30, minHeight: 30 }}
                onClick={() => remove(goal)}
                aria-label="মুছুন"
              >
                <Trash2 size={13} />
              </button>
            </div>
          }
        >
          <Progress value={progress && progress.pct !== null ? progress.pct : 0} tone={progress && progress.pct >= 1 ? "" : "warn"} />

          <div className="row" style={{ justifyContent: "space-between", marginTop: 8, gap: 8 }}>
            <span className="tiny muted">
              বর্তমান: {progress && progress.current !== null ? `${fmtNum(progress.current, 1, "—")} ${progress.unit}` : "তথ্য নেই"}
            </span>
            <span className="tiny muted">
              লক্ষ্য: {fmtNum(goal.target, 1, "—")} {progress ? progress.unit : ""}
            </span>
          </div>

          <div className="row row-wrap" style={{ justifyContent: "space-between", gap: 8, marginTop: 8 }}>
            <span className="tiny muted">
              {daysLeft === null ? "" : daysLeft < 0 ? "সময় শেষ" : daysLeft === 0 ? "আজ শেষ দিন" : `আর ${daysLeft} দিন`}
            </span>
            {goal.type === "custom" ? (
              <div className="row" style={{ gap: 6 }}>
                <span className="tiny muted">এখনকার মান</span>
                <div style={{ width: 100 }}>
                  <NumberInput
                    value={goal.current === "" ? "" : goal.current}
                    step="0.1"
                    min="0"
                    onChange={(e) => updateCustom(goal, e.target.value)}
                    style={{ padding: "5px 8px", fontSize: "0.76rem" }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {goal.note ? (
            <div className="tiny muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
              {goal.note}
            </div>
          ) : null}
        </SectionCard>
      ))}

      {state.goals.length > 0 ? (
        <SectionCard icon={Plus} title="নতুন লক্ষ্য যোগ" subtitle="সময়সীমা দিলে কত দিন বাকি তা দেখানো হবে">
          <button type="button" className="btn btn-primary" onClick={() => setEditor({})}>
            <Plus size={15} /> লক্ষ্য তৈরি করুন
          </button>
        </SectionCard>
      ) : null}

      <div className="row tiny muted" style={{ justifyContent: "center", gap: 6, marginTop: 6 }}>
        <Info size={13} />
        <span>ওজন, ঘুম, পড়াশোনা, কাজ, পানি ও অভ্যাসের লক্ষ্য আপনার এন্ট্রি থেকে হিসাব হয় — কোনো অনুমান নয়।</span>
      </div>

      <Sheet
        open={Boolean(editor)}
        title={editor && editor.id ? "লক্ষ্য সম্পাদনা" : "নতুন লক্ষ্য"}
        subtitle="যে ধরনের লক্ষ্য চান বেছে নিন, বাকিটা অ্যাপ হিসাব করবে।"
        onClose={() => setEditor(null)}
        wide
      >
        {editor ? <GoalForm initial={editor} onSave={save} onCancel={() => setEditor(null)} /> : null}
      </Sheet>
    </div>
  );
}