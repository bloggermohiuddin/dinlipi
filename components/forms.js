import { useMemo, useState } from "react";
import {
  Field,
  TextInput,
  NumberInput,
  DateInput,
  TimeInput,
  TextArea,
  Select,
  YesNo,
  Rating,
  Segmented,
  Calc,
} from "./Ui";
import {
  MEAL_TYPES,
  WORK_CATEGORIES,
  EXERCISE_TYPES,
  HEADACHE_LOCATIONS,
} from "../lib/defaultData";
import { todayISO } from "../lib/dateUtils";
import { sleepDurationHrs, durationMinutes } from "../lib/calc";
import { Save, X } from "lucide-react";

export function FormButtons({ onCancel, label = "সেভ করুন", disabled }) {
  return (
    <div className="row" style={{ gap: 8, marginTop: 16 }}>
      <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={disabled}>
        <Save size={16} /> {label}
      </button>
      <button type="button" className="btn btn-ghost" onClick={onCancel}>
        <X size={16} /> বাতিল
      </button>
    </div>
  );
}

function useForm(initial) {
  const [v, setV] = useState(() => ({ ...initial }));
  const set = (key) => (valOrEvent) => {
    const value = valOrEvent && valOrEvent.target ? valOrEvent.target.value : valOrEvent;
    setV((prev) => ({ ...prev, [key]: value }));
  };
  return [v, setV, set];
}

function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <div className="tiny" style={{ color: "var(--danger)", fontWeight: 600, marginTop: 8 }}>
      {children}
    </div>
  );
}

function Shell({ onSubmit, onCancel, error, children, label }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {children}
      <ErrorNote>{error}</ErrorNote>
      <FormButtons onCancel={onCancel} label={label} />
    </form>
  );
}

// ---------- Sleep ----------
export function SleepForm({ initial, onSave, onCancel }) {
  const [v, , set] = useForm({ date: todayISO(), bedtime: "", waketime: "", quality: "", wokeOnTime: "", note: "", ...initial });
  const [error, setError] = useState("");
  const hrs = sleepDurationHrs(v.bedtime, v.waketime);

  function submit() {
    if (!v.date) return setError("তারিখ দিন।");
    if (!v.bedtime || !v.waketime) return setError("ঘুমানোর ও ওঠার সময় দুটোই দিন।");
    return onSave({ ...v, quality: v.quality === "" ? "" : Number(v.quality) });
  }

  return (
    <Shell onSubmit={submit} onCancel={onCancel} error={error} label="ঘুম সেভ করুন">
      <div className="form-grid">
        <Field label="তারিখ">
          <DateInput value={v.date} onChange={set("date")} />
        </Field>
        <Field label="ঘুমের মান (১–৫)">
          <Rating value={v.quality} onChange={set("quality")} />
        </Field>
        <Field label="ঘুমানোর সময়">
          <TimeInput value={v.bedtime} onChange={set("bedtime")} />
        </Field>
        <Field label="ওঠার সময়">
          <TimeInput value={v.waketime} onChange={set("waketime")} />
        </Field>
        <Field label="মোট ঘুম" hint="স্বয়ংক্রিয় হিসাব">
          <Calc value={hrs === null ? "" : `${hrs.toFixed(1)} ঘণ্টা`} />
        </Field>
        <Field label="সময়মতো উঠেছেন?">
          <YesNo value={v.wokeOnTime} onChange={set("wokeOnTime")} />
        </Field>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="নোট">
          <TextArea value={v.note} onChange={set("note")} placeholder="যেমন: রাতে দেরিতে ঘুম, দুপুরে ভাত ঘুম" />
        </Field>
      </div>
    </Shell>
  );
}

