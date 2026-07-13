import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useTasks } from "../context/TasksContext.jsx";
import { IN_CORSO_LIMIT, OGGI_SUGGERITE } from "../zoneRules.js";
import Header from "../components/Header.jsx";
import ZoneCard from "../components/ZoneCard.jsx";
import TesseraCard, { formattaData } from "../components/TesseraCard.jsx";
import TesseraDraggable from "../components/TesseraDraggable.jsx";

export default function Home() {
  const navigate = useNavigate();
  const { tasks, spostaZona } = useTasks();
  const [tessertaTrascinata, setTessertaTrascinata] = useState(null);
  const [avviso, setAvviso] = useState(null);

  // distanza minima prima che un tocco/click diventi un drag: senza questa
  // soglia un semplice tap per aprire la tessera verrebbe scambiato per un
  // trascinamento. Un unico sensore basato su Pointer Events copre mouse,
  // touch e penna con lo stesso comportamento.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const attive = tasks.filter((t) => !t.archiviato);
  const inbox = attive.filter((t) => t.zona === "inbox");
  const inCorso = attive.filter((t) => t.zona === "in_corso");
  const oggi = attive.filter((t) => t.zona === "oggi");
  const fatto = attive.filter((t) => t.zona === "fatto");
  const scadenze = attive
    .filter((t) => t.scadenza && t.zona !== "fatto")
    .sort((a, b) => new Date(a.scadenza) - new Date(b.scadenza));

  const slotLiberi = Math.max(0, IN_CORSO_LIMIT - inCorso.length);

  function mostraAvviso(testo) {
    setAvviso(testo);
    setTimeout(() => setAvviso(null), 3500);
  }

  function handleDragStart(event) {
    const tessera = event.active.data.current?.tessera;
    if (tessera) setTessertaTrascinata(tessera);
  }

  function handleDragEnd(event) {
    setTessertaTrascinata(null);
    const { active, over } = event;
    if (!over) return;
    const zonaDestinazione = over.id;
    const tessera = active.data.current?.tessera;
    if (!tessera || tessera.zona === zonaDestinazione) return;

    const esito = spostaZona(tessera.id, zonaDestinazione);
    if (!esito.ok) mostraAvviso(esito.reason);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setTessertaTrascinata(null)}
    >
      <div>
        <Header
          titolo="zone"
          azioneDestra={
            <>
              <button
                onClick={() => navigate("/setacci")}
                aria-label="metodo decisionale: i tre setacci"
                title="metodo decisionale: i tre setacci"
                className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 active:bg-gray-100 dark:active:bg-gray-800 text-lg leading-none"
              >
                ◈
              </button>
              <button
                onClick={() => navigate("/cattura")}
                aria-label="cattura veloce"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xl leading-none"
              >
                +
              </button>
            </>
          }
        />

        {avviso && (
          <div className="max-w-md mx-auto px-4 pt-2">
            <div className="rounded-card bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm px-3 py-2">
              {avviso}
            </div>
          </div>
        )}

        <div className="max-w-md min-[480px]:max-w-2xl mx-auto px-4 py-4 grid grid-cols-1 min-[480px]:grid-cols-2 gap-4">
          <ZoneCard
            zonaId="inbox"
            colore="#2563eb"
            titolo="inbox"
            badge={<ContaBadge n={inbox.length} colore="text-zona-inbox" />}
            vuoto={inbox.length === 0 ? "vuota. tocca + per catturare qualcosa, o trascina qui." : null}
          >
            {inbox.slice(0, 4).map((t) => (
              <TesseraDraggable key={t.id} tessera={t} />
            ))}
            {inbox.length > 0 && (
              <button
                onClick={() => navigate("/cattura")}
                className="text-sm text-zona-inbox text-left py-1"
              >
                vai allo smistamento ({inbox.length})
              </button>
            )}
          </ZoneCard>

          <ZoneCard
            zonaId="in_corso"
            colore="#d97706"
            titolo="in corso"
            accento
            badge={
              <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-zona-incorso/10 text-zona-incorso">
                {inCorso.length} / {IN_CORSO_LIMIT}
              </span>
            }
            vuoto={inCorso.length === 0 ? "niente in lavorazione adesso." : null}
          >
            {inCorso.map((t) => (
              <TesseraDraggable key={t.id} tessera={t} />
            ))}
            {Array.from({ length: slotLiberi }).map((_, i) => (
              <div
                key={i}
                className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-card py-3 text-center text-xs text-gray-300 dark:text-gray-600"
              >
                slot libero
              </div>
            ))}
          </ZoneCard>

          <ZoneCard
            zonaId="oggi"
            colore="#16a34a"
            titolo="oggi"
            badge={
              <span className="text-sm px-2 py-0.5 rounded-full bg-zona-oggi/10 text-zona-oggi">
                {oggi.length} / {OGGI_SUGGERITE}
              </span>
            }
            vuoto={oggi.length === 0 ? "scegli le priorità di oggi dall'inbox, o trascinale qui." : null}
          >
            {oggi.map((t, i) => (
              <TesseraDraggable key={t.id} tessera={t} numero={i + 1} />
            ))}
          </ZoneCard>

          <ZoneCard
            zonaId="fatto"
            colore="#6b7280"
            titolo="fatto"
            badge={<ContaBadge n={fatto.length} colore="text-gray-500 dark:text-gray-400" />}
            vuoto={fatto.length === 0 ? "niente di completato ancora." : null}
          >
            {fatto.slice(0, 4).map((t) => (
              <TesseraDraggable key={t.id} tessera={t} />
            ))}
          </ZoneCard>

          <div className="min-[480px]:col-span-2">
            <ZoneCard
              colore="#dc2626"
              titolo="scadenze"
              badge={<ContaBadge n={scadenze.length} colore="text-zona-scadenze" />}
              vuoto={scadenze.length === 0 ? "nessuna scadenza in vista." : null}
            >
              {scadenze.slice(0, 3).map((t) => (
                <TesseraCard key={t.id} tessera={t} />
              ))}
              {scadenze.length > 0 && (
                <button
                  onClick={() => navigate("/scadenze")}
                  className="text-sm text-zona-scadenze text-left py-1"
                >
                  vedi tutte ({scadenze.length})
                </button>
              )}
            </ZoneCard>
          </div>
        </div>
      </div>

      <DragOverlay>
        {tessertaTrascinata && (
          <div className="opacity-90 rotate-1 shadow-lg rounded-card">
            <TesseraCard tessera={tessertaTrascinata} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function ContaBadge({ n, colore }) {
  return <span className={`text-sm font-medium ${colore}`}>{n}</span>;
}
