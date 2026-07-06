// Accesso al database SQLite. File locale su disco: server/data/4zone.sqlite.
// Usiamo better-sqlite3 perché è sincrono: per un'app personale a bassissimo
// traffico (un PC + un telefono in LAN) non serve altro, e il codice resta
// semplice da leggere.

import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "4zone.sqlite"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    titolo TEXT NOT NULL,
    zona TEXT NOT NULL DEFAULT 'inbox',
    e_progetto INTEGER NOT NULL DEFAULT 0,
    sotto_passi TEXT NOT NULL DEFAULT '[]',
    scadenza TEXT,
    priorita TEXT NOT NULL DEFAULT 'media',
    archiviato INTEGER NOT NULL DEFAULT 0,
    creato_il TEXT NOT NULL,
    completato_il TEXT,
    aggiornato_il TEXT NOT NULL
  );
`);

// riga -> oggetto JS con i tipi giusti (json parse, booleani veri)
function fromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    titolo: row.titolo,
    zona: row.zona,
    eProgetto: !!row.e_progetto,
    sottoPassi: JSON.parse(row.sotto_passi),
    scadenza: row.scadenza,
    priorita: row.priorita,
    archiviato: !!row.archiviato,
    creatoIl: row.creato_il,
    completatoIl: row.completato_il,
    aggiornatoIl: row.aggiornato_il,
  };
}

export function listTasks() {
  const rows = db.prepare(`SELECT * FROM tasks ORDER BY creato_il DESC`).all();
  return rows.map(fromRow);
}

export function getTask(id) {
  const row = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id);
  return fromRow(row);
}

export function createTask(input) {
  const now = new Date().toISOString();
  const task = {
    id: randomUUID(),
    titolo: input.titolo,
    zona: "inbox", // ogni tessera nasce sempre in inbox
    eProgetto: !!input.eProgetto,
    sottoPassi: input.sottoPassi ?? [],
    scadenza: input.scadenza ?? null,
    priorita: input.priorita ?? "media",
    archiviato: false,
    creatoIl: now,
    completatoIl: null,
    aggiornatoIl: now,
  };
  db.prepare(
    `INSERT INTO tasks (id, titolo, zona, e_progetto, sotto_passi, scadenza, priorita, archiviato, creato_il, completato_il, aggiornato_il)
     VALUES (@id, @titolo, @zona, @eProgetto, @sottoPassi, @scadenza, @priorita, @archiviato, @creatoIl, @completatoIl, @aggiornatoIl)`
  ).run({
    ...task,
    eProgetto: task.eProgetto ? 1 : 0,
    sottoPassi: JSON.stringify(task.sottoPassi),
    archiviato: task.archiviato ? 1 : 0,
  });
  return getTask(task.id);
}

// aggiornamento generico dei campi "di contenuto" (non la zona: quella passa
// da moveTaskZone perché richiede la validazione del vincolo dei 3 slot).
// Last-write-wins: sovrascriviamo semplicemente aggiornato_il con "adesso".
export function updateTask(id, patch) {
  const existing = getTask(id);
  if (!existing) return null;

  const merged = {
    titolo: patch.titolo ?? existing.titolo,
    eProgetto: patch.eProgetto ?? existing.eProgetto,
    sottoPassi: patch.sottoPassi ?? existing.sottoPassi,
    scadenza: patch.scadenza !== undefined ? patch.scadenza : existing.scadenza,
    priorita: patch.priorita ?? existing.priorita,
  };

  db.prepare(
    `UPDATE tasks SET titolo = @titolo, e_progetto = @eProgetto, sotto_passi = @sottoPassi,
     scadenza = @scadenza, priorita = @priorita, aggiornato_il = @aggiornatoIl WHERE id = @id`
  ).run({
    id,
    titolo: merged.titolo,
    eProgetto: merged.eProgetto ? 1 : 0,
    sottoPassi: JSON.stringify(merged.sottoPassi),
    scadenza: merged.scadenza,
    priorita: merged.priorita,
    aggiornatoIl: new Date().toISOString(),
  });
  return getTask(id);
}

export function setTaskZona(id, zona) {
  const now = new Date().toISOString();
  const completatoIl = zona === "fatto" ? now : null;
  db.prepare(
    `UPDATE tasks SET zona = @zona, completato_il = COALESCE(completato_il, @completatoIl), aggiornato_il = @now WHERE id = @id`
  ).run({ id, zona, completatoIl, now });
  return getTask(id);
}

export function setArchiviato(id, archiviato) {
  db.prepare(
    `UPDATE tasks SET archiviato = @archiviato, aggiornato_il = @now WHERE id = @id`
  ).run({ id, archiviato: archiviato ? 1 : 0, now: new Date().toISOString() });
  return getTask(id);
}

export function deleteTask(id) {
  db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);
}
