import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTasks } from "../context/TasksContext.jsx";
import TesseraCard from "../components/TesseraCard.jsx";
import Header from "../components/Header.jsx";

// Cattura rapida: qui si scarica tutto senza pensare a dove andrà a finire.
// Nessuna azione di smistamento in questa schermata, di proposito: la
// decisione (spostare in oggi / in corso) si prende altrove, aprendo la
// tessera. Questo è il punto: abbassare l'attrito della cattura.
export default function Cattura() {
  const navigate = useNavigate();
  const { tasks, creaTessera } = useTasks();
  const [testo, setTesto] = useState("");

  const daSmistare = tasks
    .filter((t) => !t.archiviato && t.zona === "inbox")
    .sort((a, b) => new Date(b.creatoIl) - new Date(a.creatoIl));

  function submit(e) {
    e.preventDefault();
    const titolo = testo.trim();
    if (!titolo) return;
    creaTessera({ titolo });
    setTesto("");
  }

  return (
    <div>
      <Header titolo="cattura rapida" />

      <div className="max-w-md mx-auto px-4 py-4">
        <form onSubmit={submit} className="flex flex-col gap-2">
          <textarea
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            placeholder="scrivi qualcosa e buttala nell'inbox..."
            rows={2}
            autoFocus
            className="w-full resize-none rounded-card border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zona-inbox/40"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) submit(e);
            }}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <IconaPlaceholder etichetta="voce" simbolo="🎙" />
              <IconaPlaceholder etichetta="foto" simbolo="📷" />
              <IconaPlaceholder etichetta="allegato" simbolo="📎" />
            </div>
            <button
              type="submit"
              disabled={!testo.trim()}
              className="px-4 py-2 rounded-card bg-zona-inbox text-white text-sm font-medium disabled:opacity-40"
            >
              butta nell'inbox
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-400 dark:text-gray-600 mt-3 mb-6">
          qui non decidi nulla. scarichi e basta.
        </p>

        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          da smistare ({daSmistare.length})
        </h2>
        <div className="flex flex-col gap-2">
          {daSmistare.map((t) => (
            <TesseraCard key={t.id} tessera={t} />
          ))}
          {daSmistare.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-600 py-2">
              inbox vuota, tutto smistato.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function IconaPlaceholder({ etichetta, simbolo }) {
  return (
    <button
      type="button"
      title={`${etichetta}: in arrivo`}
      onClick={() => alert(`cattura da ${etichetta}: funzione in arrivo`)}
      className="w-9 h-9 flex items-center justify-center rounded-full text-lg text-gray-400 dark:text-gray-500 active:bg-gray-100 dark:active:bg-gray-800"
    >
      {simbolo}
    </button>
  );
}
