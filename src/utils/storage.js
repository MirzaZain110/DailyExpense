/**
 * Simple "backend" for the app.
 * Instead of a server + database, everything is saved as plain .txt files
 * on the device using expo-file-system:
 *
 *   projects.txt          -> list of all projects
 *   entries_<projectId>.txt -> list of income/expense entries for a project
 *
 * Each file just contains JSON text, but is saved with a .txt extension
 * as requested. You can open these files with any text editor if you
 * export them from the device.
 */
import * as FileSystem from 'expo-file-system/legacy';

const DIR = FileSystem.documentDirectory;
const PROJECTS_FILE = `${DIR}projects.txt`;
const LANGUAGE_FILE = `${DIR}language.txt`;
const NOTIFICATION_SETTINGS_FILE = `${DIR}notification_settings.txt`;
const DEFAULT_NOTIFICATION_SETTINGS = { enabled: false, hour: 12, minute: 0 };

const entriesFilePath = (projectId) => `${DIR}entries_${projectId}.txt`;
const tourFilePath = (key) => `${DIR}tour_${key}.txt`;

function makeId() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

async function ensureFile(path, defaultContent) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.writeAsStringAsync(path, defaultContent);
  }
}

async function readJsonFile(path) {
  await ensureFile(path, '[]');
  try {
    const content = await FileSystem.readAsStringAsync(path);
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

async function writeJsonFile(path, data) {
  await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
}

/* ---------------- Projects ---------------- */

export async function getProjects() {
  const projects = await readJsonFile(PROJECTS_FILE);
  // newest first
  return [...projects].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function addProject(name) {
  const projects = await readJsonFile(PROJECTS_FILE);
  const newProject = {
    id: makeId(),
    name,
    createdAt: new Date().toISOString(),
  };
  projects.push(newProject);
  await writeJsonFile(PROJECTS_FILE, projects);
  return newProject;
}

export async function deleteProject(projectId) {
  const projects = await readJsonFile(PROJECTS_FILE);
  const filtered = projects.filter((p) => p.id !== projectId);
  await writeJsonFile(PROJECTS_FILE, filtered);

  const file = entriesFilePath(projectId);
  const info = await FileSystem.getInfoAsync(file);
  if (info.exists) {
    await FileSystem.deleteAsync(file);
  }
}

/* ---------------- Entries (income / expense) ---------------- */

export async function getEntries(projectId) {
  const entries = await readJsonFile(entriesFilePath(projectId));
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function addEntry(projectId, entry) {
  const entries = await readJsonFile(entriesFilePath(projectId));
  const newEntry = {
    id: makeId(),
    type: entry.type, // 'income' | 'expense'
    amount: entry.amount,
    person: entry.person || '',
    note: entry.note || '',
    date: entry.date || new Date().toISOString(),
  };
  entries.push(newEntry);
  await writeJsonFile(entriesFilePath(projectId), entries);
  return newEntry;
}

/**
 * Update an existing entry (used when the user fixes a mistake after
 * saving — wrong amount, wrong person, typo in the note, etc.).
 * Only the fields passed in `updatedFields` are changed; everything
 * else on the original entry (including its id and original date,
 * unless you pass a new one) is kept.
 */
export async function updateEntry(projectId, entryId, updatedFields) {
  const entries = await readJsonFile(entriesFilePath(projectId));
  const index = entries.findIndex((e) => e.id === entryId);
  if (index === -1) return null;

  const updatedEntry = {
    ...entries[index],
    ...updatedFields,
    id: entries[index].id, // id never changes
  };
  entries[index] = updatedEntry;
  await writeJsonFile(entriesFilePath(projectId), entries);
  return updatedEntry;
}

export async function deleteEntry(projectId, entryId) {
  const entries = await readJsonFile(entriesFilePath(projectId));
  const filtered = entries.filter((e) => e.id !== entryId);
  await writeJsonFile(entriesFilePath(projectId), filtered);
}

/* ---------------- Language preference ---------------- */

export async function getLanguage() {
  const info = await FileSystem.getInfoAsync(LANGUAGE_FILE);
  if (!info.exists) return null;
  try {
    const content = await FileSystem.readAsStringAsync(LANGUAGE_FILE);
    return content.trim() || null;
  } catch (e) {
    return null;
  }
}

export async function saveLanguage(lang) {
  await FileSystem.writeAsStringAsync(LANGUAGE_FILE, lang);
}

/* ---------------- Daily reminder notification settings ---------------- */
// Shape: { enabled: boolean, hour: number (0-23), minute: number (0-59) }
// Defaults to disabled, 12:00 PM.

export async function getNotificationSettings() {
  const info = await FileSystem.getInfoAsync(NOTIFICATION_SETTINGS_FILE);
  if (!info.exists) return { ...DEFAULT_NOTIFICATION_SETTINGS };
  try {
    const content = await FileSystem.readAsStringAsync(NOTIFICATION_SETTINGS_FILE);
    const parsed = JSON.parse(content);
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
  } catch (e) {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export async function saveNotificationSettings(settings) {
  await FileSystem.writeAsStringAsync(NOTIFICATION_SETTINGS_FILE, JSON.stringify(settings));
}

/* ---------------- Feature tour tracking ---------------- */
// Generic "has this popup tour been seen" flag, keyed by an arbitrary
// string (e.g. "dashboard", "project") so each screen's tour is
// tracked independently and only ever shown once.

export async function isTourSeen(key) {
  const info = await FileSystem.getInfoAsync(tourFilePath(key));
  return info.exists;
}

export async function markTourSeen(key) {
  await FileSystem.writeAsStringAsync(tourFilePath(key), 'true');
}

/** Clears a tour's "seen" flag so it will show again — used by the
 * "Take the tour again" button in Settings. */
export async function resetTour(key) {
  const path = tourFilePath(key);
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path);
  }
}