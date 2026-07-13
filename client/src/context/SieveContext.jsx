// Stato globale per "i tre setacci": stesso pattern di TasksContext.jsx
// (fetch iniziale + WebSocket con polling di riserva + coda offline in
// localStorage), ma è un sistema di dati completamente separato — nessuno
// stato condiviso con TasksContext, nessuna tabella in comune lato server.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSettings } from "./SettingsContext";

const CACHE_KEY = "setacci:cache";
const QUEUE_KEY = "setacci:queue";
const POLL_MS = 8000;

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCache(sieveTasks) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(sieveTasks));
}

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function tempId() {
  return "tmp-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const SieveContext = createContext(null);

export function SieveProvider({ children }) {
  const { serverUrl } = useSettings();
  const [sieveTasks, setSieveTasks] = useState(loadCache);
  const [connesso, setConnesso] = useState(false);
  const wsRef = useRef(null);
  const queueRef = useRef(loadQueue());

  const apiUrl = useCallback((path) => `${serverUrl}${path}`, [serverUrl]);

  const applySieveTasks = useCallback((nuove) => {
    setSieveTasks(nuove);
    saveCache(nuove);
  }, []);

  const ricarica = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/sieve-tasks"));
      if (!res.ok) throw new Error("risposta non ok");
      applySieveTasks(await res.json());
    } catch {
      // niente rete: si resta con la cache locale
    }
  }, [apiUrl, applySieveTasks]);

  useEffect(() => {
    ricarica();
  }, [ricarica]);

  useEffect(() => {
    let chiuso = false;
    let retryTimer = null;

    function connetti() {
      if (chiuso) return;
      const wsUrl = serverUrl.replace(/^http/, "ws") + "/ws";
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnesso(true);
        flushQueue();
      };
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "sieve:changed") applySieveTasks(msg.sieveTasks);
        } catch {
          // messaggio non valido, ignorato
        }
      };
      socket.onclose = () => {
        setConnesso(false);
        wsRef.current = null;
        if (!chiuso) retryTimer = setTimeout(connetti, 3000);
      };
      socket.onerror = () => socket.close();
    }

    connetti();
    return () => {
      chiuso = true;
      clearTimeout(retryTimer);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!connesso) ricarica();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [connesso, ricarica]);

  useEffect(() => {
    function onOnline() {
      ricarica();
      flushQueue();
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl]);

  function enqueue(op) {
    queueRef.current = [...queueRef.current, op];
    saveQueue(queueRef.current);
    flushQueue();
  }

  const flushingRef = useRef(false);
  async function flushQueue() {
    if (flushingRef.current) return;
    flushingRef.current = true;
    try {
      const idReali = {};
      while (queueRef.current.length > 0) {
        const op = queueRef.current[0];
        const taskId = op.taskId && idReali[op.taskId] ? idReali[op.taskId] : op.taskId;
        try {
          let res;
          if (op.kind === "create") {
            res = await fetch(apiUrl("/api/sieve-tasks"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(op.payload),
            });
            if (!res.ok) throw new Error("create fallita");
            const creata = await res.json();
            idReali[op.tempId] = creata.id;
          } else if (op.kind === "update") {
            res = await fetch(apiUrl(`/api/sieve-tasks/${taskId}`), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(op.payload),
            });
          } else if (op.kind === "delete") {
            res = await fetch(apiUrl(`/api/sieve-tasks/${taskId}`), { method: "DELETE" });
          }

          if (res && !res.ok && res.status !== 404) {
            throw new Error("richiesta rifiutata dal server");
          }
          queueRef.current = queueRef.current.slice(1);
          saveQueue(queueRef.current);
        } catch {
          break; // problema di rete: ci fermiamo, riproveremo alla prossima occasione
        }
      }
      if (queueRef.current.length === 0) ricarica();
    } finally {
      flushingRef.current = false;
    }
  }

  function creaSieveTask(testo, bucket) {
    const ora = new Date().toISOString();
    const ottimistica = {
      id: tempId(),
      testo,
      bucket,
      done: false,
      creatoIl: ora,
      aggiornatoIl: ora,
    };
    applySieveTasks([ottimistica, ...sieveTasks]);
    enqueue({ kind: "create", tempId: ottimistica.id, payload: { testo, bucket } });
  }

  function aggiornaSieveTask(id, patch) {
    applySieveTasks(sieveTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    enqueue({ kind: "update", taskId: id, payload: patch });
  }

  function eliminaSieveTask(id) {
    applySieveTasks(sieveTasks.filter((t) => t.id !== id));
    enqueue({ kind: "delete", taskId: id });
  }

  const value = {
    sieveTasks,
    connesso,
    creaSieveTask,
    aggiornaSieveTask,
    eliminaSieveTask,
  };

  return <SieveContext.Provider value={value}>{children}</SieveContext.Provider>;
}

export function useSieve() {
  const ctx = useContext(SieveContext);
  if (!ctx) throw new Error("useSieve va usato dentro <SieveProvider>");
  return ctx;
}
