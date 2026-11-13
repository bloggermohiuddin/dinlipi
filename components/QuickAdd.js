import { useState } from "react";
import {
  Moon,
  Utensils,
  Droplets,
  BookOpen,
  Briefcase,
  Dumbbell,
  HeartPulse,
  Scale,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { Sheet } from "./Ui";
import { useStore } from "../store/useStore";
import { todayISO } from "../lib/dateUtils";
import {
  SleepForm,
  MealForm,
  WaterForm,
  StudyForm,
  WorkForm,
  ExerciseForm,
  HealthForm,
  WeightForm,
} from "./forms";

export const QUICK_CATEGORIES = [
  { key: "sleep", label: "ঘুম", hint: "ঘুমানোর সময়", icon: Moon, tone: "#a78bfa", Form: SleepForm },
  { key: "meals", label: "খাবার", hint: "নাশতা, দুপুর, রাত", icon: Utensils, tone: "#fbbf24", Form: MealForm },
  { key: "water", label: "পানি", hint: "গ্লাস হিসাব", icon: Droplets, tone: "#22d3ee", Form: WaterForm },
  { key: "study", label: "পড়াশোনা", hint: "পড়ার সেশন", icon: BookOpen, tone: "#34d399", Form: StudyForm },
  { key: "work", label: "কাজ", hint: "Smart Madaripur", icon: Briefcase, tone: "#60a5fa", Form: WorkForm },
  { key: "exercise", label: "ব্যায়াম", hint: "হাঁটা ও ব্যায়াম", icon: Dumbbell, tone: "#fb7185", Form: ExerciseForm },
  { key: "health", label: "স্বাস্থ্য", hint: "মাথাব্যথা ও স্ট্রেস", icon: HeartPulse, tone: "#f472b6", Form: HealthForm },
  { key: "weights", label: "ওজন", hint: "ওজন রেকর্ড", icon: Scale, tone: "#34d399", Form: WeightForm },
];

export default function QuickAdd() {
  const quickAdd = useStore((s) => s.ui.quickAdd);
  const closeQuickAdd = useStore((s) => s.closeQuickAdd);
  const openQuickAdd = useStore((s) => s.openQuickAdd);
  const addItem = useStore((s) => s.addItem);
  const subjects = useStore((s) => s.subjects);
  const chapters = useStore((s) => s.chapters);
  const [saved, setSaved] = useState(false);

  const category = quickAdd === "menu" || !quickAdd ? null : QUICK_CATEGORIES.find((c) => c.key === quickAdd);
  const open = Boolean(quickAdd);

  function handleSave(values) {
    if (!category) return;
    addItem(category.key, values);
    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
      closeQuickAdd();
    }, 450);
  }

  if (!open) return null;

  if (!category) {
    return (
      <Sheet
        open
        title="দ্রুত যোগ করুন"
        subtitle="যেটি করতে চান সেটি বেছে নিন — তারিখ আজ ধরে নেওয়া হবে, পরে বদলানো যাবে।"
        onClose={closeQuickAdd}
        wide
      >
        <div className="quick-grid">
          {QUICK_CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                type="button"
                className="quick-btn"
                style={{ "--quick-tone": c.tone }}
                onClick={() => openQuickAdd(c.key)}
              >
                <Icon size={21} strokeWidth={1.9} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
        <div className="divider" />
        <div className="tiny muted" style={{ lineHeight: 1.7 }}>
          একই দিনে একাধিক এন্ট্রি করা যাবে — যেমন সকালের ঘুম, দুপুরের ভাত ঘুম, রাতে আবার পড়ার সেশন।
        </div>
      </Sheet>
    );
  }

  const Icon = category.icon;
  const Form = category.Form;

  return (
    <Sheet
      open
      title={category.label}
      subtitle="প্রয়োজনীয় তথ্য দিন, সেভ করলে সাথে সাথে হিসাবে যোগ হবে।"
      onClose={closeQuickAdd}
      wide
    >
      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openQuickAdd("menu")}>
          <ChevronLeft size={15} /> সব ধরন
        </button>
        <span className="event-icon" style={{ "--tone": category.tone, width: 30, height: 30, borderRadius: 9 }}>
          <Icon size={15} />
        </span>
        <span className="tiny muted">{category.hint}</span>
      </div>

      {saved ? (
        <div className="status-banner">
          <Plus size={18} />
          <span>সেভ হয়েছে — এই এন্ট্রি আজকের হিসাবে যোগ হয়েছে।</span>
        </div>
      ) : (
        <Form
          initial={{ date: todayISO() }}
          onSave={handleSave}
          onCancel={closeQuickAdd}
          subjects={subjects}
          chapters={chapters}
        />
      )}
    </Sheet>
  );
}