// Stato globale delle tessere: carica i dati dal server, li tiene sincronizzati
// via WebSocket (con polling di riserva se il socket cade) e permette di
// lavorare anche offline mettendo in coda le modifiche in localStorage,
// per poi rispedirle al server quando torna la connessione.
//
// Conflitti: nessuna gestione sofisticata. "Last write wins": l'ultima
// scrittura che arriva al server sovrascrive aggiornato_il e vince.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSettings } from "./SettingsContext";
import { canMoveToZone } from "../zoneRules";

const CACHE_KEY = "4zone:cache";
const QUEUE_KEY = "4zone:queue";
const TENTATIVI_KEY = "4zone:tentativiBloccati";
const POLL_MS = 8000;

// registra (per il Report settimanale) ogni volta che si prova a superare il
// limite delle 3 tessere "in corso": tenuto lato client, con localStorage,
// perché è solo una statistica di comodo e non un dato che deve sincronizzarsi.
function registraTentativoBloccato() {
  try {
    const lista = JSON.parse(localStorage.getItem(TENTATIVI_KEY) || "[]");
    lista.push(new Date().toISOString());
    const unMeseFa = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const filtrata = lista.filter((iso) => new Date(iso).getTime() >= unMeseFa);
    localStorage.setItem(TENTATIVI_KEY, JSON.stringify(filtrata));
  } catch {
    // localStorage non disponibile: statistica persa, non è critico
  }
}

export function leggiTentativiBloccati() {
  try {
    return JSON.parse(localStorage.getItem(TENTATIVI_KEY) || "[]");
  } catch {
    return [];
  }
}

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCache(tasks) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(tasks));
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

const TasksContext = createContext(null);