// ---------- Meal ----------
export function MealForm({ initial, onSave, onCancel }) {
  const [v, setV, set] = useForm({
    date: todayISO(),
    type: "",
    time: "",
    name: "",
    fruit: "",
    veg: "",
    protein: "",
    note: "",
    ...initial,
  });
  const [error, setError] = useState("");

  function submit() {
    if (!v.date) return setError("তারিখ দিন।");
    if (!v.type) return setError("খাবারের ধরন বেছে নিন।");
    return onSave({ ...v });
  }

  return (
    <Shell onSubmit={submit} onCancel={onCancel} error={error} label="খাবার সেভ করুন">
      <div className="form-grid">
        <Field label="তারিখ">
          <DateInput value={v.date} onChange={set("date")} />
        </Field>
        <Field label="খাবারের ধরন">
          <Select value={v.type} onChange={set("type")} options={MEAL_TYPES} placeholder="বেছে নিন" />
        </Field>
        <Field label="সময়">
          <TimeInput value={v.time} onChange={set("time")} />
        </Field>
        <Field label="খাবারের নাম / বিবরণ">
          <TextInput value={v.name} onChange={set("name")} placeholder="যেমন: ভাত, ডাল, মাছ" />
        </Field>
      </div>
      <div className="form-grid" style={{ marginTop: 12 }}>
        <Field label="ফল খেয়েছেন?">
          <YesNo value={v.fruit} onChange={set("fruit")} />
        </Field>
        <Field label="সবজি খেয়েছেন?">
          <YesNo value={v.veg} onChange={set("veg")} />
        </Field>
        <Field label="প্রোটিন খেয়েছেন?">
          <YesNo value={v.protein} onChange={set("protein")} />
        </Field>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="নোট">
          <TextInput value={v.note} onChange={set("note")} />
        </Field>
      </div>
    </Shell>
  );
}

// ---------- Water ----------
export function WaterForm({ initial, onSave, onCancel }) {
  const [v, , set] = useForm({ date: todayISO(), time: "", glasses: "1", note: "", ...initial });
  const [error, setError] = useState("");

  function submit() {
    if (!v.date) return setError("তারিখ দিন।");
    if (!v.glasses || Number(v.glasses) <= 0) return setError("কমপক্ষে ১ গ্লাস দিন।");
    return onSave({ ...v, glasses: Number(v.glasses) });
  }

  return (
    <Shell onSubmit={submit} onCancel={onCancel} error={error} label="পানি সেভ করুন">
      <div className="form-grid">
        <Field label="তারিখ">
          <DateInput value={v.date} onChange={set("date")} />
        </Field>
        <Field label="সময়">
          <TimeInput value={v.time} onChange={set("time")} />
        </Field>
        <Field label="কত গ্লাস">
          <NumberInput value={v.glasses} min="1" onChange={set("glasses")} />
        </Field>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="নোট">
          <TextInput value={v.note} onChange={set("note")} />
        </Field>
      </div>
    </Shell>
  );
}

