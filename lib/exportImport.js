// JSON-only backup. The app deliberately has no spreadsheet dependency:
// every record is an event, so JSON is the exact, lossless format.

const APP_ID = "health-study-life-tracker";
const BACKUP_VERSION = 2;

const DATA_KEYS = [
  "profile",
  "settings",
  "reminders",
  "subjects",
  "habits",
  "chapters",
  "routine",
  "goals",
  "sleep",
  "meals",
  "water",
  "study",
  "work",
  "exercise",
  "health",
  "weights",
  "habitLogs",
  "routineLogs",
  "reflections",
];

export function buildBackup(state) {
  const data = {};
  DATA_KEYS.forEach((key) => {
    if (state[key] !== undefined) data[key] = state[key];
  });
  return {
    app: APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function exportJSON(state) {
  const payload = buildBackup(state);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `life-tracker-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function parseImportedJSON(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch (err) {
    throw new Error("ফাইলটি বৈধ JSON নয়।");
  }
  if (!obj || typeof obj !== "object") throw new Error("ব্যাকআপ ফাইলের কাঠামো ঠিক নেই।");
  const data = obj.data && typeof obj.data === "object" ? obj.data : obj;
  const hasSomething = DATA_KEYS.some((key) => data[key] !== undefined);
  if (!hasSomething) throw new Error("এই ফাইলে অ্যাপের কোনো তথ্য পাওয়া যায়নি।");
  return data;
}

// Handy for a plain-text preview of what a backup contains.
export function backupSummary(state) {
  return [
    { label: "ঘুম", count: state.sleep.length },
    { label: "খাবার", count: state.meals.length },
    { label: "পানি", count: state.water.length },
    { label: "পড়াশোনা", count: state.study.length },
    { label: "কাজ", count: state.work.length },
    { label: "ব্যায়াম", count: state.exercise.length },
    { label: "স্বাস্থ্য", count: state.health.length },
    { label: "ওজন", count: state.weights.length },
  ];
}