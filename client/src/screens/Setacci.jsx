import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSieve } from "../context/SieveContext.jsx";
import { SIEVE_BUCKETS } from "../sieveRules.js";
import "./Setacci.css";

const DOMANDE = [
  "Testabile questa settimana, sotto 100€, senza una skill nuova?",
  "Mi mette davanti a un cliente che paga, o al banco a costruire?",
  "Usa un asset che ho già, o parte da zero?",
];

export default function Setacci() {
  const navigate = useNavigate();
  const { sieveTasks, creaSieveTask, aggiornaSieveTask, eliminaSieveTask } = useSieve();
  const [faccia, setFaccia] = useState("A");
  const [sieves, setSieves] = useState([null, null, null]);
  const [idea, setIdea] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const [taskBucket, setTaskBucket] = useState("POI");

  function setSieve(i, val) {
    setSieves((prev) => prev.map((v, idx) => (idx === i ? val : v)));
  }

  function mandaAiTask(bucket) {
    const testo = idea.trim();
    if (!testo) return;
    creaSieveTask(testo, bucket);
    setIdea("");
    setSieves([null, null, null]);
    setFaccia("B");
  }

  function aggiungiTask() {
    const testo = taskInput.trim();
    if (!testo) return;
    creaSieveTask(testo, taskBucket);
    setTaskInput("");
  }

  function ciclaBucket(id, bucketAttuale) {
    const prossimo = SIEVE_BUCKETS[(SIEVE_BUCKETS.indexOf(bucketAttuale) + 1) % SIEVE_BUCKETS.length];
    aggiornaSieveTask(id, { bucket: prossimo });
  }

  function toggliFatto(id, doneAttuale) {
    aggiornaSieveTask(id, { done: !doneAttuale });
  }

  const risposteComplete = sieves.every((x) => x !== null);
  const tutteSi = sieves.every((x) => x === true);

  const live = sieveTasks.filter((t) => !t.done);
  const focus = live.find((t) => t.bucket === "ORA");

  return (
    <div className="sd-root">
      <div className="sd-wrap" style={{ paddingTop: 12 }}>
        <button className="sd-back" onClick={() => navigate("/")}>
          ← torna alle zone
        </button>
      </div>

      <header className="sd-top">
        <div>
          <div className="sd-brand">
            <span className="sd-rig">Riga</span>Dritto
          </div>
          <div className="sd-brand-sub">una cosa · per volta</div>
        </div>
      </header>

      <div className="sd-wrap">
        <div className="sd-faces">
          <button className={faccia === "A" ? "on" : ""} onClick={() => setFaccia("A")}>
            FACCIA A<span className="sd-tag">idea nuova</span>
          </button>
          <button className={faccia === "B" ? "on" : ""} onClick={() => setFaccia("B")}>
            FACCIA B<span className="sd-tag">ordina i task</span>
          </button>
        </div>

        {faccia === "A" && (
          <section>
            <h2 className="sd-section">I tre setacci</h2>
            <p className="sd-hint">
              Arriva un'idea. Passa dai tre setacci prima di toccare la lista. Tre sì la fanno
              entrare, un no netto la manda in parcheggio.
            </p>

            <input
              className="sd-input-idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Scrivi l'idea…"
              maxLength={90}
            />

            {DOMANDE.map((domanda, i) => (
              <div className="sd-sieve" key={i}>
                <div className="sd-q">
                  <span className="sd-num">{i + 1}</span>
                  {domanda}
                </div>
                <div className="sd-yesno">
                  <button
                    className={`si ${sieves[i] === true ? "on" : ""}`}
                    onClick={() => setSieve(i, true)}
                  >
                    {i === 2 ? "Sì (ho l'asset)" : "Sì"}
                  </button>
                  <button
                    className={`no ${sieves[i] === false ? "on" : ""}`}
                    onClick={() => setSieve(i, false)}
                  >
                    {i === 2 ? "No (da zero)" : "No"}
                  </button>
                </div>
              </div>
            ))}

            {risposteComplete &&
              (tutteSi ? (
                <div className="sd-verdict pass">
                  <div className="sd-lbl">verdetto</div>
                  <div className="sd-big">→ ENTRA NEI TASK</div>
                  <button
                    className="sd-btn-primary pass"
                    disabled={!idea.trim()}
                    onClick={() => mandaAiTask("ORA")}
                  >
                    {idea.trim() ? "Mandala in ORA" : "Scrivi l'idea per mandarla"}
                  </button>
                </div>
              ) : (
                <div className="sd-verdict park">
                  <div className="sd-lbl">un no netto</div>
                  <div className="sd-big">→ PARCHEGGIO</div>
                  <button
                    className="sd-btn-primary park"
                    disabled={!idea.trim()}
                    onClick={() => mandaAiTask("PARCHEGGIO")}
                  >
                    {idea.trim() ? "Mandala in parcheggio" : "Scrivi l'idea per parcheggiarla"}
                  </button>
                </div>
              ))}
          </section>
        )}

        {faccia === "B" && (
          <section>
            <h2 className="sd-section">Ordina i task</h2>
            <p className="sd-hint">
              Ogni giorno: metti ogni cosa nel suo posto. Lavori su una sola alla volta — la
              prima ORA.
            </p>

            <div className="sd-bucket-legend">
              <div className="sd-chip" data-bucket="ORA">
                <b>ORA</b> — sblocca altro, o è mia e urgente
              </div>
              <div className="sd-chip" data-bucket="DOPO">
                <b>DOPO</b> — mia, ma non sblocca niente
              </div>
              <div className="sd-chip" data-bucket="POI">
                <b>POI</b> — mia, può aspettare
              </div>
              <div className="sd-chip" data-bucket="ATTESA">
                <b>ATTESA</b> — dipende da qualcun altro
              </div>
              <div className="sd-chip" data-bucket="PARCHEGGIO">
                <b>PARCHEGGIO</b> — idea che non ha passato i setacci
              </div>
            </div>

            <div className="sd-addrow">
              <input
                className="sd-input-task"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Nuovo task…"
                maxLength={90}
                onKeyDown={(e) => e.key === "Enter" && aggiungiTask()}
              />
              <select value={taskBucket} onChange={(e) => setTaskBucket(e.target.value)}>
                {SIEVE_BUCKETS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <button className="sd-add-btn" onClick={aggiungiTask}>
                +
              </button>
            </div>

            <div className="sd-focus-banner">
              {focus ? (
                <>
                  <b>Adesso →</b> {focus.testo}
                </>
              ) : (
                <span className="sd-none">
                  Nessuna cosa in ORA. Scegline una: è la sola su cui lavorare.
                </span>
              )}
            </div>

            {sieveTasks.length === 0 ? (
              <div className="sd-empty">Ancora nulla. Aggiungi un task o mandalo dai setacci.</div>
            ) : (
              SIEVE_BUCKETS.map((b) => {
                const items = sieveTasks.filter((t) => t.bucket === b);
                if (items.length === 0) return null;
                return (
                  <div className="sd-group" data-bucket={b} key={b}>
                    <h3>
                      {b} · {items.length}
                    </h3>
                    {items.map((t) => (
                      <div className={`sd-task ${t.done ? "done" : ""}`} data-bucket={b} key={t.id}>
                        <div className="sd-chk" onClick={() => toggliFatto(t.id, t.done)}>
                          {t.done ? "✓" : ""}
                        </div>
                        <div className="sd-txt">{t.testo}</div>
                        <button className="sd-mv" onClick={() => ciclaBucket(t.id, t.bucket)}>
                          {b.slice(0, 3)}⟳
                        </button>
                        <button className="sd-del" onClick={() => eliminaSieveTask(t.id)}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </section>
        )}
      </div>
    </div>
  );
}
