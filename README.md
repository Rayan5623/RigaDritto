# 4 zone

App di produttività basata su una lavagna fisica a 4 zone (inbox, oggi, in
corso, fatto) con tessere magnetiche. Gira in locale sul tuo pc di casa ed è
raggiungibile anche dal telefono, ma **solo quando siete sulla stessa rete
Wi-Fi**: niente cloud, niente account, tutti i dati restano sul tuo pc.

Il cuore dell'app è un vincolo semplice ma rigido: **in "in corso" possono
starci al massimo 3 tessere**. Se provi a spostarne una quarta, l'app te lo
impedisce e basta.

---

## 0. Cosa ti serve

- Il pc di casa (Windows, Mac o Linux) con [Node.js](https://nodejs.org)
  installato (versione 18 o superiore).
- Il telefono e il pc collegati alla **stessa rete Wi-Fi** quando vuoi usare
  l'app da entrambi.

## 1. Installare le dipendenze

Apri un terminale nella cartella del progetto e lancia:

```bash
npm run install-all
```

Installa sia le dipendenze del server sia quelle del frontend.

## 2. Avviare tutto con un solo comando

```bash
npm start
```

Questo comando fa due cose in sequenza:

1. builda il frontend (React + Vite) in `client/dist`;
2. avvia il server Express, che serve sia le API sia il frontend già
   buildato, in ascolto su **tutte le interfacce di rete** (`0.0.0.0`), porta
   **3000**.

Quando è avviato vedrai in console qualcosa come:

```
4 zone in ascolto su http://0.0.0.0:3000
```

Il database è un file SQLite locale: `server/data/4zone.sqlite`. Non serve
installare nessun database a parte, viene creato automaticamente al primo
avvio.

Da questo momento puoi già aprire `http://localhost:3000` dal browser del
pc.

> Durante lo sviluppo, se vuoi il ricaricamento automatico del frontend,
> puoi usare due terminali separati con `npm run dev:server` e
> `npm run dev:client` invece di `npm start`.

## 3. Trovare l'indirizzo ip locale del pc

Per collegarti dal telefono ti serve l'indirizzo ip del pc **sulla rete
locale** (una cosa tipo `192.168.1.23`).

**Windows**

1. Apri il "Prompt dei comandi" (cerca `cmd` nel menu Start).
2. Digita `ipconfig` e premi invio.
3. Cerca la voce "Indirizzo IPv4" sotto la scheda Wi-Fi (o Ethernet) attiva.

**Mac**

1. Apri "Preferenze di Sistema" → "Rete".
2. Seleziona la connessione Wi-Fi attiva: l'indirizzo ip è mostrato lì.
3. In alternativa, da Terminale: `ipconfig getifaddr en0`

**Linux**

1. Da terminale digita: `hostname -I` oppure `ip addr show`
2. Cerca l'indirizzo nella forma `192.168.x.x` (o `10.x.x.x`) associato alla
   tua interfaccia Wi-Fi/Ethernet.

## 4. Aprire l'app dal telefono

1. Assicurati che il telefono sia collegato alla **stessa rete Wi-Fi** del pc
   (non ai dati mobili).
2. Assicurati che il pc sia **acceso** e che il server sia in esecuzione
   (`npm start`).
3. Apri il browser del telefono e digita:

   ```
   http://<ip-del-pc>:3000
   ```

   ad esempio `http://192.168.1.23:3000`

4. La prima volta, se vuoi, apri l'app anche dal pc con lo stesso indirizzo
   (o con `localhost:3000`): vedrai le stesse tessere aggiornarsi su
   entrambi i dispositivi in tempo reale.

Se non si carica nulla, controlla che:
- il pc non sia andato in stand-by;
- telefono e pc siano davvero sulla stessa rete (alcune reti Wi-Fi "ospiti"
  isolano i dispositivi tra loro: se hai una rete ospite, usa quella
  principale);
- il firewall del pc non stia bloccando la porta 3000 (su Windows, alla
  prima esecuzione potrebbe chiederti il permesso: concedilo per le reti
  private/domestiche).

### Impostare l'indirizzo del server (facoltativo)

Se apri l'app direttamente digitando l'indirizzo del server (come sopra),
non devi configurare nulla: funziona da subito. Se invece vuoi cambiare a
quale server punta l'app (ad esempio dopo aver cambiato pc, o se l'ip di
casa cambia), vai su **impostazioni** (icona ingranaggio, in alto a destra
in ogni schermata) e incolla il nuovo indirizzo, tipo
`http://192.168.1.23:3000`. Viene salvato nel browser del dispositivo, va
fatto una sola volta.

