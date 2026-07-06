import { useTasks } from "../context/TasksContext.jsx";
import Header from "../components/Header.jsx";
import TesseraCard from "../components/TesseraCard.jsx";

export default function Scadenze() {
  const { tasks } = useTasks();

  const scadenze = tasks
    .filter((t) => !t.archiviato && t.scadenza && t.zona !== "fatto")
    .sort((a, b) => new Date(a.scadenza) - new Date(b.scadenza));

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  return (
    <div>
      <Header titolo="scadenze" />
      <div className="max-w-md mx-auto px-4 py-4 flex flex-col gap-2">
        {scadenze.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-600 py-6 text-center">
            nessuna tessera con una scadenza.
          </p>
        )}
        {scadenze.map((t) => {
          const dataScadenza = new Date(t.scadenza);
          const inRitardo = dataScadenza < oggi;
          return (
            <div key={t.id} className="relative">
              <TesseraCard tessera={t} />
              {inRitardo && (
                <span className="absolute top-2 right-2 text-xs text-zona-scadenze font-medium">
                  in ritardo
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
