// API REST per le tessere. Router Express montato su /api/tasks.

import { Router } from "express";
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  setTaskZona,
  setArchiviato,
  deleteTask,
} from "../db.js";
import { canMoveToZone, ZONES } from "../zoneRules.js";

export function tasksRouter(broadcast) {
  const router = Router();

  // notifica tutti i client connessi (WebSocket) che i dati sono cambiati
  function notify() {
    broadcast({ type: "tasks:changed", tasks: listTasks() });
  }

  router.get("/", (req, res) => {
    res.json(listTasks());
  });

  router.get("/:id", (req, res) => {
    const task = getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "tessera non trovata" });
    res.json(task);
  });

  router.post("/", (req, res) => {
    const { titolo } = req.body;
    if (!titolo || !titolo.trim()) {
      return res.status(400).json({ error: "il titolo è obbligatorio" });
    }
    const task = createTask(req.body);
    notify();
    res.status(201).json(task);
  });

  // aggiornamento contenuto (titolo, sotto-passi, scadenza, priorità...).
  // NON gestisce il cambio di zona: per quello vedi PATCH /:id/zona
  router.patch("/:id", (req, res) => {
    const task = getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "tessera non trovata" });
    const updated = updateTask(req.params.id, req.body);
    notify();
    res.json(updated);
  });

  // spostamento di zona: qui vive il vincolo centrale dell'app.
  router.patch("/:id/zona", (req, res) => {
    const task = getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "tessera non trovata" });

    const { zona } = req.body;
    if (!ZONES.includes(zona)) {
      return res.status(400).json({ error: `zona non valida: ${zona}` });
    }

    const allTasks = listTasks().filter((t) => !t.archiviato);
    const check = canMoveToZone(task, zona, allTasks);
    if (!check.ok) {
      return res.status(409).json({ error: check.reason });
    }

    const updated = setTaskZona(req.params.id, zona);
    notify();
    res.json(updated);
  });

  router.patch("/:id/archivio", (req, res) => {
    const task = getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "tessera non trovata" });
    const updated = setArchiviato(req.params.id, req.body.archiviato ?? true);
    notify();
    res.json(updated);
  });

  router.delete("/:id", (req, res) => {
    const task = getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "tessera non trovata" });
    deleteTask(req.params.id);
    notify();
    res.status(204).end();
  });

  return router;
}
