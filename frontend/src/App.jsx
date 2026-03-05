import { useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [urls, setUrls] = useState(["", "", ""]);
  const [sessionId, setSessionId] = useState(""); // internal only
  const [question, setQuestion] = useState("");

  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loadingIngest, setLoadingIngest] = useState(false);
  const [loadingAsk, setLoadingAsk] = useState(false);

  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);

  const validUrls = useMemo(
    () => urls.map((u) => u.trim()).filter(Boolean),
    [urls]
  );

  const canProcess = validUrls.length > 0 && !loadingIngest && !loadingAsk;
  const canAsk = sessionId && question.trim() && !loadingIngest && !loadingAsk;

  const updateUrl = (idx, value) => {
    const copy = [...urls];
    copy[idx] = value;
    setUrls(copy);
  };

  const resetAll = () => {
    setUrls(["", "", ""]);
    setSessionId("");
    setQuestion("");
    setAnswer("");
    setSources([]);
    setStatus({ type: "", msg: "" });
  };

  const ingest = async () => {
    setLoadingIngest(true);
    setStatus({ type: "info", msg: "Processing URLs… please wait." });
    setAnswer("");
    setSources([]);

    try {
      const res = await fetch(`${API_BASE}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: validUrls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to process URLs.");

      setSessionId(data.session_id);
      setStatus({
        type: "success",
        msg: `Indexed ${data.chunks} chunks. You can ask now.`,
      });
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoadingIngest(false);
    }
  };

  const ask = async () => {
    setLoadingAsk(true);
    setStatus({ type: "info", msg: "Generating answer…" });
    setAnswer("");
    setSources([]);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question: question.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to answer.");

      setAnswer(data.answer || "");
      setSources(data.sources || []);
      setStatus({ type: "success", msg: "Done." });
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoadingAsk(false);
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="logo">NR</div>
          <div className="brandText">
            <div className="brandTitle">News Research</div>
            <div className="brandSub">RAG • FastAPI • FAISS • Groq</div>
          </div>
        </div>

        <div className="topbarRight">
          <button
            className="btn btnGhost"
            onClick={resetAll}
            disabled={loadingIngest || loadingAsk}
            title="Clear URLs, question, and results"
          >
            Reset
          </button>
        </div>
      </header>

      <main className="container">
        {/* Question bar */}
        <section className="questionBar">
          <div className="qLeft">
            <div className={`readyBadge ${sessionId ? "readyOn" : "readyOff"}`}>
              <span className="dot" />
              {sessionId ? "Ready" : "Not ready"}
            </div>
            <div className="qHint">
              {sessionId
                ? "Ask a question about the indexed articles"
                : "Process URLs to enable questions"}
            </div>
          </div>

          <div className="qRight">
            <input
              className="qInput"
              placeholder='e.g. "Why did Tesla stock rise?"'
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={!sessionId}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canAsk) ask();
              }}
            />
            <button
              className="btn btnAccent"
              onClick={ask}
              disabled={!canAsk}
            >
              {loadingAsk ? "Thinking…" : "Ask"}
            </button>
          </div>
        </section>

        {/* Hero */}
        <section className="hero">
          <div className="heroText">
            <h1>
              Welcome to <span>News Research</span>
            </h1>
            <p>
              Paste article links, build a mini knowledge base, then ask questions
              with sources.
            </p>

            <div className="heroStats">
              <div className="stat">
                <div className="statLabel">URLs added</div>
                <div className="statValue">{validUrls.length}</div>
              </div>
              <div className="stat">
                <div className="statLabel">Status</div>
                <div className="statValue">{sessionId ? "Indexed" : "Waiting"}</div>
              </div>
            </div>
          </div>

          {/* Simple cartoon/logo (SVG) */}
          <div className="heroArt" aria-hidden="true">
            <svg viewBox="0 0 220 160" className="heroSvg">
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#5b2dff" stopOpacity="0.18" />
                  <stop offset="1" stopColor="#2e90fa" stopOpacity="0.16" />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#12b76a" stopOpacity="0.22" />
                  <stop offset="1" stopColor="#7c5cff" stopOpacity="0.18" />
                </linearGradient>
              </defs>

              <rect x="12" y="18" width="196" height="124" rx="26" fill="url(#g1)" />
              <rect x="130" y="32" width="62" height="62" rx="22" fill="url(#g2)" />

              {/* Cute “document” character */}
              <rect x="38" y="48" width="78" height="92" rx="16" fill="#ffffff" opacity="0.95" />
              <rect x="52" y="66" width="50" height="8" rx="4" fill="#e5e7eb" />
              <rect x="52" y="84" width="42" height="8" rx="4" fill="#e5e7eb" />
              <rect x="52" y="102" width="46" height="8" rx="4" fill="#e5e7eb" />

              {/* Face */}
              <circle cx="62" cy="58" r="3.5" fill="#111827" opacity="0.75" />
              <circle cx="74" cy="58" r="3.5" fill="#111827" opacity="0.75" />
              <path d="M60 67 C66 72, 72 72, 78 67" stroke="#111827" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round"/>

              {/* Sparkles */}
              <path d="M170 108 l6 10 l-12 0 z" fill="#ffffff" opacity="0.8"/>
              <circle cx="190" cy="112" r="5" fill="#ffffff" opacity="0.7"/>
            </svg>
          </div>
        </section>

        {/* Main grid */}
        <section className="grid">
          {/* URLs */}
          <div className="card">
            <div className="cardHead">
              <h2>Article URLs</h2>
              <span className={`pill ${sessionId ? "pillOk" : ""}`}>
                {sessionId ? "Indexed" : "Not indexed"}
              </span>
            </div>

            <p className="muted">
              Paste up to 3 URLs and click <b>Process</b>.
            </p>

            <div className="form">
              {urls.map((u, i) => (
                <div className="field" key={i}>
                  <label>URL {i + 1}</label>
                  <input
                    value={u}
                    onChange={(e) => updateUrl(i, e.target.value)}
                    placeholder="https://example.com/article"
                  />
                </div>
              ))}

              <button className="btn btnPrimary" onClick={ingest} disabled={!canProcess}>
                {loadingIngest ? "Processing…" : "Process URLs"}
              </button>
            </div>
          </div>

          {/* Answer */}
          <div className="card">
            <div className="cardHead">
              <h2>Answer</h2>
              <span className="pill">{answer ? "Available" : "—"}</span>
            </div>

            {!answer ? (
              <div className="empty">
                <div className="emptyTitle">No answer yet</div>
                <div className="emptyText">
                  Process URLs, then ask a question using the bar above.
                </div>
              </div>
            ) : (
              <div className="answerBox">
                <div className="answerText">{answer}</div>
              </div>
            )}
          </div>

          {/* Sources */}
          <div className="card span2">
            <div className="cardHead">
              <h2>Sources</h2>
              <span className="pill">{sources.length} link(s)</span>
            </div>

            {sources.length === 0 ? (
              <div className="empty">
                <div className="emptyTitle">No sources yet</div>
                <div className="emptyText">
                  Sources will appear after you ask a question.
                </div>
              </div>
            ) : (
              <ul className="sources">
                {sources.map((s, idx) => (
                  <li key={idx}>
                    <a href={s} target="_blank" rel="noreferrer">
                      {s}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Toast */}
        {status.msg && (
          <div className={`toast toast-${status.type}`}>
            <span className="toastDot" />
            <span>{status.msg}</span>
          </div>
        )}

        <footer className="footer">Built with React + FastAPI + LangChain RAG</footer>
      </main>
    </div>
  );
}