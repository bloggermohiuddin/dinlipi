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
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Layers,
  Timer,
  Flame,
  Target,
  GraduationCap,
  CheckCircle2,
  Circle,
  Info,
  ListChecks,
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
  Field,
  TextInput,
  Select,
  YesNo,
  StatusBanner,
  Progress,
} from "../components/Ui";
import { StudyForm } from "../components/forms";
import { useStore } from "../store/useStore";
import {
  itemsOn,
  sumMinutes,
  sumMinutesInRange,
  eventsInRange,
  eventMinutes,
  activeDayStreak,
  minutesByKey,
  fmtDuration,
} from "../lib/calc";
import { todayISO, lastNDates, addDays, formatDateShort, formatDateFull, weekdayBangla } from "../lib/dateUtils";
import { CHART, tooltipStyle, axisTick, chartMargin } from "../lib/chart";

export default function StudyPage() {
  const state = useStore();
  const today = todayISO();
  const [tab, setTab] = useState("sessions");
  const [editor, setEditor] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [chapterDraft, setChapterDraft] = useState({ subjectId: "", name: "", difficulty: "" });
  const last14 = useMemo(() => lastNDates(14), []);

  const todayMin = sumMinutes(itemsOn(state.study, today));
  const weekMin = sumMinutesInRange(state.study, addDays(today, -6), today);
  const monthMin = sumMinutesInRange(state.study, addDays(today, -29), today);
  const streak = activeDayStreak(state.study);
  const weekEntries = eventsInRange(state.study, addDays(today, -6), today);

  const subjectMap = useMemo(() => {
    const out = new Map();
    state.subjects.forEach((s) => out.set(s.id, { subject: s, minutes: 0, sessions: 0, understanding: [] }));
    state.study.forEach((e) => {
      if (!out.has(e.subjectId)) out.set(e.subjectId, { subject: { id: e.subjectId, name: "অজানা বিষয়" }, minutes: 0, sessions: 0, understanding: [] });
      const row = out.get(e.subjectId);
      row.minutes += eventMinutes(e);
      row.sessions += 1;
      if (e.understanding !== "" && e.understanding !== undefined) row.understanding.push(Number(e.understanding));
    });
    return Array.from(out.values());
  }, [state.study, state.subjects]);

  const weekBySubject = useMemo(() => {
    const map = {};
    weekEntries.forEach((e) => {
      map[e.subjectId] = (map[e.subjectId] || 0) + eventMinutes(e);
    });
    return map;
  }, [weekEntries]);

  const chartData = useMemo(
    () =>
      last14.map((d) => {
        const entries = itemsOn(state.study, d);
        return { date: formatDateShort(d), মিনিট: Math.round(sumMinutes(entries)), এন্ট্রি: entries.length };
      }),
    [state.study, last14]
  );

  const subjectChart = useMemo(
    () =>
      state.subjects.map((s) => ({
        name: s.name.length > 12 ? `${s.name.slice(0, 12)}…` : s.name,
        মিনিট: Math.round(weekBySubject[s.id] || 0),
      })),
    [state.subjects, weekBySubject]
  );

  const sessions = useMemo(() => {
    const rows = state.study.slice().sort((a, b) => (a.date === b.date ? (a.startTime || "") < (b.startTime || "") ? 1 : -1 : a.date < b.date ? 1 : -1));
    return subjectFilter ? rows.filter((s) => s.subjectId === subjectFilter) : rows;
  }, [state.study, subjectFilter]);

  const chaptersBySubject = useMemo(() => {
    const map = {};
    state.chapters.forEach((c) => {
      map[c.subjectId] = map[c.subjectId] || [];
      map[c.subjectId].push(c);
    });
    return map;
  }, [state.chapters]);

  const bestDay = useMemo(() => {
    const data = last14.map((d) => ({ date: d, min: sumMinutes(itemsOn(state.study, d)) }));
    const withData = data.filter((x) => x.min > 0);
    if (!withData.length) return null;
    return withData.reduce((a, b) => (b.min > a.min ? b : a));
  }, [state.study, last14]);

  const targetDays = last14.filter((d) => sumMinutes(itemsOn(state.study, d)) >= state.settings.studyTargetMin).length;
  const studyDays = last14.filter((d) => sumMinutes(itemsOn(state.study, d)) > 0).length;

  function save(values) {
    if (editor && editor.id) state.updateItem("study", editor.id, values);
    else state.addItem("study", values);
    setEditor(null);
  }

  function remove(id) {
    if (window.confirm("এই পড়ার সেশনটি মুছে ফেলবেন?")) state.removeItem("study", id);
  }

  function addSubject() {
    const name = newSubject.trim();
    if (!name) return;
    state.addItem("subjects", { name });
    setNewSubject("");
  }

  function removeSubject(s) {
    const used = state.study.some((e) => e.subjectId === s.id);
    if (used && !window.confirm("এই বিষয়ে পড়ার সেশন আছে। বিষয় মুছলে সেশনগুলো 'অজানা বিষয়' হিসেবে থাকবে। চালিয়ে যাবেন?")) return;
    state.removeItem("subjects", s.id);
    state.chapters.filter((c) => c.subjectId === s.id).forEach((c) => state.removeItem("chapters", c.id));
  }

  function addChapter() {
    if (!chapterDraft.subjectId || !chapterDraft.name.trim()) return;
    state.addItem("chapters", {
      subjectId: chapterDraft.subjectId,
      name: chapterDraft.name.trim(),
      difficulty: chapterDraft.difficulty,
      completed: "",
    });
    setChapterDraft({ subjectId: chapterDraft.subjectId, name: "", difficulty: "" });
  }

  const subjectName = (id) => {
    const s = state.subjects.find((x) => x.id === id);
    return s ? s.name : "অজানা বিষয়";
  };

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        title="পড়াশোনা"
        subtitle="প্রতিটি পড়ার সেশন আলাদা — একই দিনে একাধিক বিষয় বা একাধিক সেশন যোগ করা যাবে।"
        actions={
          <button type="button" className="btn btn-primary" onClick={() => setEditor({ date: today })}>
            <Plus size={16} /> নতুন সেশন
          </button>
        }
      />

      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <KpiCard icon={Timer} label="আজ" value={Math.round(todayMin)} unit="মিনিট" tone={CHART.cyan} />
        <KpiCard icon={BookOpen} label="গত ৭ দিন" value={fmtDuration(weekMin)} tone={CHART.green} hint={`${weekEntries.length}টি সেশন`} />
        <KpiCard icon={Layers} label="গত ৩০ দিন" value={fmtDuration(monthMin)} tone={CHART.violet} />
        <KpiCard icon={Flame} label="পড়ার ধারা" value={streak} unit="দিন" tone={CHART.amber} hint="টানা পড়ার দিন" />
        <KpiCard icon={Target} label="লক্ষ্য পূরণ (১৪ দিন)" value={`${targetDays}/${studyDays || 0}`} tone={CHART.blue} hint={`লক্ষ্য ${state.settings.studyTargetMin} মিনিট/দিন`} />
      </div>

      <div style={{ marginBottom: 14 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "sessions", label: `সেশন (${state.study.length})` },
            { value: "subjects", label: `বিষয় (${state.subjects.length})` },
            { value: "chapters", label: `অধ্যায় (${state.chapters.length})` },
            { value: "analytics", label: "বিশ্লেষণ" },
          ]}
        />
      </div>

      {tab === "sessions" ? (
        <>
          <SectionCard
            icon={BookOpen}
            title="পড়ার সেশন"
            subtitle={`${sessions.length}টি সেশন`}
            right={
              <div className="row" style={{ gap: 6 }}>
                <Select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  options={state.subjects.map((s) => ({ value: s.id, label: s.name }))}
                  placeholder="সব বিষয়"
                  style={{ minWidth: 130, padding: "6px 28px 6px 10px", fontSize: "0.76rem" }}
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditor({ date: today })}>
                  <Plus size={14} /> যোগ
                </button>
              </div>
            }
            flush
          >
            {sessions.length === 0 ? (
              <EmptyState icon={BookOpen} title="কোনো সেশন নেই" hint="'নতুন সেশন' বাটন থেকে পড়াশোনা যোগ করুন।" />
            ) : (
              sessions.map((s) => {
                const subject = state.subjects.find((x) => x.id === s.subjectId);
                const chapter = state.chapters.find((c) => c.id === s.chapterId);
                return (
                  <EventRow
                    key={s.id}
                    icon={BookOpen}
                    tone={CHART.green}
                    title={`${subject ? subject.name : "অজানা বিষয়"} · ${eventMinutes(s)} মিনিট`}
                    subtitle={`${formatDateShort(s.date)} · ${weekdayBangla(s.date)}বার${chapter ? ` · ${chapter.name}` : ""}${
                      s.startTime || s.endTime ? ` · ${s.startTime || "—"}–${s.endTime || "—"}` : ""
                    }`}
                    right={
                      s.status ? (
                        <Badge tone={s.status === "সম্পন্ন" ? "good" : s.status === "আংশিক" ? "warn" : "mute"}>{s.status}</Badge>
                      ) : null
                    }
                    actions={
                      <>
                        <button type="button" className="btn-icon" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => setEditor(s)} aria-label="সম্পাদনা">
                          <Pencil size={13} />
                        </button>
                        <button type="button" className="btn-icon danger" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => remove(s.id)} aria-label="মুছুন">
                          <Trash2 size={13} />
                        </button>
                      </>
                    }
                  />
                );
              })
            )}
          </SectionCard>
        </>
      ) : null}

      {tab === "subjects" ? (
        <SectionCard icon={GraduationCap} title="বিষয় ব্যবস্থাপনা" subtitle="নিজের বিষয় যোগ, নাম বদল বা বাদ দিন।">
          <div className="stack tight">
            {subjectMap.map(({ subject, minutes, sessions: count }) => (
              <div key={subject.id} className="row" style={{ gap: 6 }}>
                <TextInput
                  value={subject.name}
                  onChange={(e) => state.setItemField("subjects", subject.id, "name", e.target.value)}
                  aria-label="বিষয়ের নাম"
                />
                <span className="tiny muted numeric" style={{ width: 86, textAlign: "right", flex: "0 0 auto" }}>
                  {Math.round(minutes)} মি · {count}
                </span>
                <button type="button" className="btn-icon danger" style={{ width: 34, height: 34, minHeight: 34 }} onClick={() => removeSubject(subject)} aria-label="বিষয় মুছুন">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="row" style={{ gap: 8, marginTop: 14 }}>
            <TextInput placeholder="নতুন বিষয়ের নাম" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSubject()} />
            <button type="button" className="btn btn-primary" onClick={addSubject} disabled={!newSubject.trim()}>
              <Plus size={15} /> যোগ
            </button>
          </div>

          <div className="divider" />
          <div className="tiny muted" style={{ lineHeight: 1.7 }}>
            বিষয় মুছলে সেই বিষয়ের পুরোনো সেশন মুছে যায় না — সেগুলো "অজানা বিষয়" হিসেবে থেকে যায়, যাতে ইতিহাস নষ্ট না হয়।
          </div>
        </SectionCard>
      ) : null}

      {tab === "chapters" ? (
        <>
          <SectionCard icon={Layers} title="অধ্যায় যোগ করুন" subtitle="প্রতিটি বিষয়ের অধ্যায় ও অগ্রগতি রাখুন।">
            <div className="form-grid">
              <Field label="বিষয়">
                <Select
                  value={chapterDraft.subjectId}
                  onChange={(e) => setChapterDraft((p) => ({ ...p, subjectId: e.target.value }))}
                  options={state.subjects.map((s) => ({ value: s.id, label: s.name }))}
                  placeholder="বিষয় বেছে নিন"
                />
              </Field>
              <Field label="অধ্যায়ের নাম">
                <TextInput value={chapterDraft.name} onChange={(e) => setChapterDraft((p) => ({ ...p, name: e.target.value }))} />
              </Field>
              <Field label="কঠিনতা">
                <Select
                  value={chapterDraft.difficulty}
                  onChange={(e) => setChapterDraft((p) => ({ ...p, difficulty: e.target.value }))}
                  options={["সহজ", "মাঝারি", "কঠিন"]}
                  placeholder="বেছে নিন"
                />
              </Field>
            </div>
            <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={addChapter} disabled={!chapterDraft.subjectId || !chapterDraft.name.trim()}>
              <Plus size={15} /> অধ্যায় যোগ
            </button>
          </SectionCard>

          {state.subjects.map((s) => {
            const chapters = chaptersBySubject[s.id] || [];
            if (!chapters.length) return null;
            const done = chapters.filter((c) => c.completed === "হ্যাঁ").length;
            return (
              <SectionCard
                key={s.id}
                icon={Layers}
                title={s.name}
                subtitle={`${done}/${chapters.length} সম্পন্ন`}
                right={<Badge tone={done === chapters.length ? "good" : "mute"}>{Math.round((done / chapters.length) * 100)}%</Badge>}
                flush
              >
                {chapters.map((c) => (
                  <EventRow
                    key={c.id}
                    icon={c.completed === "হ্যাঁ" ? CheckCircle2 : Circle}
                    tone={c.completed === "হ্যাঁ" ? CHART.green : CHART.axis}
                    title={c.name}
                    subtitle={[c.difficulty, c.completed === "হ্যাঁ" ? "সম্পন্ন" : "চলমান"].filter(Boolean).join(" · ")}
                    right={
                      <div style={{ width: 118 }}>
                        <YesNo
                          value={c.completed}
                          onChange={(v) => state.setItemField("chapters", c.id, "completed", v)}
                        />
                      </div>
                    }
                    actions={
                      <button type="button" className="btn-icon danger" style={{ width: 30, height: 30, minHeight: 30 }} onClick={() => state.removeItem("chapters", c.id)} aria-label="অধ্যায় মুছুন">
                        <Trash2 size={13} />
                      </button>
                    }
                  />
                ))}
              </SectionCard>
            );
          })}

          {state.chapters.length === 0 ? (
            <SectionCard icon={Layers} title="অধ্যায়">
              <EmptyState icon={Layers} title="কোনো অধ্যায় নেই" hint="উপরে বিষয় বেছে নাম লিখে অধ্যায় যোগ করুন।" />
            </SectionCard>
          ) : null}
        </>
      ) : null}

      {tab === "analytics" ? (
        <>
          <div className="grid-2" style={{ marginBottom: 14 }}>
            <ChartCard icon={BookOpen} title="দৈনিক পড়াশোনা (শেষ ১৪ দিন)" height={230}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(34,211,238,0.08)" }} />
                  <ReferenceLine y={state.settings.studyTargetMin} stroke={CHART.green} strokeDasharray="4 4" />
                  <Bar dataKey="মিনিট" fill={CHART.cyan} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard icon={Layers} title="বিষয়ভিত্তিক সময় (শেষ ৭ দিন)" height={230}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChart} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} />
                  <YAxis tick={axisTick} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(52,211,153,0.06)" }} />
                  <Bar dataKey="মিনিট" fill={CHART.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <SectionCard icon={Target} title="বিষয়ভিত্তিক সারাংশ" subtitle="মোট সময় ও সেশনের সংখ্যা">
            <div className="stack">
              {subjectMap
                .slice()
                .sort((a, b) => b.minutes - a.minutes)
                .map(({ subject, minutes, sessions: count, understanding }) => {
                  const avgU = understanding.length ? understanding.reduce((a, b) => a + b, 0) / understanding.length : null;
                  return (
                    <div key={subject.id}>
                      <div className="progress-meta">
                        <span className="small strong">{subject.name}</span>
                        <span className="tiny numeric muted">
                          {Math.round(minutes)} মিনিট · {count} সেশন{avgU !== null ? ` · বোঝা ${avgU.toFixed(1)}/৫` : ""}
                        </span>
                      </div>
                      <Progress value={minutes ? minutes / Math.max(1, Math.max(...subjectMap.map((s) => s.minutes))) : 0} />
                    </div>
                  );
                })}
            </div>

            <div className="divider" />
            <div className="row row-wrap" style={{ justifyContent: "space-between", gap: 8 }}>
              <span className="small muted">সবচেয়ে বেশি পড়ার দিন</span>
              <span className="small strong">
                {bestDay ? `${formatDateShort(bestDay.date)} · ${Math.round(bestDay.min)} মিনিট` : "তথ্য নেই"}
              </span>
            </div>
            <div className="row row-wrap" style={{ justifyContent: "space-between", gap: 8, marginTop: 6 }}>
              <span className="small muted">৩০ দিনের মোট</span>
              <span className="small strong">{fmtDuration(monthMin)}</span>
            </div>
            <div className="row row-wrap" style={{ justifyContent: "space-between", gap: 8, marginTop: 6 }}>
              <span className="small muted">গত ৭ দিনের গড়</span>
              <span className="small strong">{fmtDuration(weekMin / 7)}</span>
            </div>
          </SectionCard>
        </>
      ) : null}

      {state.study.length === 0 ? (
        <div style={{ marginTop: 14 }}>
          <StatusBanner>
            <Info size={18} />
            <span>পড়াশোনার প্রথম সেশন যোগ করলে এখানে ধারা, লক্ষ্য পূরণ ও বিষয়ভিত্তিক বিশ্লেষণ দেখা যাবে।</span>
          </StatusBanner>
        </div>
      ) : null}

      <div className="row tiny muted" style={{ justifyContent: "center", gap: 6, marginTop: 14 }}>
        <ListChecks size={13} />
        <span>একই দিনে একাধিক সেশন যোগ করলে সব একসাথে দিনের মোটে যোগ হবে।</span>
      </div>

      <Sheet open={Boolean(editor)} title={editor && editor.id ? "সেশন সম্পাদনা" : "নতুন পড়ার সেশন"} onClose={() => setEditor(null)} wide>
        {editor ? (
          <StudyForm initial={editor} onSave={save} onCancel={() => setEditor(null)} subjects={state.subjects} chapters={state.chapters} />
        ) : null}
      </Sheet>
    </div>
  );
}