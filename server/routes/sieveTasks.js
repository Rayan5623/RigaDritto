// API REST per "i tre setacci". Router Express montato su /api/sieve-tasks.
// Sistema di dati separato dalle tessere delle 4 zone: stesso pattern
// (router factory + broadcast via WebSocket dopo ogni mutazione), ma
// tabella, forma dei dati e nessuna relazione con /api/tasks.

import { Router } from "express";
import {
  listSieveTasks,
  getSieveTask,
  createSieveTask,
  updateSieveTask,
  deleteSieveTask,
} from "../db.js";
import { SIEVE_BUCKETS } from "../sieveRules.js";

export function sieveTasksRouter(broadcast) {
  const router = Router();

  function notify() {
    broadcast({ type: "sieve:changed", sieveTasks: listSieveTasks() });
  }

  router.get("/", (req, res) => {
    res.json(listSieveTasks());
  });

  router.post("/", (req, res) => {
    const { testo, bucket } = req.body;
    if (!testo || !testo.trim()) {
      return res.status(400).json({ error: "il testo è obbligatorio" });
    }
    if (bucket && !SIEVE_BUCKETS.includes(bucket)) {
      return res.status(400).json({ error: `bucket non valido: ${bucket}` });
    }
    const task = createSieveTask({ testo: testo.trim(), bucket: bucket || "POI" });
    notify();
    res.status(201).json(task);
  });

  router.patch("/:id", (req, res) => {
    const task = getSieveTask(req.params.id);
    if (!task) return res.status(404).json({ error: "task non trovato" });

    const { bucket } = req.body;
    if (bucket && !SIEVE_BUCKETS.includes(bucket)) {
      return res.status(400).json({ error: `bucket non valido: ${bucket}` });
    }

    const updated = updateSieveTask(req.params.id, req.body);
    notify();
    res.json(updated);
  });

  router.delete("/:id", (req, res) => {
    const task = getSieveTask(req.params.id);
    if (!task) return res.status(404).json({ error: "task non trovato" });
    deleteSieveTask(req.params.id);
    notify();
    res.status(204).end();
  });

  return router;
}
