import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Settings as SettingsIcon,
  User,
  Target,
  Moon,
  Sun,
  Database,
  ShieldCheck,
  Info,
  Save,
  Smartphone,
  Globe,
  BellRing,
  Send,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import {
  PageHeader,
  SectionCard,
  Field,
  TextInput,
  NumberInput,
  TimeInput,
  StatusBanner,
  Badge,
} from "../components/Ui";
import { useStore } from "../store/useStore";
import { CHART } from "../lib/chart";
import {
  notificationsSupported,
  reminderPermission,
  requestReminderPermission,
  showReminder,
  resetReminderClock,
  syncReminderConfig,
  registerBackgroundSync,
  unregisterBackgroundSync,
  customTextsOf,
  MAX_CUSTOM_TEXTS,
  MAX_TEXT_LENGTH,
} from "../lib/reminders";

export default function SettingsPage() {
  const state = useStore();
  const { profile, settings } = state;
  const [profileDraft, setProfileDraft] = useState({ ...profile });
  const [saved, setSaved] = useState("");
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [reminderMsg, setReminderMsg] = useState("");
  const [customInput, setCustomInput] = useState("");

  const dark = settings.theme !== "light";
  const reminders = state.reminders || {
    enabled: false,
    intervalHours: 3,
    quietStart: "22:00",
    quietEnd: "07:00",
    customTexts: [],
  };
  const customTexts = customTextsOf(reminders);

  useEffect(() => {
    setSupported(notificationsSupported());
    setPermission(reminderPermission());
  }, []);

  async function enableReminders() {
    if (!notificationsSupported()) {
      setReminderMsg("এই ব্রাউজারে নোটিফিকেশন সমর্থিত নয়।");
      return;
    }
    let perm = Notification.permission;
    if (perm !== "granted") perm = await requestReminderPermission();
    setPermission(perm);
    if (perm !== "granted") {
      setReminderMsg("অনুমতি ছাড়া নোটিফিকেশন পাঠানো যাবে না। ব্রাউজার সেটিংস থেকে অনুমতি দিন।");
      return;
    }
    state.updateReminders({ enabled: true });
    await resetReminderClock();
    await syncReminderConfig({ ...reminders, enabled: true });
    await registerBackgroundSync({ ...reminders, enabled: true });
    setReminderMsg("রিমাইন্ডার চালু হয়েছে। পরবর্তী বার্তা নির্ধারিত সময় পর আসবে।");
  }

  async function disableReminders() {
    state.updateReminders({ enabled: false });
    await syncReminderConfig({ ...reminders, enabled: false });
    await unregisterBackgroundSync();
    setReminderMsg("রিমাইন্ডার বন্ধ করা হয়েছে।");
  }

  async function testReminder() {
    let perm = reminderPermission();
    if (perm !== "granted") perm = await requestReminderPermission();
    setPermission(perm);
    if (perm !== "granted") {
      setReminderMsg("নোটিফিকেশনের অনুমতি নেই। আগে অনুমতি দিন।");
      return;
    }
    const ok = await showReminder("পরীক্ষার বার্তা — রিমাইন্ডার ঠিকভাবে কাজ করছে।");
    setReminderMsg(ok ? "পরীক্ষার নোটিফিকেশন পাঠানো হয়েছে।" : "নোটিফিকেশন পাঠানো যায়নি।");
  }

  function changeInterval(value) {
    const intervalHours = Number(value);
    state.updateReminders({ intervalHours });
    syncReminderConfig({ ...reminders, intervalHours });
    resetReminderClock();
  }

  function changeQuiet(key, value) {
    state.updateReminders({ [key]: value });
    syncReminderConfig({ ...reminders, [key]: value });
  }

  function saveCustomTexts(next) {
    state.updateReminders({ customTexts: next });
    syncReminderConfig({ ...reminders, customTexts: next });
  }

  function addCustomText() {
    const text = customInput.trim().slice(0, MAX_TEXT_LENGTH);
    if (!text) return;
    if (customTexts.length >= MAX_CUSTOM_TEXTS) {
      setReminderMsg(`সর্বোচ্চ ${MAX_CUSTOM_TEXTS}টি নিজের বার্তা যোগ করা যায়।`);
      return;
    }
    if (customTexts.includes(text)) {
      setReminderMsg("এই বার্তাটি আগেই যোগ করা আছে।");
      return;
    }
    saveCustomTexts([...customTexts, text]);
    setCustomInput("");
    setReminderMsg("নিজের বার্তা যোগ হয়েছে। এখন থেকে এলোমেলোভাবে এটিও আসতে পারে।");
  }

  function removeCustomText(index) {
    saveCustomTexts(customTexts.filter((_, i) => i !== index));
    setReminderMsg("বার্তাটি মুছে ফেলা হয়েছে।");
  }

  function saveProfile() {
    state.updateProfile(profileDraft);
    setSaved("প্রোফাইল সেভ হয়েছে।");
    window.setTimeout(() => setSaved(""), 2200);
  }

  function setTarget(key, value) {
    state.updateSettings({ [key]: value === "" ? "" : Number(value) });
  }

  const totalEvents =
    state.sleep.length +
    state.meals.length +
    state.water.length +
    state.study.length +
    state.work.length +
    state.exercise.length +
    state.health.length +
    state.weights.length;

  return (
    <div>
      <PageHeader
        icon={SettingsIcon}
        title="সেটিংস"
        subtitle="নিজের তথ্য, দৈনিক লক্ষ্য ও পছন্দ অনুযায়ী অ্যাপ সাজিয়ে নিন।"
      />

      <SectionCard icon={User} title="ব্যক্তিগত তথ্য" subtitle="এই তথ্য শুধু আপনার ডিভাইসে থাকে">
        <div className="form-grid">
          <Field label="নাম">
            <TextInput
              value={profileDraft.name}
              onChange={(e) => setProfileDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="আপনার নাম"
            />
          </Field>
          <Field label="বয়স">
            <NumberInput
              value={profileDraft.age}
              min="0"
              onChange={(e) => setProfileDraft((p) => ({ ...p, age: e.target.value }))}
              placeholder="বছর"
            />
          </Field>
          <Field label="উচ্চতা (সেন্টিমিটার)">
            <NumberInput
              value={profileDraft.height}
              min="0"
              onChange={(e) => setProfileDraft((p) => ({ ...p, height: e.target.value }))}
              placeholder="যেমন ১৬৫"
            />
          </Field>
          <Field label="শুরুর ওজন (কেজি)">
            <NumberInput
              value={profileDraft.startWeight}
              step="0.1"
              min="0"
              onChange={(e) => setProfileDraft((p) => ({ ...p, startWeight: e.target.value }))}
              placeholder="যেমন ৬৫"
            />
          </Field>
          <Field label="লক্ষ্য ওজন (কেজি)">
            <NumberInput
              value={profileDraft.targetWeight}
              step="0.1"
              min="0"
              onChange={(e) => setProfileDraft((p) => ({ ...p, targetWeight: e.target.value }))}
              placeholder="যেমন ৬০"
            />
          </Field>
        </div>
        <div className="row" style={{ marginTop: 12, gap: 8 }}>
          <button type="button" className="btn btn-primary" onClick={saveProfile}>
            <Save size={15} /> প্রোফাইল সেভ
          </button>
          {saved ? <span className="tiny" style={{ color: "var(--accent)", fontWeight: 600 }}>{saved}</span> : null}
        </div>
      </SectionCard>

      <SectionCard icon={Target} title="দৈনিক লক্ষ্য" subtitle="রিপোর্টে তুলনা ও অগ্রগতির হিসাবে ব্যবহৃত হয়">
        <div className="form-grid">
          <Field label="ঘুমের লক্ষ্য (ঘণ্টা)">
            <NumberInput value={settings.sleepTargetHrs} step="0.5" min="0" onChange={(e) => setTarget("sleepTargetHrs", e.target.value)} />
          </Field>
          <Field label="পড়াশোনার লক্ষ্য (মিনিট/দিন)">
            <NumberInput value={settings.studyTargetMin} step="5" min="0" onChange={(e) => setTarget("studyTargetMin", e.target.value)} />
          </Field>
          <Field label="কাজের সীমা (মিনিট/দিন)">
            <NumberInput value={settings.workLimitMin} step="5" min="0" onChange={(e) => setTarget("workLimitMin", e.target.value)} />
          </Field>
          <Field label="পানির লক্ষ্য (গ্লাস/দিন)">
            <NumberInput value={settings.waterTarget} step="1" min="0" onChange={(e) => setTarget("waterTarget", e.target.value)} />
          </Field>
          <Field label="ব্যায়ামের লক্ষ্য (মিনিট/দিন)">
            <NumberInput
              value={settings.exerciseTargetMin}
              step="5"
              min="0"
              onChange={(e) => setTarget("exerciseTargetMin", e.target.value)}
            />
          </Field>
        </div>
        <div className="divider" />
        <div className="tiny muted" style={{ lineHeight: 1.7 }}>
          লক্ষ্য বদলালে পুরোনো রেকর্ডের সংখ্যা বদলায় না — শুধু নতুন হিসাবে তুলনা হয়।
        </div>
      </SectionCard>

      <SectionCard icon={dark ? Moon : Sun} title="চেহারা" subtitle="ডার্ক ও লাইট থিমের মধ্যে বদলান">
        <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
          <div>
            <div className="small strong">{dark ? "ডার্ক থিম চালু" : "লাইট থিম চালু"}</div>
            <div className="tiny muted">পছন্দ আপনার — দিনে-রাতে যেটি আরামদায়ক লাগে</div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => state.updateSettings({ theme: dark ? "light" : "dark" })}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
            {dark ? "লাইট করুন" : "ডার্ক করুন"}
          </button>
        </div>
      </SectionCard>

      <SectionCard
        icon={BellRing}
        title="নোটিফিকেশন রিমাইন্ডার"
        subtitle="নির্দিষ্ট সময় পরপর ফোনে মোটিভেশনাল বার্তা — সার্ভার বা ইন্টারনেট ছাড়াই"
      >
        <div className="row row-wrap" style={{ justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div className="small strong">{reminders.enabled ? "রিমাইন্ডার চালু আছে" : "রিমাইন্ডার বন্ধ আছে"}</div>
            <div className="tiny muted" style={{ marginTop: 2 }}>
              {reminders.enabled
                ? `প্রতি ${reminders.intervalHours} ঘণ্টায় · বিশ্রাম ${reminders.quietStart}–${reminders.quietEnd}`
                : "চালু করলে ব্রাউজার অনুমতি চাইবে"}
            </div>
          </div>
          <div className="row" style={{ gap: 6, flex: "0 0 auto" }}>
            {reminders.enabled ? (
              <button type="button" className="btn btn-ghost" onClick={disableReminders}>
                বন্ধ করুন
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={enableReminders}>
                <BellRing size={15} /> চালু করুন
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={testReminder}>
              <Send size={15} /> পরীক্ষা
            </button>
          </div>
        </div>

        {reminderMsg ? (
          <div className="tiny" style={{ color: "var(--accent)", fontWeight: 600, marginTop: 10 }}>
            {reminderMsg}
          </div>
        ) : null}

        <div className="divider" />

        <div className="form-grid">
          <Field label="কত সময় পরপর">
            <select
              className="select"
              value={String(reminders.intervalHours)}
              onChange={(e) => changeInterval(e.target.value)}
            >
              {[1, 2, 3, 4, 6].map((h) => (
                <option key={h} value={String(h)}>
                  প্রতি {h} ঘণ্টায়
                </option>
              ))}
            </select>
          </Field>
          <Field label="বিশ্রাম শুরু" hint="এই সময়ে নোটিফিকেশন আসবে না">
            <TimeInput value={reminders.quietStart} onChange={(e) => changeQuiet("quietStart", e.target.value)} />
          </Field>
          <Field label="বিশ্রাম শেষ">
            <TimeInput value={reminders.quietEnd} onChange={(e) => changeQuiet("quietEnd", e.target.value)} />
          </Field>
        </div>

        <div className="divider" />

        <div className="row row-wrap" style={{ justifyContent: "space-between", gap: 8 }}>
          <div className="small strong">নিজের বার্তা</div>
          <span className="tiny muted">
            {customTexts.length} / {MAX_CUSTOM_TEXTS}
          </span>
        </div>
        <div className="tiny muted" style={{ marginTop: 4, lineHeight: 1.65 }}>
          এখানে যোগ করা বার্তাগুলোও ডিফল্ট বার্তার সঙ্গে এলোমেলোভাবে বাছাই হবে। কিছু না যোগ করলে ডিফল্ট বার্তাই
          আসবে।
        </div>

        {customTexts.length ? (
          <div className="stack tight" style={{ marginTop: 10 }}>
            {customTexts.map((text, index) => (
              <div
                key={`${text}-${index}`}
                className="row"
                style={{
                  justifyContent: "space-between",
                  gap: 8,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "8px 10px",
                }}
              >
                <span className="small" style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  {text}
                </span>
                <button
                  type="button"
                  className="btn-icon"
                  aria-label="বার্তা মুছুন"
                  title="বার্তা মুছুন"
                  onClick={() => removeCustomText(index)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="row row-wrap" style={{ gap: 8, marginTop: 10 }}>
          <TextInput
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="যেমন: আজ একটু হাঁটতে বের হন"
            maxLength={MAX_TEXT_LENGTH}
            aria-label="নিজের বার্তা"
            style={{ flex: "1 1 190px" }}
          />
          <button
            type="button"
            className="btn btn-ghost"
            onClick={addCustomText}
            disabled={!customInput.trim()}
          >
            <Plus size={15} /> যোগ করুন
          </button>
        </div>

        <StatusBanner>
          {permission === "granted" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>
            {!supported
              ? "এই ব্রাউজারে নোটিফিকেশন সমর্থিত নয়।"
              : permission === "granted"
                ? "নোটিফিকেশনের অনুমতি দেওয়া আছে। অ্যাপ খোলা থাকলে নির্ধারিত সময়ে বার্তা আসবে; অ্যাপ বন্ধ থাকলে Android-এ মাঝে মাঝে আসবে — ব্রাউজার নিজেই সময় ঠিক করে, তাই প্রতি ৩ ঘণ্টার নিশ্চয়তা নেই।"
                : permission === "denied"
                  ? "নোটিফিকেশনের অনুমতি বন্ধ আছে। ব্রাউজার বা ফোনের সেটিংস থেকে অনুমতি চালু করুন।"
                  : "এখনো অনুমতি দেওয়া হয়নি। 'চালু করুন' চাপলে ব্রাউজার অনুমতি চাইবে।"}
          </span>
        </StatusBanner>

        <div className="tiny muted" style={{ marginTop: 8, lineHeight: 1.65 }}>
          অ্যাপ ইনস্টল করে নিলে Android-এ ব্যাকগ্রাউন্ড রিমাইন্ডারের সম্ভাবনা বাড়ে। iPhone-এ ব্যাকগ্রাউন্ড রিমাইন্ডার
          সীমিত। কোনো সার্ভার বা FCM ব্যবহার করা হয় না।
        </div>
      </SectionCard>

      <SectionCard icon={Database} title="ডেটা" subtitle="সব তথ্য ব্রাউজারের localStorage-এ সংরক্ষিত">
        <div className="kpi-grid" style={{ marginBottom: 12 }}>
          <div className="kpi-card" style={{ "--kpi-tone": CHART.cyan }}>
            <div className="kpi-label">মোট এন্ট্রি</div>
            <div className="kpi-value">{totalEvents}</div>
          </div>
          <div className="kpi-card" style={{ "--kpi-tone": CHART.green }}>
            <div className="kpi-label">ঘুমের এন্ট্রি</div>
            <div className="kpi-value">{state.sleep.length}</div>
          </div>
          <div className="kpi-card" style={{ "--kpi-tone": CHART.violet }}>
            <div className="kpi-label">ব্যায়ামের এন্ট্রি</div>
            <div className="kpi-value">{state.exercise.length}</div>
          </div>
          <div className="kpi-card" style={{ "--kpi-tone": CHART.amber }}>
            <div className="kpi-label">ওজনের মাপ</div>
            <div className="kpi-value">{state.weights.length}</div>
          </div>
        </div>

        <Link href="/reports" className="btn btn-ghost" style={{ width: "100%" }}>
          <Database size={15} /> ব্যাকআপ, ইমপোর্ট ও রিপোর্ট
        </Link>

        <div className="divider" />

        <StatusBanner>
          <ShieldCheck size={18} />
          <span>
            কোনো সার্ভারে তথ্য যায় না। ব্যাকআপ নিতে চাইলে রিপোর্ট পেজ থেকে JSON ডাউনলোড করুন — ব্রাউজার ডেটা মুছলে
            ব্যাকআপ ছাড়া তথ্য ফেরানো যাবে না।
          </span>
        </StatusBanner>
      </SectionCard>

      <SectionCard icon={Smartphone} title="অ্যাপ সম্পর্কে">
        <div className="stack tight">
          <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
            <span className="small muted">অ্যাপের ধরন</span>
            <span className="small strong">অফলাইন PWA</span>
          </div>
          <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
            <span className="small muted">তথ্য সংরক্ষণ</span>
            <Badge tone="good">শুধু এই ডিভাইসে</Badge>
          </div>
          <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
            <span className="small muted">স্ক্রিনে যোগ করুন</span>
            <span className="tiny muted" style={{ textAlign: "right" }}>ব্রাউজার মেনু থেকে "Add to Home screen"</span>
          </div>
          <div className="row row-wrap tiny muted" style={{ gap: 6, marginTop: 4, lineHeight: 1.6 }}>
            <Globe size={13} />
            <span>ইন্টারনেট ছাড়াও খোলা যায়, কারণ সব ফাইল ডিভাইসে সংরক্ষিত থাকে।</span>
          </div>
        </div>
      </SectionCard>

      <div className="row tiny muted" style={{ justifyContent: "center", gap: 6, marginTop: 6 }}>
        <Info size={13} />
        <span>এই অ্যাপ শুধু ব্যক্তিগত পর্যবেক্ষণের জন্য — কোনো রোগ নির্ণয় বা চিকিৎসার পরামর্শ নয়।</span>
      </div>
    </div>
  );
}