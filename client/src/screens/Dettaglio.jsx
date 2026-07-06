import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTasks } from "../context/TasksContext.jsx";
import { ZONE_ORDER, ZONES } from "../zoneRules.js";

const ETICHETTA_ZONA = {
  inbox: "inbox",
  oggi: "oggi",
  in_corso: "in corso",
  fatto: "fatto",
};

const ETICHETTA_PRIORITA = { alta: "alta", media: "media", bassa: "bassa" };

export default function Dettaglio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, aggiornaTessera, spostaZona, eliminaTessera } = useTasks();
  const [nuovoPasso, setNuovoPasso] = useState("");
  const [avviso, setAvviso] = useState(null);

  const tessera = tasks.find((t) => t.id === id);

  if (!tessera) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center text-gray-400">
        <p>tessera non trovata.</p>
        <button onClick={() => navigate("/")} className="mt-3 text-sm underline">
          torna alle zone
        </button>
      </div>
    );
  }

  const prossimeZone = ZONES.filter((z) => ZONE_ORDER[z] > ZONE_ORDER[tessera.zona]);

  function muovi(zona) {
    const esito = spostaZona(tessera.id, zona);
    if (!esito.ok) {
      setAvviso(esito.reason);
      setTimeout(() => setAvviso(null), 3500);
    }
  }

  function aggiungiPasso(e) {
    e.preventDefault();
    const testo = nuovoPasso.trim();
    if (!testo) return;
    const sottoPassi = [
      ...tessera.sottoPassi,
      { id: crypto.randomUUID(), testo, completato: false },
    ];
    aggiornaTessera(tessera.id, { sottoPassi });
    setNuovoPasso("");
  }

  function toggliPasso(passoId) {
    const sottoPassi = tessera.sottoPassi.map((p) =>
      p.id === passoId ? { ...p, completato: !p.completato } : p
    );
    aggiornaTessera(tessera.id, { sottoPassi });
  }

  function rimuoviPasso(passoId) {
    aggiornaTessera(tessera.id, {
      sottoPassi: tessera.sottoPassi.filter((p) => p.id !== passoId),
    });
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-400 mb-3">
        ← indietro
      </button>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          {ETICHETTA_ZONA[tessera.zona]}
        </span>
        {tessera.eProgetto && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            progetto
          </span>
        )}
      </div>

      <label className="text-xs text-gray-400 dark:text-gray-600">
        prossima azione fisica
      </label>
      <textarea
        value={tessera.titolo}
        onChange={(e) => aggiornaTessera(tessera.id, { titolo: e.target.value })}
        rows={2}
        className="w-full text-lg font-medium bg-transparent border-none px-0 py-1 resize-none focus:outline-none text-gray-900 dark:text-gray-100"
      />

      <div className="flex gap-4 my-4">
        <div className="flex-1">
          <label className="text-xs text-gray-400 dark:text-gray-600 block mb-1">priorità</label>
          <select
            value={tessera.priorita}
            onChange={(e) => aggiornaTessera(tessera.id, { priorita: e.target.value })}
            className="w-full rounded-card border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          >
            {Object.entries(ETICHETTA_PRIORITA).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-400 dark:text-gray-600 block mb-1">scadenza</label>
          <input
            type="date"
            value={tessera.scadenza ? tessera.scadenza.slice(0, 10) : ""}
            onChange={(e) =>
              aggiornaTessera(tessera.id, { scadenza: e.target.value || null })
            }
            className="w-full rounded-card border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-400 dark:text-gray-600 flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={tessera.eProgetto}
            onChange={(e) => aggiornaTessera(tessera.id, { eProgetto: e.target.checked })}
          />
          è un progetto (con più passi)
        </label>
      </div>

      {tessera.eProgetto && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">passi</h2>
          <div className="flex flex-col gap-1.5">
            {tessera.sottoPassi.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={p.completato}
                  onChange={() => toggliPasso(p.id)}
                />
                <span
                  className={`flex-1 text-sm ${
                    p.completato
                      ? "line-through text-gray-400 dark:text-gray-600"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {p.testo}
                </span>
                <button
                  onClick={() => rimuoviPasso(p.id)}
                  className="text-gray-300 dark:text-gray-700 text-sm px-1"
                  aria-label="rimuovi passo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={aggiungiPasso} className="flex gap-2 mt-2">
            <input
              value={nuovoPasso}
              onChange={(e) => setNuovoPasso(e.target.value)}
              placeholder="aggiungi un passo..."
              className="flex-1 rounded-card border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-card bg-gray-100 dark:bg-gray-800 text-sm"
            >
              +
            </button>
          </form>
        </div>
      )}

      {avviso && (
        <div className="mb-4 rounded-card bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm px-3 py-2">
          {avviso}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {tessera.zona !== "fatto" && (
          <button
            onClick={() => muovi("fatto")}
            className="w-full py-3 rounded-card bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium"
          >
            azione completata
          </button>
        )}
        {prossimeZone
          .filter((z) => z !== "fatto")
          .map((z) => (
            <button
              key={z}
              onClick={() => muovi(z)}
              className="w-full py-2.5 rounded-card border border-gray-200 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-300"
            >
              sposta a {ETICHETTA_ZONA[z]}
            </button>
          ))}
        <button
          onClick={() => {
            if (confirm("eliminare questa tessera?")) {
              eliminaTessera(tessera.id);
              navigate(-1);
            }
          }}
          className="w-full py-2.5 text-sm text-gray-400 dark:text-gray-600"
        >
          elimina
        </button>
      </div>
    </div>
  );
}
