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
import * as FileSystem from 'expo-file-system';

const DIR = FileSystem.documentDirectory;
const PROJECTS_FILE = `${DIR}projects.txt`;

const entriesFilePath = (projectId) => `${DIR}entries_${projectId}.txt`;

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