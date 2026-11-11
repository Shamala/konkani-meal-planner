/**
 * Device storage (ARCHITECTURE.md 2.4, 4): three object stores. The recipe corpus is NOT
 * here; it ships in the bundle and is never written at runtime.
 */
import Dexie, { type EntityTable } from 'dexie';
import { DEFAULT_SETTINGS, type ServingHistory, type ServingRecord, type Settings, type Week } from '../model/types';

type HistoryRow = ServingRecord & { id: string };
type SettingsRow = { key: 'settings'; value: Settings };

export class PlannerDB extends Dexie {
  servingHistory!: EntityTable<HistoryRow, 'id'>;
  weeks!: EntityTable<Week, 'weekStart'>;
  settings!: EntityTable<SettingsRow, 'key'>;

  constructor(name = 'konkani-meal-planner') {
    super(name);
    this.version(1).stores({
      servingHistory: 'id', // recipe or snack id
      weeks: 'weekStart', // ISO date of the Monday
      settings: 'key', // fixed key
    });
  }
}

export async function loadHistory(db: PlannerDB): Promise<ServingHistory> {
  const rows = await db.servingHistory.toArray();
  return Object.fromEntries(rows.map(({ id, lastServed, timesServed }) => [id, { lastServed, timesServed }]));
}

export async function saveHistory(db: PlannerDB, history: ServingHistory): Promise<void> {
  await db.servingHistory.bulkPut(Object.entries(history).map(([id, r]) => ({ id, ...r })));
}

export async function loadWeeks(db: PlannerDB): Promise<Week[]> {
  return db.weeks.orderBy('weekStart').toArray();
}

export async function putWeeks(db: PlannerDB, weeks: Week[]): Promise<void> {
  if (weeks.length) await db.weeks.bulkPut(weeks);
}

export async function loadSettings(db: PlannerDB): Promise<Settings> {
  const row = await db.settings.get('settings');
  // Merge over defaults so a settings row written by an older build still has every field.
  return {
    ...DEFAULT_SETTINGS,
    ...row?.value,
    repeatWindows: { ...DEFAULT_SETTINGS.repeatWindows, ...row?.value.repeatWindows },
  };
}

export async function saveSettings(db: PlannerDB, settings: Settings): Promise<void> {
  await db.settings.put({ key: 'settings', value: settings });
}

/** Cheap insurance for the one store worth protecting (ARCHITECTURE.md 4). */
export async function exportHistory(db: PlannerDB): Promise<string> {
  return JSON.stringify(await loadHistory(db));
}

export async function importHistory(db: PlannerDB, json: string): Promise<void> {
  await saveHistory(db, JSON.parse(json) as ServingHistory);
}
