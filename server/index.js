// Entry point del server. Serve sia le API REST sia i file statici del
// frontend già buildato (client/dist), così PC e telefono raggiungono un
// unico indirizzo: http://<ip-locale-del-pc>:3000
//
// Ascolta su 0.0.0.0 (non solo localhost) per essere raggiungibile dagli
// altri dispositivi sulla stessa rete Wi-Fi.

import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

import { tasksRouter } from "./routes/tasks.js";
import { listTasks } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

function broadcast(message) {
  const payload = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
}

wss.on("connection", (socket) => {
  // al collegamento, mandiamo subito lo stato attuale: utile quando il
  // telefono si riconnette dopo essere stato offline.
  socket.send(JSON.stringify({ type: "tasks:changed", tasks: listTasks() }));
});

app.use("/api/tasks", tasksRouter(broadcast));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, ora: new Date().toISOString() });
});

// frontend buildato (npm run build in /client produce /client/dist)
const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

server.listen(PORT, HOST, () => {
  console.log(`4 zone in ascolto su http://${HOST}:${PORT}`);
  console.log("apri questo indirizzo usando l'ip locale del pc dal telefono, es: http://192.168.1.23:3000");
});
