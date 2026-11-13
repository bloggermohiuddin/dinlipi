import { YES, NO } from "./defaultData";
import { inRange, todayISO, addDays, daysBetween } from "./dateUtils";

const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
const isNum = (v) => v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v));

// ---------- Time helpers ----------
export function toMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = String(hhmm).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

// Duration inside a single day. Returns null when end <= start.
export function durationMinutes(start, end) {
  const a = toMinutes(start);
  const b = toMinutes(end);
  if (a === null || b === null) return null;
  return b - a > 0 ? b - a : null;
}

// Sleep may cross midnight: 01:00 -> 08:00 = 7h, 23:00 -> 07:00 = 8h.
export function sleepDurationHrs(bedtime, waketime) {
  const a = toMinutes(bedtime);
  const b = toMinutes(waketime);
  if (a === null || b === null) return null;
  let diff = b - a;
  if (diff <= 0) diff += 24 * 60;
  return diff / 60;
}

// ---------- Event helpers ----------
export function eventMinutes(e) {
  const direct = num(e && e.minutes);
  if (direct !== null) return direct > 0 ? direct : 0;
  return durationMinutes(e && e.startTime, e && e.endTime) || 0;
}

export function itemsOn(items, date) {
  return (items || []).filter((e) => e.date === date);
}

export function eventsInRange(items, start, end) {
  return (items || []).filter((e) => inRange(e.date, start, end));
}

export function sumMinutes(items) {
  return (items || []).reduce((a, e) => a + eventMinutes(e), 0);
}

export function sumMinutesInRange(items, start, end) {
  return sumMinutes(eventsInRange(items, start, end));
}

export function uniqueDays(items) {
  return new Set((items || []).map((e) => e.date).filter(Boolean)).size;
}

export function minutesByKey(items, keyFn) {
  const out = {};
  (items || []).forEach((e) => {
    const k = keyFn(e);
    out[k] = (out[k] || 0) + eventMinutes(e);
  });
  return out;
}



// ---------- Habits ----------
export function habitDayPct(dayMap, habits) {
  const map = dayMap || {};
  const answered = (habits || []).filter((h) => map[h.id] === YES || map[h.id] === NO);
  if (answered.length === 0) return null;
  const done = answered.filter((h) => map[h.id] === YES).length;
  return done / answered.length;
}

export function habitDoneCount(dayMap, habits) {
  const map = dayMap || {};
  return (habits || []).filter((h) => map[h.id] === YES).length;
}

export function habitAnsweredCount(dayMap, habits) {
  const map = dayMap || {};
  return (habits || []).filter((h) => map[h.id] === YES || map[h.id] === NO).length;
}

export function habitSummary(habitLogs, habits, start, end) {
  const logs = habitLogs || {};
  const dates = Object.keys(logs).filter((d) => inRange(d, start, end)).sort();
  const answeredDayCount = dates.filter((d) => habitAnsweredCount(logs[d], habits) > 0).length;
  const pcts = dates.map((d) => habitDayPct(logs[d], habits)).filter((v) => v !== null);
  const avgPct = pcts.length ? pcts.reduce((a, b) => a + b, 0) / pcts.length : null;

  const perHabit = (habits || []).map((h) => {
    let yes = 0;
    let answered = 0;
    dates.forEach((d) => {
      const v = (logs[d] || {})[h.id];
      if (v === YES) {
        yes += 1;
        answered += 1;
      } else if (v === NO) {
        answered += 1;
      }
    });
    return { habit: h, yes, answered, rate: answered ? yes / answered : null };
  });

  return { avgPct, answeredDayCount, totalDays: dates.length, perHabit };
}