// ---------- Study ----------
export function StudyForm({ initial, onSave, onCancel, subjects = [], chapters = [] }) {
  const [v, setV, set] = useForm({
    date: todayISO(),
    subjectId: "",
    chapterId: "",
    startTime: "",
    endTime: "",
    minutes: "",
    understanding: "",
    difficulty: "",
    status: "",
    note: "",
    ...initial,
  });
  const [error, setError] = useState("");
  const subjectChapters = useMemo(() => chapters.filter((c) => c.subjectId === v.subjectId), [chapters, v.subjectId]);
  const derived = durationMinutes(v.startTime, v.endTime);

  function submit() {
    if (!v.date) return setError("তারিখ দিন।");
    if (!v.subjectId) return setError("বিষয় বেছে নিন।");
    const minutes = v.minutes !== "" ? Number(v.minutes) : derived;
    if (!minutes || minutes <= 0) return setError("সময় লিখুন — ঘড়ির সময় অথবা মিনিট।");
    return onSave({
      ...v,
      minutes,
      understanding: v.understanding === "" ? "" : Number(v.understanding),
      difficulty: v.difficulty === "" ? "" : Number(v.difficulty),
    });
  }

  return (
    <Shell onSubmit={submit} onCancel={onCancel} error={error} label="সেশন সেভ করুন">
      <div className="form-grid">
        <Field label="তারিখ">
          <DateInput value={v.date} onChange={set("date")} />
        </Field>
        <Field label="বিষয়">
          <Select
            value={v.subjectId}
            onChange={(e) => {
              set("subjectId")(e);
              setV((prev) => ({ ...prev, subjectId: e.target.value, chapterId: "" }));
            }}
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="বেছে নিন"
          />
        </Field>
        <Field label="অধ্যায় (ঐচ্ছিক)">
          <Select
            value={v.chapterId}
            onChange={set("chapterId")}
            options={subjectChapters.map((c) => ({ value: c.id, label: c.name }))}
            placeholder={v.subjectId ? "অধ্যায় বেছে নিন" : "আগে বিষয় বেছে নিন"}
            disabled={!v.subjectId}
          />
        </Field>
        <Field label="অবস্থা">
          <Segmented
            value={v.status}
            onChange={set("status")}
            options={[
              { value: "সম্পন্ন", label: "সম্পন্ন" },
              { value: "আংশিক", label: "আংশিক" },
              { value: "বাকি", label: "বাকি" },
            ]}
          />
        </Field>
        <Field label="শুরুর সময়">
          <TimeInput value={v.startTime} onChange={set("startTime")} />
        </Field>
        <Field label="শেষের সময়">
          <TimeInput value={v.endTime} onChange={set("endTime")} />
        </Field>
        <Field label="মিনিট" hint={derived !== null ? `ঘড়ি অনুযায়ী ${derived} মিনিট` : "সময় দিলে স্বয়ংক্রিয় হবে"}>
          <NumberInput value={v.minutes} min="0" placeholder={derived !== null ? String(derived) : ""} onChange={set("minutes")} />
        </Field>
        <Field label="কতটা বুঝেছি (১–৫)">
          <Rating value={v.understanding} onChange={set("understanding")} />
        </Field>
        <Field label="কঠিনতা (১–৫)">
          <Rating value={v.difficulty} onChange={set("difficulty")} />
        </Field>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="কী বাকি আছে / নোট">
          <TextArea value={v.note} onChange={set("note")} />
        </Field>
      </div>
    </Shell>
  );
}

// ---------- Work ----------
export function WorkForm({ initial, onSave, onCancel }) {
  const [v, , set] = useForm({
    date: todayISO(),
    title: "",
    category: "",
    startTime: "",
    endTime: "",
    minutes: "",
    note: "",
    ...initial,
  });
  const [error, setError] = useState("");
  const derived = durationMinutes(v.startTime, v.endTime);

  function submit() {
    if (!v.date) return setError("তারিখ দিন।");
    const minutes = v.minutes !== "" ? Number(v.minutes) : derived;
    if (!minutes || minutes <= 0) return setError("কাজের সময় লিখুন — ঘড়ির সময় অথবা মিনিট।");
    return onSave({ ...v, minutes });
  }

  return (
    <Shell onSubmit={submit} onCancel={onCancel} error={error} label="কাজ সেভ করুন">
      <div className="form-grid">
        <Field label="তারিখ">
          <DateInput value={v.date} onChange={set("date")} />
        </Field>
        <Field label="কাজের নাম">
          <TextInput value={v.title} onChange={set("title")} placeholder="যেমন: হোমপেজ রিডিজাইন" />
        </Field>
        <Field label="ক্যাটাগরি">
          <Select value={v.category} onChange={set("category")} options={WORK_CATEGORIES} placeholder="বেছে নিন" />
        </Field>
        <Field label="শুরুর সময়">
          <TimeInput value={v.startTime} onChange={set("startTime")} />
        </Field>
        <Field label="শেষের সময়">
          <TimeInput value={v.endTime} onChange={set("endTime")} />
        </Field>
        <Field label="মিনিট" hint={derived !== null ? `ঘড়ি অনুযায়ী ${derived} মিনিট` : "সময় দিলে স্বয়ংক্রিয় হবে"}>
          <NumberInput value={v.minutes} min="0" placeholder={derived !== null ? String(derived) : ""} onChange={set("minutes")} />
        </Field>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="বিবরণ / নোট">
          <TextArea value={v.note} onChange={set("note")} />
        </Field>
      </div>
    </Shell>
  );
}

