import { useTasks } from "../context/TasksContext.jsx";

// piccola striscia in alto, visibile solo quando c'è qualcosa da segnalare:
// offline, o modifiche ancora in coda da sincronizzare.
export default function ConnessioneStatus() {
  const { online, inCoda } = useTasks();

  if (online && inCoda === 0) return null;

  return (
    <div
      className={`text-xs text-center py-1.5 safe-top ${
        online
          ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          : "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400"
      }`}
    >
      {online
        ? `sincronizzazione in corso... ${inCoda} modifiche in coda`
        : "offline — le modifiche si sincronizzano quando torna la connessione"}
    </div>
  );
}
