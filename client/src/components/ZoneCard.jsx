import { useDroppable } from "@dnd-kit/core";

// Scheda di zona per la Home. `accento` disegna il bordo colorato più
// marcato richiesto per "in corso": è l'unica zona con un vincolo rigido,
// quindi deve saltare all'occhio.
//
// `zonaId`, se passato, rende la scheda una destinazione di drag-and-drop:
// quando una tessera viene trascinata sopra, il bordo si evidenzia con il
// colore della zona (feedback visivo richiesto per il drop).
export default function ZoneCard({ colore, titolo, badge, accento, children, vuoto, zonaId }) {
  const droppable = useDroppable({ id: zonaId ?? "__non-droppable__", disabled: !zonaId });
  const evidenziata = zonaId && droppable.isOver;

  return (
    <section
      ref={zonaId ? droppable.setNodeRef : undefined}
      className={`bg-white dark:bg-gray-900 rounded-card border p-4 transition-colors ${
        evidenziata
          ? "border-2"
          : accento
          ? "border-2 border-zona-incorso"
          : "border border-gray-200 dark:border-gray-800"
      }`}
      style={evidenziata ? { borderColor: colore, boxShadow: `0 0 0 3px ${colore}33` } : undefined}
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