// ---------- Exercise ----------
export function ExerciseForm({ initial, onSave, onCancel }) {
  const [v, , set] = useForm({
    date: todayISO(),
    type: "",
    startTime: "",
    endTime: "",
    minutes: "",
    note: "",
    ...initial,
  });
  const [error, setError] = useState("");
  const derived = durationMinutes(v.startTime, v.endTime);

  function submit() {
    if (!v.date) return setError("তারিখ দিন।");
    if (!v.type) return setError("ব্যায়ামের ধরন বেছে নিন।");
    const minutes = v.minutes !== "" ? Number(v.minutes) : derived;
    if (!minutes || minutes <= 0) return setError("সময় লিখুন — ঘড়ির সময় অথবা মিনিট।");
    return onSave({ ...v, minutes });
  }

  return (
    <Shell onSubmit={submit} onCancel={onCancel} error={error} label="ব্যায়াম সেভ করুন">
      <div className="form-grid">
        <Field label="তারিখ">
          <DateInput value={v.date} onChange={set("date")} />
        </Field>
        <Field label="ধরন">
          <Select value={v.type} onChange={set("type")} options={EXERCISE_TYPES} placeholder="বেছে নিন" />
        </Field>
        <Field label="শুরুর সময়">
          <TimeInput value={v.startTime} onChange={set("startTime")} />
        </Field>
        <Field label="শেষের সময়">
          <TimeInput value={v.endTime} onChange={set("endTime")} />
        </Field>
        <Field label="মিনিট" hint={derived !== null ? `ঘড়ি অনুযায়ী ${derived} মিনিট` : "সময় দিলে স্বয়ংক্রিয় হবে"}>
          <NumberInput value={v.minutes} min="0" placeholder={derived !== null ? String(derived) : ""} onChange={set("minutes")} />
        </Field>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="নোট">
          <TextArea value={v.note} onChange={set("note")} />
        </Field>
      </div>
    </Shell>
  );
}

