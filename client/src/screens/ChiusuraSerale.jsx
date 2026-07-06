import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTasks } from "../context/TasksContext.jsx";
import { OGGI_SUGGERITE } from "../zoneRules.js";
import TesseraCard from "../components/TesseraCard.jsx";

const TOTALE_PASSI = 3;

// Rituale guidato di ~15 minuti per chiudere la giornata. Passo 2 chiede di
// scegliere le priorità di domani "trascinando dall'inbox": qui usiamo un
// tocco per selezionare/deselezionare invece del drag-and-drop vero, perché
// su schermi touch è molto più affidabile e il risultato per l'utente è lo
// stesso (le tessere scelte finiscono nella zona "oggi").
export default function ChiusuraSerale() {
  const navigate = useNavigate();
  const { tasks, archivia, spostaZona } = useTasks();
  const [passo, setPasso] = useState(1);
  const [selezionate, setSelezionate] = useState([]);

  const daArchiviare = tasks.filter((t) => !t.archiviato && t.zona === "fatto");
  const inbox = tasks.filter((t) => !t.archiviato && t.zona === "inbox");
  const oggi = tasks.filter((t) => !t.archiviato && t.zona === "oggi");
  const scadenze = tasks
    .filter((t) => !t.archiviato && t.scadenza && t.zona !== "fatto")
    .sort((a, b) => new Date(a.scadenza) - new Date(b.scadenza));

  function archiviaTutte() {
    daArchiviare.forEach((t) => archivia(t.id, true));
  }

  function toggliSelezione(id) {
    setSelezionate((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function confermaPriorita() {
    selezionate.forEach((id) => spostaZona(id, "oggi"));
    setSelezionate([]);
    setPasso(3);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      <h1 className="text-lg font-semibold mb-1">chiusura serale</h1>
      <p className="text-xs text-gray-400 dark:text-gray-600 mb-4">
        ~15 minuti per chiudere la giornata in ordine.
      </p>

      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: TOTALE_PASSI }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < passo ? "bg-gray-900 dark:bg-white" : "bg-gray-200 dark:bg-gray-800"
            }`}
          />
        ))}
      </div>

      {passo === 1 && (
        <div>
          <h2 className="font-medium mb-2">1. archivia le completate</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {daArchiviare.length} tessere in "fatto" pronte per essere archiviate.
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {daArchiviare.map((t) => (
              <TesseraCard key={t.id} tessera={t} />
            ))}
            {daArchiviare.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-600 py-2">
                niente da archiviare oggi.
              </p>
            )}
          </div>
          <BottoniPasso
            onAvanti={() => {
              archiviaTutte();
              setPasso(2);
            }}
            testoAvanti={daArchiviare.length > 0 ? "archivia e continua" : "continua"}
          />
        </div>
      )}

      {passo === 2 && (
        <div>
          <h2 className="font-medium mb-2">2. scegli le priorità di domani</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            tocca fino a {OGGI_SUGGERITE} tessere dall'inbox da portare in "oggi".
            {oggi.length > 0 && ` ci sono già ${oggi.length} tessere in oggi.`}
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {inbox.map((t) => {
              const scelta = selezionate.includes(t.id);
              const bloccata = !scelta && selezionate.length >= OGGI_SUGGERITE;
              return (
                <button
                  key={t.id}
                  onClick={() => !bloccata && toggliSelezione(t.id)}
                  disabled={bloccata}
                  className={`text-left rounded-card border px-4 py-3 text-sm transition-colors ${
                    scelta
                      ? "border-zona-oggi bg-zona-oggi/10 text-gray-900 dark:text-gray-100"
                      : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                  } ${bloccata ? "opacity-40" : ""}`}
                >
                  {scelta ? "✓ " : ""}
                  {t.titolo}
                </button>
              );
            })}
            {inbox.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-600 py-2">
                l'inbox è vuota.
              </p>
            )}
          </div>
          <BottoniPasso
            onIndietro={() => setPasso(1)}
            onAvanti={confermaPriorita}
            testoAvanti={`conferma ${selezionate.length > 0 ? `(${selezionate.length})` : ""} e continua`}
          />
        </div>
      )}

      {passo === 3 && (
        <div>
          <h2 className="font-medium mb-2">3. rivedi le scadenze</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {scadenze.length} tessere con una data, ordinate per scadenza.
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {scadenze.map((t) => (
              <TesseraCard key={t.id} tessera={t} />
            ))}
            {scadenze.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-600 py-2">
                nessuna scadenza da rivedere.
              </p>
            )}
          </div>
          <BottoniPasso
            onIndietro={() => setPasso(2)}
            onAvanti={() => navigate("/")}
            testoAvanti="chiudi la giornata"
          />
        </div>
      )}
    </div>
  );
}

function BottoniPasso({ onIndietro, onAvanti, testoAvanti }) {
  return (
    <div className="flex gap-2">
      {onIndietro && (
        <button
          onClick={onIndietro}
          className="flex-1 py-3 rounded-card border border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400"
        >
          indietro
        </button>
      )}
      <button
        onClick={onAvanti}
        className="flex-[2] py-3 rounded-card bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium"
      >
        {testoAvanti}
      </button>
    </div>
  );
}