export function habitStreak(habitLogs, habitId, endDate = todayISO()) {
  const logs = habitLogs || {};
  let streak = 0;
  let cursor = endDate;
  // Allow today to be unanswered without breaking an existing streak.
  if (!logs[cursor] || logs[cursor][habitId] === undefined) cursor = addDays(cursor, -1);
  for (let i = 0; i < 400; i += 1) {
    const v = (logs[cursor] || {})[habitId];
    if (v !== YES) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function activeDayStreak(items, endDate = todayISO()) {
  const dates = new Set((items || []).map((e) => e.date).filter(Boolean));
  let streak = 0;
  let cursor = endDate;
  if (!dates.has(cursor)) cursor = addDays(cursor, -1);
  for (let i = 0; i < 400; i += 1) {
    if (!dates.has(cursor)) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

// ---------- Sleep ----------
export function sleepHoursOf(entry) {
  return sleepDurationHrs(entry.bedtime, entry.waketime);
}

export function sleepSummary(sleep, start, end) {
  const entries = eventsInRange(sleep, start, end).filter((e) => sleepHoursOf(e) !== null);

  // Average is per day, not per entry: two sleeps on one day add up.
  const byDate = {};
  entries.forEach((e) => {
    byDate[e.date] = (byDate[e.date] || 0) + sleepHoursOf(e);
  });
  const dailyTotals = Object.values(byDate);
  const avg = dailyTotals.length ? dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length : null;
  const nights = dailyTotals.length;

  const quality = entries.map((e) => num(e.quality)).filter((v) => v !== null);
  const avgQuality = quality.length ? quality.reduce((a, b) => a + b, 0) / quality.length : null;

  // Consistency looks at the main night sleep only (evening/night bedtime),
  // so afternoon naps do not make an otherwise regular sleeper look erratic.
  const nightEntries = entries.filter(
    (e) => e.bedtime && (e.bedtime >= "18:00" || e.bedtime <= "06:00")
  );
  const bedMinutes = nightEntries.map((e) => toMinutes(e.bedtime)).filter((v) => v !== null);
  let consistency = null;
  if (bedMinutes.length >= 2) {
    const TWO_PI = Math.PI * 2;
    const angles = bedMinutes.map((m) => (m / 1440) * TWO_PI);
    const avgSin = angles.reduce((a, x) => a + Math.sin(x), 0) / angles.length;
    const avgCos = angles.reduce((a, x) => a + Math.cos(x), 0) / angles.length;
    const meanAngle = Math.atan2(avgSin, avgCos);
    const meanMin = ((meanAngle / TWO_PI) * 1440 + 1440) % 1440;
    const diffs = bedMinutes.map((m) => {
      const raw = Math.abs(m - meanMin);
      return raw > 720 ? 1440 - raw : raw;
    });
    const sd = Math.sqrt(diffs.reduce((a, d) => a + d * d, 0) / diffs.length);
    consistency = Math.max(0, Math.min(1, 1 - sd / 180));
  }

  return { entries, avgHrs: avg, nights, avgQuality, consistency };
}

// ---------- Weight ----------
export function weightSeries(weights) {
  return (weights || [])
    .filter((w) => isNum(w.weight) && Number(w.weight) > 0)
    .slice()
    .sort((a, b) => (a.date === b.date ? (a.time || "") < (b.time || "") ? -1 : 1 : a.date < b.date ? -1 : 1));
}

export function latestWeight(weights, endDate = "9999-12-31") {
  const series = weightSeries(weights).filter((w) => w.date <= endDate);
  if (!series.length) return null;
  const last = series[series.length - 1];
  return { date: last.date, weight: Number(last.weight) };
}

export function weightRangeChange(weights, start, end) {
  const series = weightSeries(weights).filter((w) => inRange(w.date, start, end));
  if (series.length < 1) return null;
  const first = series[0];
  const last = series[series.length - 1];
  return {
    first: { date: first.date, weight: Number(first.weight) },
    last: { date: last.date, weight: Number(last.weight) },
    change: Number(last.weight) - Number(first.weight),
    samples: series.length,
  };
}

// ---------- Day summary ----------
export function daySummary(state, date) {
  const sleep = itemsOn(state.sleep, date).filter((e) => sleepHoursOf(e) !== null);
  const sleepHrs = sleep.length ? sleep.reduce((a, e) => a + sleepHoursOf(e), 0) : null;

  const meals = itemsOn(state.meals, date);
  const mealTypes = new Set(meals.map((m) => m.type));
  const mainMeals = ["সকালের নাশতা", "দুপুরের খাবার", "রাতের খাবার"];
  const mainCount = mainMeals.filter((t) => mealTypes.has(t)).length;
  const mealPct = meals.length ? mainCount / 3 : null;

  const waterGlasses = itemsOn(state.water, date).reduce((a, e) => a + (num(e.glasses) || 0), 0);
  const hasWater = itemsOn(state.water, date).length > 0;

  const studyMin = sumMinutes(itemsOn(state.study, date));
  const workMin = sumMinutes(itemsOn(state.work, date));
  const exerciseMin = sumMinutes(itemsOn(state.exercise, date));
  const healthEntries = itemsOn(state.health, date);
  const headache = healthEntries.filter((h) => h.kind !== "অন্যান্য");
  const stressVals = healthEntries.map((h) => num(h.stress)).filter((v) => v !== null);
  const weightEntry = weightSeries(itemsOn(state.weights, date)).slice(-1)[0] || null;

  const dayMap = (state.habitLogs || {})[date];
  const habitPct = habitDayPct(dayMap, state.habits);
  const habitDone = habitDoneCount(dayMap, state.habits);
  const habitAnswered = habitAnsweredCount(dayMap, state.habits);

  const routineMap = (state.routineLogs || {})[date] || {};
  const routineDone = state.routine.filter((r) => routineMap[r.id] === YES).length;

  return {
    date,
    sleepHrs,
    sleepEntries: sleep,
    meals,
    mealTypes,
    mainMealCount: mainCount,
    mealPct,
    waterGlasses: hasWater ? waterGlasses : null,
    studyMin,
    studyEntries: itemsOn(state.study, date),
    workMin,
    workEntries: itemsOn(state.work, date),
    exerciseMin,
    exerciseEntries: itemsOn(state.exercise, date),
    healthEntries,
    headacheCount: headache.length,
    stress: stressVals.length ? Math.max(...stressVals) : null,
    weight: weightEntry ? Number(weightEntry.weight) : null,
    weightEntry,
    habitPct,
    habitDone,
    habitAnswered,
    habitTotal: state.habits.length,
    routineDone,
    routineTotal: state.routine.length,
  };
}

export function hasDayData(summary) {
  if (!summary) return false;
  return Boolean(
    summary.sleepEntries.length ||
      summary.meals.length ||
      summary.waterGlasses !== null ||
      summary.studyEntries.length ||
      summary.workEntries.length ||
      summary.exerciseEntries.length ||
      summary.healthEntries.length ||
      summary.weight !== null ||
      summary.habitAnswered > 0 ||
      summary.routineDone > 0
  );
}

// ---------- Day timeline ----------
export function dayEvents(state, date) {
  const out = [];
  itemsOn(state.sleep, date).forEach((e) =>
    out.push({
      id: e.id,
      collection: "sleep",
      time: e.waketime || e.bedtime || "",
      sortTime: toMinutes(e.bedtime) ?? 0,
      title: "ঘুম",
      detail:
        sleepHoursOf(e) === null
          ? e.bedtime || e.waketime
            ? `${e.bedtime || "—"} – ${e.waketime || "—"}`
            : "সময় দেওয়া হয়নি"
          : `${sleepHoursOf(e).toFixed(1)} ঘণ্টা`,
      item: e,
    })
  );
  itemsOn(state.meals, date).forEach((e) =>
    out.push({
      id: e.id,
      collection: "meals",
      time: e.time || "",
      sortTime: toMinutes(e.time) ?? 0,
      title: e.type || "খাবার",
      detail: e.name || "খাবারের বিবরণ নেই",
      item: e,
    })
  );
  itemsOn(state.water, date).forEach((e) =>
    out.push({
      id: e.id,
      collection: "water",
      time: e.time || "",
      sortTime: toMinutes(e.time) ?? 0,
      title: "পানি",
      detail: `${e.glasses || 0} গ্লাস`,
      item: e,
    })
  );
  itemsOn(state.study, date).forEach((e) => {
    const subject = state.subjects.find((s) => s.id === e.subjectId);
    out.push({
      id: e.id,
      collection: "study",
      time: e.startTime || "",
      sortTime: toMinutes(e.startTime) ?? 0,
      title: subject ? subject.name : "পড়াশোনা",
      detail: `${eventMinutes(e)} মিনিট${e.note ? ` · ${e.note}` : ""}`,
      item: e,
    });
  });
  itemsOn(state.work, date).forEach((e) =>
    out.push({
      id: e.id,
      collection: "work",
      time: e.startTime || "",
      sortTime: toMinutes(e.startTime) ?? 0,
      title: e.title || "Smart Madaripur কাজ",
      detail: `${eventMinutes(e)} মিনিট${e.category ? ` · ${e.category}` : ""}`,
      item: e,
    })
  );
  itemsOn(state.exercise, date).forEach((e) =>
    out.push({
      id: e.id,
      collection: "exercise",
      time: e.startTime || "",
      sortTime: toMinutes(e.startTime) ?? 0,
      title: e.type || "ব্যায়াম",
      detail: `${eventMinutes(e)} মিনিট`,
      item: e,
    })
  );
  itemsOn(state.health, date).forEach((e) =>
    out.push({
      id: e.id,
      collection: "health",
      time: e.startTime || "",
      sortTime: toMinutes(e.startTime) ?? 0,
      title: e.kind === "অন্যান্য" ? "স্বাস্থ্য নোট" : "মাথাব্যথা",
      detail: [e.severity ? `তীব্রতা ${e.severity}/১০` : "", e.durationMin ? `${e.durationMin} মিনিট` : ""]
        .filter(Boolean)
        .join(" · "),
      item: e,
    })
  );
  itemsOn(state.weights, date).forEach((e) =>
    out.push({
      id: e.id,
      collection: "weights",
      time: e.time || "",
      sortTime: toMinutes(e.time) ?? 0,
      title: "ওজন",
      detail: `${Number(e.weight)} কেজি`,
      item: e,
    })
  );
  return out.sort((a, b) => a.sortTime - b.sortTime);
}

// ---------- Goals ----------
export function goalProgress(goal, state) {
  if (!goal) return null;
  const end = goal.endDate || todayISO();
  const start = goal.startDate || addDays(end, -29);
  const days = Math.max(1, daysBetween(start, end) + 1);
  const target = num(goal.target);

  if (goal.type === "custom") {
    const current = num(goal.current);
    const pct = target ? Math.max(0, Math.min(1, (current || 0) / target)) : null;
    return { current, target, pct, unit: goal.unit || "", lowerIsBetter: false };
  }

  if (goal.type === "weight") {
    const latest = latestWeight(state.weights, end);
    const base = num(state.profile.startWeight);
    const current = latest ? latest.weight : null;
    let pct = null;
    if (current !== null && target) {
      if (base === null || base === target) {
        pct = current === target ? 1 : 0;
      } else {
        pct = Math.max(0, Math.min(1, (base - current) / (base - target)));
      }
    }
    return { current, target, pct, unit: "কেজি", lowerIsBetter: true };
  }

  if (goal.type === "sleep") {
    const s = sleepSummary(state.sleep, start, end);
    return {
      current: s.avgHrs,
      target,
      pct: s.avgHrs !== null && target ? Math.min(1, s.avgHrs / target) : null,
      unit: "ঘণ্টা",
      lowerIsBetter: false,
    };
  }

  let total = 0;
  if (goal.type === "study") total = sumMinutesInRange(state.study, start, end);
  else if (goal.type === "exercise") total = sumMinutesInRange(state.exercise, start, end);
  else if (goal.type === "work_limit") total = sumMinutesInRange(state.work, start, end);
  else if (goal.type === "water") {
    const glasses = state.water.filter((w) => inRange(w.date, start, end)).reduce((a, w) => a + (num(w.glasses) || 0), 0);
    const current = glasses / days;
    return {
      current,
      target,
      pct: target ? (goal.type === "work_limit" ? (current <= target ? 1 : Math.max(0, target / current)) : Math.min(1, current / target)) : null,
      unit: "গ্লাস/দিন",
      lowerIsBetter: false,
    };
  } else if (goal.type === "habit") {
    const hs = habitSummary(state.habitLogs, state.habits, start, end);
    return {
      current: hs.avgPct === null ? null : hs.avgPct * 100,
      target,
      pct: hs.avgPct !== null && target ? Math.min(1, (hs.avgPct * 100) / target) : null,
      unit: "%",
      lowerIsBetter: false,
    };
  }

  const current = total / days;
  const lowerIsBetter = goal.type === "work_limit";
  const pct = target
    ? lowerIsBetter
      ? current <= target
        ? 1
        : Math.max(0, target / current)
      : Math.min(1, current / target)
    : null;
  return { current, target, pct, unit: "মিনিট/দিন", lowerIsBetter };
}

// ---------- Formatting ----------
export function fmtNum(v, digits = 0, fallback = "তথ্য নেই") {
  if (v === null || v === undefined || v === "" || Number.isNaN(Number(v))) return fallback;
  return Number(v).toFixed(digits);
}

export function fmtPct(v, digits = 0, fallback = "তথ্য নেই") {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return fallback;
  return `${(Number(v) * 100).toFixed(digits)}%`;
}

export function fmtHours(mins, digits = 1) {
  if (mins === null || mins === undefined) return "—";
  return (Number(mins) / 60).toFixed(digits);
}

export function fmtDuration(mins) {
  const n = Math.round(Number(mins) || 0);
  if (n <= 0) return "0 মিনিট";
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h && m) return `${h} ঘণ্টা ${m} মিনিট`;
  if (h) return `${h} ঘণ্টা`;
  return `${m} মিনিট`;
}

export { YES, NO };