// ---------- Health / headache ----------
export function HealthForm({ initial, onSave, onCancel }) {
  const [v, , set] = useForm({
    date: todayISO(),
    kind: "মাথাব্যথা",
    startTime: "",
    durationMin: "",
    severity: "",
    location: "",
    eyeDiscomfort: "",
    stress: "",
    trigger: "",
    note: "",
    ...initial,
  });
  const [error, setError] = useState("");

  function submit() {
    if (!v.date) return setError("তারিখ দিন।");
    if (v.kind !== "অন্যান্য" && v.severity === "") return setError("ব্যথার মাত্রা দিন।");
    return onSave({
      ...v,
      durationMin: v.durationMin === "" ? "" : Number(v.durationMin),
      severity: v.severity === "" ? "" : Number(v.severity),
      stress: v.stress === "" ? "" : Number(v.stress),
    });
  }

  const headache = v.kind !== "অন্যান্য";

  return (
    <Shell onSubmit={submit} onCancel={onCancel} error={error} label="রেকর্ড সেভ করুন">
      <Field label="ধরন">
        <Segmented
          value={v.kind}
          onChange={set("kind")}
          allowClear={false}
          options={[
            { value: "মাথাব্যথা", label: "মাথাব্যথা" },
            { value: "অন্যান্য", label: "শারীরিক সমস্যা / নোট" },
          ]}
        />
      </Field>

      <div className="form-grid" style={{ marginTop: 12 }}>
        <Field label="তারিখ">
          <DateInput value={v.date} onChange={set("date")} />
        </Field>
        <Field label="শুরুর সময়">
          <TimeInput value={v.startTime} onChange={set("startTime")} />
        </Field>
        {headache ? (
          <>
            <Field label="স্থায়িত্ব (মিনিট)">
              <NumberInput value={v.durationMin} min="0" onChange={set("durationMin")} />
            </Field>
            <Field label="ব্যথার স্থান">
              <Select value={v.location} onChange={set("location")} options={HEADACHE_LOCATIONS} placeholder="বেছে নিন" />
            </Field>
          </>
        ) : null}
        <Field label="মানসিক চাপ (১–৫)">
          <Rating value={v.stress} onChange={set("stress")} />
        </Field>
      </div>

      {headache ? (
        <>
          <div style={{ marginTop: 12 }}>
            <Field label="ব্যথার মাত্রা (১–১০)">
              <Rating value={v.severity} onChange={set("severity")} max={10} ariaLabel="ব্যথার মাত্রা" />
            </Field>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="চোখে অস্বস্তি ছিল?">
              <YesNo value={v.eyeDiscomfort} onChange={set("eyeDiscomfort")} />
            </Field>
          </div>
        </>
      ) : null}

      <div style={{ marginTop: 12 }}>
        <Field label="সম্ভাব্য কারণ / নিজের পর্যবেক্ষণ">
          <TextArea value={v.trigger} onChange={set("trigger")} placeholder="যেমন: কম ঘুম, দীর্ঘক্ষণ স্ক্রিন, পানি কম" />
        </Field>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="নোট">
          <TextArea value={v.note} onChange={set("note")} />
        </Field>
      </div>
    </Shell>
  );
}

// ---------- Weight ----------
export function WeightForm({ initial, onSave, onCancel }) {
  const [v, , set] = useForm({ date: todayISO(), time: "", weight: "", note: "", ...initial });
  const [error, setError] = useState("");

  function submit() {
    if (!v.date) return setError("তারিখ দিন।");
    const w = Number(v.weight);
    if (!w || w <= 0) return setError("সঠিক ওজন (কেজি) লিখুন।");
    return onSave({ ...v, weight: w });
  }

  return (
    <Shell onSubmit={submit} onCancel={onCancel} error={error} label="ওজন সেভ করুন">
      <div className="form-grid">
        <Field label="তারিখ">
          <DateInput value={v.date} onChange={set("date")} />
        </Field>
        <Field label="সময়">
          <TimeInput value={v.time} onChange={set("time")} />
        </Field>
        <Field label="ওজন (কেজি)">
          <NumberInput value={v.weight} step="0.1" min="0" onChange={set("weight")} />
        </Field>
      </div>
      <div style={{ marginTop: 12 }}>
        <Field label="নোট">
          <TextInput value={v.note} onChange={set("note")} />
        </Field>
      </div>
    </Shell>
  );
}

export const FORM_BY_CATEGORY = {
  sleep: { title: "ঘুম যোগ করুন", icon: "Moon", Form: SleepForm },
  meals: { title: "খাবার যোগ করুন", icon: "Utensils", Form: MealForm },
  water: { title: "পানি যোগ করুন", icon: "Droplets", Form: WaterForm },
  study: { title: "পড়ার সেশন যোগ করুন", icon: "BookOpen", Form: StudyForm },
  work: { title: "কাজের সেশন যোগ করুন", icon: "Briefcase", Form: WorkForm },
  exercise: { title: "ব্যায়াম যোগ করুন", icon: "Dumbbell", Form: ExerciseForm },
  health: { title: "স্বাস্থ্য রেকর্ড যোগ করুন", icon: "HeartPulse", Form: HealthForm },
  weights: { title: "ওজন যোগ করুন", icon: "Scale", Form: WeightForm },
};