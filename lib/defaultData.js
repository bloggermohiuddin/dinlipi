export const YES = "হ্যাঁ";
export const NO = "না";

export const MEAL_TYPES = ["সকালের নাশতা", "দুপুরের খাবার", "রাতের খাবার", "নাশতা"];
export const MEAL_ICONS = {
  "সকালের নাশতা": "sunrise",
  "দুপুরের খাবার": "sun",
  "রাতের খাবার": "moon",
  নাশতা: "cookie",
};

export const WORK_CATEGORIES = ["ডেভেলপমেন্ট", "ডিজাইন", "মিটিং", "কনটেন্ট", "অন্যান্য"];
export const EXERCISE_TYPES = ["হাঁটা", "হালকা ব্যায়াম", "স্ট্রেচিং", "অন্যান্য"];
export const HEADACHE_LOCATIONS = ["কপাল", "পুরো মাথা", "মাথার এক পাশ", "ঘাড়/পেছন", "অন্যান্য"];
export const ROUTINE_CATEGORIES = ["ঘুম", "খাবার", "পড়াশোনা", "কাজ", "ব্যায়াম", "বিশ্রাম", "অন্যান্য"];


export const DEFAULT_PROFILE = {
  name: "",
  age: "",
  height: "",
  startWeight: "",
  targetWeight: "",
};

export const DEFAULT_REMINDERS = {
  enabled: false,
  intervalHours: 3,
  quietStart: "22:00",
  quietEnd: "07:00",
  customTexts: [],
};

export const DEFAULT_SETTINGS = {
  theme: "dark",
  sleepTargetHrs: 7.5,
  studyTargetMin: 150,
  workLimitMin: 120,
  waterTarget: 8,
  exerciseTargetMin: 30,
  habitTargetPct: 80,
  weekStartsOn: 0,
};

export const DEFAULT_SUBJECTS = [
  { id: "sub_logic", name: "যুক্তিবিদ্যা" },
  { id: "sub_civics", name: "পৌরনীতি" },
  { id: "sub_other", name: "অন্যান্য মানবিক বিষয়" },
  { id: "sub_revision", name: "রিভিশন" },
  { id: "sub_practice", name: "অনুশীলন ও লিখন" },
];

export const DEFAULT_HABITS = [
  { id: "hab_wake", name: "সময়মতো ঘুম থেকে ওঠা" },
  { id: "hab_breakfast", name: "সকালের নাশতা খাওয়া" },
  { id: "hab_lunch", name: "দুপুরের খাবার খাওয়া" },
  { id: "hab_dinner", name: "রাতের খাবার খাওয়া" },
  { id: "hab_water", name: "পর্যাপ্ত পানি পান" },
  { id: "hab_fruit", name: "ফল খাওয়া" },
  { id: "hab_veg", name: "সবজি খাওয়া" },
  { id: "hab_logic", name: "যুক্তিবিদ্যা পড়া" },
  { id: "hab_civics", name: "পৌরনীতি পড়া" },
  { id: "hab_revision", name: "রিভিশন করা" },
  { id: "hab_walk", name: "হাঁটাহাঁটি করা" },
  { id: "hab_exercise", name: "ব্যায়াম করা" },
  { id: "hab_sleep_ontime", name: "সময়মতো ঘুমাতে যাওয়া" },
];

export const DEFAULT_ROUTINE = [
  { id: "rt_wake", startTime: "07:30", endTime: "08:00", activity: "ঘুম থেকে ওঠা ও সকালের প্রস্তুতি", category: "ঘুম" },
  { id: "rt_breakfast", startTime: "08:00", endTime: "08:30", activity: "সকালের নাশতা", category: "খাবার" },
  { id: "rt_walk_am", startTime: "08:30", endTime: "09:00", activity: "হালকা হাঁটাহাঁটি", category: "ব্যায়াম" },
  { id: "rt_logic", startTime: "09:00", endTime: "10:00", activity: "যুক্তিবিদ্যা", category: "পড়াশোনা" },
  { id: "rt_civics", startTime: "10:15", endTime: "11:15", activity: "পৌরনীতি", category: "পড়াশোনা" },
  { id: "rt_revision", startTime: "11:15", endTime: "12:00", activity: "রিভিশন ও অন্যান্য বিষয়", category: "পড়াশোনা" },
  { id: "rt_lunch", startTime: "13:00", endTime: "14:00", activity: "দুপুরের খাবার ও বিশ্রাম", category: "খাবার" },
  { id: "rt_work_1", startTime: "14:00", endTime: "15:00", activity: "Smart Madaripur কাজ", category: "কাজ" },
  { id: "rt_work_2", startTime: "15:00", endTime: "16:00", activity: "Smart Madaripur / প্রজেক্ট কাজ", category: "কাজ" },
  { id: "rt_break", startTime: "16:00", endTime: "17:00", activity: "বিরতি ও ব্যক্তিগত সময়", category: "বিশ্রাম" },
  { id: "rt_walk_pm", startTime: "17:00", endTime: "17:30", activity: "হাঁটা বা হালকা ব্যায়াম", category: "ব্যায়াম" },
  { id: "rt_study_pm", startTime: "18:00", endTime: "19:00", activity: "পড়াশোনা ও অনুশীলন", category: "পড়াশোনা" },
  { id: "rt_dinner", startTime: "19:30", endTime: "20:30", activity: "রাতের খাবার ও পারিবারিক সময়", category: "খাবার" },
  { id: "rt_plan", startTime: "21:00", endTime: "21:30", activity: "রিভিশন ও পরদিনের পরিকল্পনা", category: "পড়াশোনা" },
  { id: "rt_sleep", startTime: "22:30", endTime: "23:59", activity: "ঘুমের প্রস্তুতি", category: "ঘুম" },
];



export function blankEventDefaults() {
  return {
    date: "",
    startTime: "",
    endTime: "",
    minutes: "",
    note: "",
  };
}