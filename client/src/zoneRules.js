// Copia lato client delle regole di zona (vedi server/zoneRules.js per la
// spiegazione completa). Serve a dare un feedback immediato nell'interfaccia
// senza aspettare la risposta del server, che resta comunque l'unica fonte
// di verità: se le due copie divergessero, vince sempre il server.

export const ZONE_ORDER = {
  inbox: 0,
  oggi: 1,
  in_corso: 2,
  fatto: 3,
};

export const ZONES = Object.keys(ZONE_ORDER);

export const IN_CORSO_LIMIT = 3;
export const OGGI_SUGGERITE = 3;

export function canMoveToZone(task, targetZona, allTasks) {
  if (!(targetZona in ZONE_ORDER)) {
    return { ok: false, reason: `zona sconosciuta: ${targetZona}` };
  }

  const currentIdx = ZONE_ORDER[task.zona];
  const targetIdx = ZONE_ORDER[targetZona];

  if (targetIdx === currentIdx) return { ok: true };

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
