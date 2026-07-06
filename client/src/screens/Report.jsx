import { useTasks, leggiTentativiBloccati } from "../context/TasksContext.jsx";
import Header from "../components/Header.jsx";

const SETTE_GIORNI_MS = 7 * 24 * 60 * 60 * 1000;

const FASCE = [
  { chiave: "mattina", label: "mattina — lavoro mentale", da: 5, a: 12 },
  { chiave: "pomeriggio", label: "pomeriggio — produzione fisica", da: 12, a: 19 },
  { chiave: "sera", label: "sera — micro-task e social", da: 19, a: 29 }, // 29 = 5 del giorno dopo
];

export default function Report() {
  const { tasks } = useTasks();

  const daInizioSettimana = Date.now() - SETTE_GIORNI_MS;

  const completateSettimana = tasks.filter(
    (t) => t.completatoIl && new Date(t.completatoIl).getTime() >= daInizioSettimana
  );

  const tentativiBloccati = leggiTentativiBloccati().filter(
    (iso) => new Date(iso).getTime() >= daInizioSettimana
  ).length;

  // intensità per fascia oraria: quante tessere sono state completate in
  // ciascuna fascia, nell'ultima settimana
  const conteggiFasce = FASCE.map((fascia) => {
    const n = completateSettimana.filter((t) => {
      let ora = new Date(t.completatoIl).getHours();
      if (ora < 5) ora += 24; // la sera "sfora" oltre la mezzanotte
      return ora >= fascia.da && ora < fascia.a;
    }).length;
    return { ...fascia, n };
  });
  const maxFascia = Math.max(1, ...conteggiFasce.map((f) => f.n));

  return (
    <div>
      <Header titolo="report" />
      <div className="max-w-md mx-auto px-4 py-4 flex flex-col gap-6">
        <section className="grid grid-cols-2 gap-3">
          <StatBox
            valore={completateSettimana.length}
            etichetta="completate questa settimana"
          />
          <StatBox
            valore={tentativiBloccati === 0 ? "sempre" : `${tentativiBloccati}`}
            etichetta={
              tentativiBloccati === 0
                ? "limite dei 3 slot rispettato"
                : "tentativi di superare il limite (bloccati)"
            }
          />
        </section>

        <section>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            giornata-tipo
          </h2>
          <div className="flex flex-col gap-3">
            {conteggiFasce.map((f) => (
              <div key={f.chiave}>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>{f.label}</span>
                  <span>{f.n}</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gray-900 dark:bg-white"
                    style={{ width: `${(f.n / maxFascia) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-3">
            calcolato sugli orari di completamento delle tessere nell'ultima settimana.
          </p>
        </section>
      </div>
    </div>
  );
}

function StatBox({ valore, etichetta }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-card p-4">
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{valore}</p>
      <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">{etichetta}</p>
    </div>
  );
}