## 5. Installarla come PWA sul telefono

**iPhone (Safari)**

1. Apri `http://<ip-del-pc>:3000` in Safari.
2. Tocca l'icona di condivisione (il quadrato con la freccia verso l'alto).
3. Scegli "Aggiungi alla schermata Home".
4. Conferma: comparirà un'icona come una vera app.

**Android (Chrome)**

1. Apri `http://<ip-del-pc>:3000` in Chrome.
2. Tocca il menu (i tre puntini in alto a destra).
3. Scegli "Aggiungi a schermata Home" o "Installa app" (a volte Chrome lo
   propone da solo con un banner).
4. Conferma.

Una volta installata, l'app si apre a schermo intero come le altre app e
funziona anche offline in modalità base: puoi consultare le tessere già
sincronizzate e anche crearne/modificarne di nuove, che verranno inviate al
pc di casa non appena la connessione torna disponibile (vedi nota sotto).

## Avvio automatico del server all'accensione del pc (facoltativo)

Così non devi ricordarti di lanciare `npm start` ogni volta.

**Windows** — Utilità di pianificazione (Task Scheduler)

1. Cerca "Utilità di pianificazione" nel menu Start.
2. "Crea attività" → scheda "Trigger" → "Nuovo" → "All'avvio del computer".
3. Scheda "Azioni" → "Nuova" → Programma/script: `cmd.exe`, argomenti:
   `/c npm start`, "Directory di avvio in": la cartella del progetto.
4. Salva. Al prossimo riavvio il server partirà da solo.

**Mac** — un semplice LaunchAgent, oppure più semplice: usa
[`pm2`](https://pm2.keymetrics.io/) (`npm install -g pm2`), poi dentro la
cartella del progetto:

```bash
pm2 start npm --name 4zone -- start
pm2 save
pm2 startup   # segui le istruzioni stampate a schermo
```

**Linux** — stesso approccio con `pm2`, oppure un servizio `systemd`:

```bash
sudo tee /etc/systemd/system/4zone.service > /dev/null <<EOF
[Unit]
Description=4 zone
After=network.target

[Service]
WorkingDirectory=/percorso/completo/del/progetto
ExecStart=/usr/bin/npm start
Restart=on-failure
User=il-tuo-utente

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now 4zone
```

---

## Nota importante

**L'app funziona solo quando il pc di casa è acceso e il telefono è sulla
stessa rete Wi-Fi del pc.** Quando esci di casa, telefono e pc non si vedono
più: puoi continuare a usare l'app installata sul telefono (le modifiche
restano in coda sul dispositivo), ma la sincronizzazione riprenderà solo
quando rientri in rete e il pc è acceso e raggiungibile.

## Come funzionano le 4 zone (in breve)

- **inbox** — cattura veloce, nessun limite, non si decide nulla qui.
- **in corso** — massimo **3** tessere, vincolo rigido e non aggirabile.
- **oggi** — le 3 priorità della giornata (limite consigliato, non bloccato).
- **scadenze** — vista separata con le tessere che hanno una data, ordinate
  per scadenza.

Le tessere si muovono solo in avanti: inbox → oggi → in corso → fatto.

## Struttura del progetto

```
server/            backend Express + SQLite
  index.js          entry point, ascolta su 0.0.0.0:3000
  db.js             accesso al database
  zoneRules.js       regole di zona e limite dei 3 slot (il cuore dell'app)
  routes/tasks.js    API REST /api/tasks

client/             frontend React + Vite + Tailwind
  src/
    zoneRules.js     stessa logica di server/zoneRules.js, copiata lato client
    context/         stato globale: tessere (sync/offline) e impostazioni
    screens/         le schermate dell'app
    components/      pezzi di interfaccia riusabili
```

Sincronizzazione tra dispositivi via WebSocket (in tempo reale) con polling
di riserva ogni pochi secondi. In caso di modifiche fatte sulla stessa
tessera da due dispositivi diversi vince l'ultima scrittura arrivata al
server ("last write wins"): nessuna gestione complessa dei conflitti, per
scelta.
