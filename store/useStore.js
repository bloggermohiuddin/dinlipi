import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
  DEFAULT_SUBJECTS,
  DEFAULT_HABITS,
  DEFAULT_ROUTINE,
  DEFAULT_REMINDERS,
} from "../lib/defaultData";

export const STORAGE_KEY = "life-tracker-v2";

export const COLLECTIONS = [
  "sleep",
  "meals",
  "water",
  "study",
  "work",
  "exercise",
  "health",
  "weights",
  "subjects",
  "habits",
  "chapters",
  "routine",
  "goals",
];

let counter = 0;
export function makeId(prefix = "ev") {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

function clone(list) {
  return (list || []).map((x) => ({ ...x }));
}

export function freshState() {
  return {
    profile: { ...DEFAULT_PROFILE },
    settings: { ...DEFAULT_SETTINGS },
    reminders: { ...DEFAULT_REMINDERS },
    subjects: clone(DEFAULT_SUBJECTS),
    habits: clone(DEFAULT_HABITS),
    chapters: [],
    routine: clone(DEFAULT_ROUTINE),
    goals: [],
    sleep: [],
    meals: [],
    water: [],
    study: [],
    work: [],
    exercise: [],
    health: [],
    weights: [],
    habitLogs: {},
    routineLogs: {},
    reflections: {},
    ui: { quickAdd: null },
  };
}

function mergeImported(obj) {
  const fresh = freshState();
  if (!obj || typeof obj !== "object") return fresh;
  const data = obj.data && typeof obj.data === "object" ? obj.data : obj;
  const merged = { ...fresh };

  COLLECTIONS.forEach((key) => {
    if (Array.isArray(data[key])) merged[key] = data[key].map((x) => ({ ...x }));
  });

  if (data.profile && typeof data.profile === "object") merged.profile = { ...fresh.profile, ...data.profile };
  if (data.settings && typeof data.settings === "object") merged.settings = { ...fresh.settings, ...data.settings };
  if (data.reminders && typeof data.reminders === "object") merged.reminders = { ...fresh.reminders, ...data.reminders };
  if (data.habitLogs && typeof data.habitLogs === "object") merged.habitLogs = data.habitLogs;
  if (data.routineLogs && typeof data.routineLogs === "object") merged.routineLogs = data.routineLogs;
  if (data.reflections && typeof data.reflections === "object") merged.reflections = data.reflections;

  // A backup older than a habit/subject rename may reference missing ids, that is fine:
  // the UI falls back to a placeholder label.
  return merged;
}

export const useStore = create(
  persist(
    (set) => ({
      ...freshState(),

      // ---------- Generic CRUD ----------
      addItem: (collection, item) =>
        set((state) => {
          if (!COLLECTIONS.includes(collection)) return {};
          const row = { ...item, id: item && item.id ? item.id : makeId(collection) };
          return { [collection]: [...state[collection], row] };
        }),

      updateItem: (collection, id, patch) =>
        set((state) => {
          if (!COLLECTIONS.includes(collection)) return {};
          return {
            [collection]: state[collection].map((row) => (row.id === id ? { ...row, ...patch } : row)),
          };
        }),

      removeItem: (collection, id) =>
        set((state) => {
          if (!COLLECTIONS.includes(collection)) return {};
          return { [collection]: state[collection].filter((row) => row.id !== id) };
        }),

      // Convenience for form inputs that pass a single field.
      setItemField: (collection, id, field, value) =>
        set((state) => {
          if (!COLLECTIONS.includes(collection)) return {};
          return {
            [collection]: state[collection].map((row) => (row.id === id ? { ...row, [field]: value } : row)),
          };
        }),

      // ---------- Habits / routine daily logs ----------
      setHabitLog: (date, habitId, value) =>
        set((state) => {
          const day = { ...(state.habitLogs[date] || {}) };
          if (value === "") delete day[habitId];
          else day[habitId] = value;
          return { habitLogs: { ...state.habitLogs, [date]: day } };
        }),

      setRoutineLog: (date, itemId, value) =>
        set((state) => {
          const day = { ...(state.routineLogs[date] || {}) };
          if (value === "") delete day[itemId];
          else day[itemId] = value;
          return { routineLogs: { ...state.routineLogs, [date]: day } };
        }),

      clearRoutineLog: (date) =>
        set((state) => {
          const next = { ...state.routineLogs };
          delete next[date];
          return { routineLogs: next };
        }),

      setReflection: (weekStart, field, value) =>
        set((state) => ({
          reflections: {
            ...state.reflections,
            [weekStart]: { ...(state.reflections[weekStart] || {}), [field]: value },
          },
        })),

      // ---------- Profile / settings ----------
      updateProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      updateReminders: (patch) => set((state) => ({ reminders: { ...state.reminders, ...patch } })),

      // ---------- Quick add ----------
      openQuickAdd: (category) => set((state) => ({ ui: { ...state.ui, quickAdd: category || "menu" } })),
      closeQuickAdd: () => set((state) => ({ ui: { ...state.ui, quickAdd: null } })),

      // ---------- Data management ----------
      importState: (obj) => set(() => mergeImported(obj)),
      resetAll: () => set(freshState()),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : undefined)),
      partialize: (state) => {
        const out = {};
        Object.keys(state).forEach((key) => {
          if (key === "ui") return;
          if (typeof state[key] === "function") return;
          out[key] = state[key];
        });
        return out;
      },
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== "object") return current;
        // The food inventory module was removed; drop its old records on load.
        const { foodItems, ...rest } = persisted;
        return { ...current, ...rest, ui: { quickAdd: null } };
      },
    }
  )
);