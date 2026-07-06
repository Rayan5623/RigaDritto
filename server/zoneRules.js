// Regole del sistema "4 Zone".
//
// Questo file è il cuore dell'app: definisce l'ordine delle zone, il limite
// rigido della zona "in corso" (massimo 3 tessere) e la regola "si muove solo
// in avanti". È duplicato in client/src/zoneRules.js (stessa logica, stesse
// costanti) perché il client deve poter dare un feedback immediato senza
// aspettare il server: se lo modifichi, aggiorna entrambe le copie.
//
// Il server resta comunque l'unica fonte di verità: ogni richiesta di
// cambio zona viene ri-validata qui prima di scrivere sul database, quindi
// il vincolo non è aggirabile nemmeno chiamando l'API direttamente.

export const ZONE_ORDER = {
  inbox: 0,
  oggi: 1,
  in_corso: 2,
  fatto: 3,
};

export const ZONES = Object.keys(ZONE_ORDER);

export const IN_CORSO_LIMIT = 3;
export const OGGI_SUGGERITE = 3;

/**
 * Verifica se una tessera può spostarsi nella zona indicata.
 * @param {{id: string, zona: string}} task la tessera da spostare
 * @param {string} targetZona zona di destinazione
 * @param {Array<{id: string, zona: string}>} allTasks tutte le tessere attive (non archiviate)
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
export function canMoveToZone(task, targetZona, allTasks) {
  if (!(targetZona in ZONE_ORDER)) {
    return { ok: false, reason: `zona sconosciuta: ${targetZona}` };
  }

  const currentIdx = ZONE_ORDER[task.zona];
  const targetIdx = ZONE_ORDER[targetZona];

  if (targetIdx === currentIdx) {
    return { ok: true }; // nessun movimento, non c'è nulla da validare
  }

  if (targetIdx < currentIdx) {
    return {
      ok: false,
      reason: "una tessera si muove solo in avanti: inbox → oggi → in corso → fatto",
    };
  }

  if (targetZona === "in_corso") {
    const occupati = allTasks.filter(
      (t) => t.zona === "in_corso" && t.id !== task.id
    ).length;
    if (occupati >= IN_CORSO_LIMIT) {
      return {
        ok: false,
        reason: "chiudi prima un'attività: massimo 3 tessere in corso",
      };
    }
  }

  return { ok: true };
}

export function contaInCorso(allTasks) {
  return allTasks.filter((t) => t.zona === "in_corso").length;
}

export function slotLiberiInCorso(allTasks) {
  return Math.max(0, IN_CORSO_LIMIT - contaInCorso(allTasks));
}
