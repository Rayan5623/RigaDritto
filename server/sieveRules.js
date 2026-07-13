// Regole minime per "i tre setacci": qui vive solo l'elenco dei bucket
// validi. La logica dei tre sì/no che decide il bucket di partenza (ORA se
// tutte e tre sono sì, PARCHEGGIO se anche una sola è no) vive lato client,
// in Faccia A: è una scelta fatta una volta sola alla creazione, non un
// vincolo che il server deve far rispettare a ogni mossa (a differenza del
// limite dei 3 slot del sistema a 4 quadranti, qui il movimento tra bucket
// in Faccia B è libero in entrambe le direzioni).

export const SIEVE_BUCKETS = ["ORA", "DOPO", "POI", "ATTESA", "PARCHEGGIO"];