export function TasksProvider({ children }) {
  const { serverUrl } = useSettings();
  const [tasks, setTasks] = useState(loadCache);
  const [connesso, setConnesso] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [inCoda, setInCoda] = useState(() => loadQueue().length);
  const wsRef = useRef(null);
  const queueRef = useRef(loadQueue());
  const flushingRef = useRef(false);

  const apiUrl = useCallback((path) => `${serverUrl}${path}`, [serverUrl]);

  const applyTasks = useCallback((nuove) => {
    setTasks(nuove);
    saveCache(nuove);
  }, []);

  // --- caricamento iniziale + polling di riserva -----------------------
  const ricarica = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/tasks"));
      if (!res.ok) throw new Error("risposta non ok");
      const data = await res.json();
      applyTasks(data);
      setOnline(true);
    } catch {
      setOnline(false); // niente rete: si resta con la cache locale
    }
  }, [apiUrl, applyTasks]);

  useEffect(() => {
    ricarica();
  }, [ricarica]);

  // --- WebSocket per gli aggiornamenti in tempo reale -------------------
  useEffect(() => {
    let chiuso = false;
    let retryTimer = null;

    function connetti() {
      if (chiuso) return;
      let wsUrl;
      try {
        wsUrl = serverUrl.replace(/^http/, "ws") + "/ws";
      } catch {
        return;
      }
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnesso(true);
        setOnline(true);
        flushQueue();
      };
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "tasks:changed") {
            applyTasks(msg.tasks);
            setOnline(true);
          }
        } catch {
          // messaggio non valido, ignorato
        }
      };
      socket.onclose = () => {
        setConnesso(false);
        wsRef.current = null;
        if (!chiuso) retryTimer = setTimeout(connetti, 3000);
      };
      socket.onerror = () => {
        socket.close();
      };
    }

    connetti();
    return () => {
      chiuso = true;
      clearTimeout(retryTimer);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl]);

  // polling di riserva: utile se il WebSocket è bloccato da qualche proxy
  useEffect(() => {
    const interval = setInterval(() => {
      if (!connesso) ricarica();
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [connesso, ricarica]);

  // rileva quando il telefono torna online (evento del browser)
  useEffect(() => {
    function onOnline() {
      setOnline(true);
      ricarica();
      flushQueue();
    }
    function onOffline() {
      setOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl]);

  // --- coda offline -------------------------------------------------------
  function enqueue(op) {
    queueRef.current = [...queueRef.current, op];
    saveQueue(queueRef.current);
    setInCoda(queueRef.current.length);
    flushQueue();
  }

  async function flushQueue() {
    if (flushingRef.current) return;
    flushingRef.current = true;
    try {
      // mappa temporanea: id provvisori (creati offline) -> id reali assegnati dal server
      const idReali = {};
      while (queueRef.current.length > 0) {
        const op = queueRef.current[0];
        const taskId = op.taskId && idReali[op.taskId] ? idReali[op.taskId] : op.taskId;
        try {
          let res;
          if (op.kind === "create") {
            res = await fetch(apiUrl("/api/tasks"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(op.payload),
            });
            if (!res.ok) throw new Error("create fallita");
            const creata = await res.json();
            idReali[op.tempId] = creata.id;
          } else if (op.kind === "update") {
            res = await fetch(apiUrl(`/api/tasks/${taskId}`), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(op.payload),
            });
          } else if (op.kind === "zona") {
            res = await fetch(apiUrl(`/api/tasks/${taskId}/zona`), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(op.payload),
            });
          } else if (op.kind === "archivio") {
            res = await fetch(apiUrl(`/api/tasks/${taskId}/archivio`), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(op.payload),
            });
          } else if (op.kind === "delete") {
            res = await fetch(apiUrl(`/api/tasks/${taskId}`), { method: "DELETE" });
          }

          if (res && !res.ok && res.status !== 409 && res.status !== 404) {
            throw new Error("richiesta rifiutata dal server");
          }
          // 409/404: l'operazione non è più valida (es. vincolo violato nel
          // frattempo, o tessera già cancellata altrove): la scartiamo e
          // andiamo avanti invece di bloccare tutta la coda.
          queueRef.current = queueRef.current.slice(1);
          saveQueue(queueRef.current);
          setInCoda(queueRef.current.length);
        } catch {
          // problema di rete: ci fermiamo, riproveremo alla prossima occasione
          setOnline(false);
          break;
        }
      }
      if (queueRef.current.length === 0) {
        ricarica();
      }
    } finally {
      flushingRef.current = false;
    }
  }

  // --- azioni esposte ai componenti --------------------------------------

  function creaTessera(input) {
    const ora = new Date().toISOString();
    const ottimistica = {
      id: tempId(),
      titolo: input.titolo,
      zona: "inbox",
      eProgetto: !!input.eProgetto,
      sottoPassi: input.sottoPassi ?? [],
      scadenza: input.scadenza ?? null,
      priorita: input.priorita ?? "media",
      archiviato: false,
      creatoIl: ora,
      completatoIl: null,
      aggiornatoIl: ora,
    };
    applyTasks([ottimistica, ...tasks]);
    enqueue({ kind: "create", tempId: ottimistica.id, payload: input });
  }

  function aggiornaTessera(id, patch) {
    applyTasks(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    enqueue({ kind: "update", taskId: id, payload: patch });
  }

  // sposta di zona rispettando il vincolo; ritorna {ok, reason}
  function spostaZona(id, zona) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return { ok: false, reason: "tessera non trovata" };
    const check = canMoveToZone(task, zona, tasks.filter((t) => !t.archiviato));
    if (!check.ok) {
      if (zona === "in_corso") registraTentativoBloccato();
      return check;
    }

    const ora = new Date().toISOString();
    applyTasks(
      tasks.map((t) =>
        t.id === id
          ? { ...t, zona, completatoIl: zona === "fatto" ? t.completatoIl ?? ora : t.completatoIl }
          : t
      )
    );
    enqueue({ kind: "zona", taskId: id, payload: { zona } });
    return { ok: true };
  }

  function archivia(id, archiviato = true) {
    applyTasks(tasks.map((t) => (t.id === id ? { ...t, archiviato } : t)));
    enqueue({ kind: "archivio", taskId: id, payload: { archiviato } });
  }

  function eliminaTessera(id) {
    applyTasks(tasks.filter((t) => t.id !== id));
    enqueue({ kind: "delete", taskId: id });
  }

  const value = {
    tasks,
    online,
    connesso,
    inCoda,
    ricarica,
    creaTessera,
    aggiornaTessera,
    spostaZona,
    archivia,
    eliminaTessera,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks va usato dentro <TasksProvider>");
  return ctx;
}
