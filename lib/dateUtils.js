export const BANGLA_WEEKDAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
export const BANGLA_WEEKDAYS_FULL = [
  "রবিবার",
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
];

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export function toBanglaDigits(n) {
  return String(n).replace(/[0-9]/g, (d) => BN_DIGITS[+d]);
}

export function parseISODate(s) {
  if (!s) return null;
  const [y, m, d] = String(s).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso, n) {
  const d = parseISODate(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function todayISO() {
  return toISODate(new Date());
}

export function weekdayBangla(iso) {
  const d = parseISODate(iso);
  if (!d) return "";
  return BANGLA_WEEKDAYS[d.getDay()];
}

export function weekdayFullBangla(iso) {
  const d = parseISODate(iso);
  if (!d) return "";
  return BANGLA_WEEKDAYS_FULL[d.getDay()];
}

const MONTHS_SHORT = ["জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন", "জুলা", "আগ", "সেপ্টে", "অক্টো", "নভে", "ডিসে"];
const MONTHS_FULL = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

export function formatDateShort(iso) {
  const d = parseISODate(iso);
  if (!d) return "";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function formatDateFull(iso) {
  const d = parseISODate(iso);
  if (!d) return "";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMonthYear(year, monthIndex) {
  return `${MONTHS_FULL[monthIndex]} ${year}`;
}

export function monthName(monthIndex) {
  return MONTHS_FULL[monthIndex];
}

export function dateRange(startIso, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(addDays(startIso, i));
  return out;
}

export function lastNDates(n, endIso = todayISO()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(endIso, -i));
  return out;
}

export function compareISO(a, b) {
  if (!a || !b) return 0;
  return a < b ? -1 : a > b ? 1 : 0;
}

export function inRange(iso, startIso, endIso) {
  return !!iso && iso >= startIso && iso <= endIso;
}

// Week starts on Sunday (Bangladesh practice).
export function weekStartOf(iso) {
  const d = parseISODate(iso);
  if (!d) return iso;
  d.setDate(d.getDate() - d.getDay());
  return toISODate(d);
}

export function weekEndOf(iso) {
  return addDays(weekStartOf(iso), 6);
}

export function monthStartOf(iso) {
  const d = parseISODate(iso);
  if (!d) return iso;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function monthEndOf(iso) {
  const d = parseISODate(iso);
  if (!d) return iso;
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return toISODate(last);
}

export function monthMatrix(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(`${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function relativeDayLabel(iso) {
  const today = todayISO();
  if (iso === today) return "আজ";
  if (iso === addDays(today, -1)) return "গতকাল";
  if (iso === addDays(today, 1)) return "আগামীকাল";
  return formatDateFull(iso);
}

export function daysBetween(startIso, endIso) {
  const a = parseISODate(startIso);
  const b = parseISODate(endIso);
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000);
}