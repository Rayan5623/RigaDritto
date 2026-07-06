import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext.jsx";
import { useTasks } from "../context/TasksContext.jsx";

export default function Impostazioni() {
  const navigate = useNavigate();
  const { serverUrl, setServerUrl, resetServerUrl, defaultServerUrl } = useSettings();
  const { online, connesso, ricarica } = useTasks();
  const [valore, setValore] = useState(serverUrl);
  const [salvato, setSalvato] = useState(false);

  function salva(e) {
    e.preventDefault();
    setServerUrl(valore);
    setSalvato(true);
    setTimeout(() => setSalvato(false), 2000);
    setTimeout(ricarica, 200);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      <button onClick={() => navigate(-1)} className="text-sm text-gray-400 mb-3">
        ← indietro
      </button>

      <h1 className="text-lg font-semibold mb-4">impostazioni</h1>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          indirizzo del server
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-600 mb-3">
          incolla qui l'indirizzo del pc di casa (es. http://192.168.1.23:3000).
          va impostato una volta sola su ogni dispositivo. se apri l'app
          direttamente dal server (stesso indirizzo nella barra del browser),
          non serve cambiare nulla.
        </p>
        <form onSubmit={salva} className="flex flex-col gap-2">
          <input
            value={valore}
            onChange={(e) => setValore(e.target.value)}
            placeholder="http://192.168.1.23:3000"
            className="w-full rounded-card border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-card bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium"
            >
              {salvato ? "salvato ✓" : "salva"}
            </button>
            <button
              type="button"
              onClick={() => {
                resetServerUrl();
                setValore(defaultServerUrl);
              }}
              className="px-3 py-2.5 rounded-card border border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
            >
              usa indirizzo attuale
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          stato connessione
        </h2>
        <div className="text-sm flex flex-col gap-1">
          <Riga etichetta="rete" valore={online ? "online" : "offline"} />
          <Riga etichetta="tempo reale (websocket)" valore={connesso ? "connesso" : "non connesso"} />
          <Riga etichetta="server configurato" valore={serverUrl} />
        </div>
      </section>
    </div>
  );
}

function Riga({ etichetta, valore }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-900">
      <span className="text-gray-500 dark:text-gray-400">{etichetta}</span>
      <span className="text-gray-800 dark:text-gray-200 truncate max-w-[60%] text-right">
        {valore}
      </span>
    </div>
  );
}
