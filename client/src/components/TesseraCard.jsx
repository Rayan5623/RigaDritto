import { useNavigate } from "react-router-dom";

const PRIORITA_LABEL = { alta: "alta", media: "media", bassa: "bassa" };
const PRIORITA_DOT = {
  alta: "bg-red-500",
  media: "bg-amber-400",
  bassa: "bg-gray-300 dark:bg-gray-600",
};

export default function TesseraCard({ tessera, numero }) {
  const navigate = useNavigate();
  const passiFatti = tessera.sottoPassi.filter((p) => p.completato).length;
  const totalePassi = tessera.sottoPassi.length;

  return (
    <button
      onClick={() => navigate(`/tessera/${tessera.id}`)}
      className="w-full text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-card px-4 py-3 flex items-center gap-3 active:scale-[0.99] transition-transform"
    >
      {numero != null && (
        <span className="flex-none w-6 h-6 rounded-full bg-zona-oggi/10 text-zona-oggi text-sm font-semibold flex items-center justify-center">
          {numero}
        </span>
      )}
      <span className={`flex-none w-2 h-2 rounded-full ${PRIORITA_DOT[tessera.priorita]}`} />
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm text-gray-900 dark:text-gray-100">{tessera.titolo}</p>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {tessera.eProgetto && <span>progetto</span>}
          {totalePassi > 0 && (
            <span>
              {passiFatti}/{totalePassi} passi
            </span>
          )}
          {tessera.scadenza && <span>scade {formattaData(tessera.scadenza)}</span>}
        </div>
      </div>
    </button>
  );
}

export function formattaData(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}
