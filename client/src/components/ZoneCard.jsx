// Scheda di zona per la Home. `accento` disegna il bordo colorato più
// marcato richiesto per "in corso": è l'unica zona con un vincolo rigido,
// quindi deve saltare all'occhio.
export default function ZoneCard({ colore, titolo, badge, accento, children, vuoto }) {
  return (
    <section
      className={`bg-white dark:bg-gray-900 rounded-card border p-4 ${
        accento
          ? "border-2 border-zona-incorso"
          : "border border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colore }} />
          <h2 className="font-medium text-gray-900 dark:text-gray-100">{titolo}</h2>
        </div>
        {badge}
      </div>
      <div className="flex flex-col gap-2">
        {children}
        {vuoto && (
          <p className="text-sm text-gray-400 dark:text-gray-600 py-2">{vuoto}</p>
        )}
      </div>
    </section>
  );
}
