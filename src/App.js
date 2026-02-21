import { useState, useCallback } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600&family=JetBrains+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #FEE8D9;
    --surface: #E1E9C9;
    --surface2: #CADCAE;
    --border: rgba(140,115,90,0.2);
    --accent: #EDA35A;
    --accent2: #527A48;
    --danger: #B84838;
    --warn: #C97B28;
    --ok: #527A48;
    --text: #3A2518;
    --muted: #8A6E55;
    --dim: rgba(140,115,90,0.18);
  }

  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; }

  .app {
    min-height: 100vh;
    background: var(--bg);
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(237,163,90,0.14) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 90% 80%, rgba(202,220,174,0.25) 0%, transparent 50%);
  }

  .header {
    border-bottom: 1px solid var(--border);
    padding: 20px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(254,232,217,0.88);
  }

  .logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; letter-spacing: -0.5px; color: var(--text); }
  .logo span { color: var(--accent); }

  .badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    background: rgba(237,163,90,0.15);
    border: 1px solid rgba(237,163,90,0.3);
    color: var(--accent);
    padding: 3px 10px;
    border-radius: 20px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .main { max-width: 1100px; margin: 0 auto; padding: 48px 24px; }
  .upload-section { text-align: center; padding: 80px 40px; }

  .upload-title {
    font-family: 'Syne', sans-serif;
    font-size: 42px;
    font-weight: 800;
    letter-spacing: -1.5px;
    line-height: 1.1;
    margin-bottom: 16px;
  }
  .upload-title span {
    background: linear-gradient(135deg, var(--accent), #D07B2F);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .upload-sub { color: var(--muted); font-size: 16px; margin-bottom: 48px; font-weight: 400; }

  .drop-zone {
    border: 1.5px dashed rgba(237,163,90,0.4);
    border-radius: 20px;
    padding: 60px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(237,163,90,0.04);
    max-width: 560px;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
  }
  .drop-zone::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 60% at 50% 50%, rgba(237,163,90,0.08) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s;
  }
  .drop-zone:hover { border-color: rgba(237,163,90,0.7); }
  .drop-zone:hover::before { opacity: 1; }
  .drop-zone.drag-over { border-color: var(--accent); background: rgba(237,163,90,0.08); }

  .drop-icon {
    width: 56px; height: 56px;
    margin: 0 auto 20px;
    background: rgba(237,163,90,0.14);
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
  }
  .drop-label { font-size: 16px; color: var(--text); font-weight: 500; margin-bottom: 8px; }
  .drop-hint { font-size: 13px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  .file-input { display: none; }

  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 28px; border-radius: 10px;
    font-size: 14px; font-weight: 500; cursor: pointer;
    border: none; transition: all 0.2s ease;
    font-family: 'Inter', sans-serif;
  }
  .btn-ghost { background: rgba(58,37,24,0.06); color: var(--muted); border: 1px solid var(--border); }
  .btn-ghost:hover { background: rgba(58,37,24,0.1); color: var(--text); }

  .loading-state { text-align: center; padding: 80px 40px; }
  .pulse-ring {
    width: 80px; height: 80px; border-radius: 50%;
    border: 2px solid transparent;
    border-top-color: var(--accent);
    border-right-color: rgba(237,163,90,0.3);
    animation: spin 1s linear infinite;
    margin: 0 auto 24px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .loading-sub { color: var(--muted); font-size: 14px; font-family: 'JetBrains Mono', monospace; }

  .results-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 40px; gap: 20px; flex-wrap: wrap; }
  .results-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
  .results-meta { font-size: 13px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }

  .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 40px; }
  .summary-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; text-align: center; }
  .summary-card .s-num { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
  .summary-card .s-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; font-family: 'JetBrains Mono', monospace; }
  .c-ok .s-num { color: var(--ok); }
  .c-warn .s-num { color: var(--warn); }
  .c-danger .s-num { color: var(--danger); }
  .c-total .s-num { color: var(--accent); }

  .section-title {
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase; color: var(--muted);
    margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
  }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .markers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 40px; }

  .marker-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; padding: 20px; position: relative; overflow: hidden;
  }
  .marker-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; border-radius: 3px 0 0 3px;
  }
  .marker-card.status-ok::before { background: var(--ok); }
  .marker-card.status-high::before { background: var(--danger); }
  .marker-card.status-low::before { background: var(--warn); }

  .marker-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .marker-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  .marker-category { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  .marker-value { text-align: right; }
  .marker-value .val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; line-height: 1; }
  .marker-value .unit { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }
  .status-ok .val { color: var(--ok); }
  .status-high .val { color: var(--danger); }
  .status-low .val { color: var(--warn); }

  .range-bar-wrap { margin-bottom: 10px; }
  .range-bar-track { height: 6px; background: var(--dim); border-radius: 10px; position: relative; margin-bottom: 4px; }
  .range-bar-ok { position: absolute; top: 0; height: 100%; background: rgba(82,122,72,0.18); border-radius: 2px; }
  .range-bar-marker {
    position: absolute; top: -3px; width: 12px; height: 12px;
    border-radius: 50%; transform: translateX(-50%);
    border: 2px solid var(--bg); box-shadow: 0 0 8px currentColor;
  }
  .status-ok .range-bar-marker { background: var(--ok); color: var(--ok); }
  .status-high .range-bar-marker { background: var(--danger); color: var(--danger); }
  .status-low .range-bar-marker { background: var(--warn); color: var(--warn); }
  .range-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }

  .status-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px; font-size: 11px;
    font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
  }
  .pill-ok   { background: rgba(82,122,72,0.12);  color: var(--ok);     border: 1px solid rgba(82,122,72,0.25); }
  .pill-high { background: rgba(184,72,56,0.1);   color: var(--danger); border: 1px solid rgba(184,72,56,0.22); }
  .pill-low  { background: rgba(201,123,40,0.1);  color: var(--warn);   border: 1px solid rgba(201,123,40,0.22); }

  .insights-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; margin-bottom: 32px; }
  .insights-panel h3 { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
  .insight-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
  .insight-icon.blue { background: rgba(237,163,90,0.14); }
  .insight-icon.teal { background: rgba(202,220,174,0.5); }
  .insight-text { font-size: 14px; line-height: 1.7; color: var(--muted); }

  .lifestyle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; margin-top: 16px; }
  .lifestyle-item { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; gap: 12px; align-items: flex-start; }
  .lifestyle-emoji { font-size: 22px; flex-shrink: 0; margin-top: 2px; }
  .lifestyle-label { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
  .lifestyle-desc { font-size: 12px; color: var(--muted); line-height: 1.5; }

  .disclaimer {
    background: rgba(201,123,40,0.06); border: 1px solid rgba(201,123,40,0.18);
    border-radius: 12px; padding: 16px 20px; font-size: 12px; color: var(--muted);
    line-height: 1.6; display: flex; gap: 12px; align-items: flex-start; margin-top: 32px;
  }
  .disclaimer-icon { color: var(--warn); font-size: 16px; flex-shrink: 0; margin-top: 1px; }

  .tabs {
    display: flex; gap: 4px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 12px;
    padding: 4px; margin-bottom: 32px; width: fit-content;
  }
  .tab {
    padding: 8px 20px; border-radius: 9px; font-size: 13px; font-weight: 500;
    cursor: pointer; border: none; background: transparent; color: var(--muted);
    font-family: 'Inter', sans-serif; transition: all 0.2s;
  }
  .tab.active { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }

  @media (max-width: 600px) {
    .header { padding: 16px 20px; }
    .main { padding: 32px 16px; }
    .upload-title { font-size: 28px; }
    .drop-zone { padding: 40px 20px; }
    .markers-grid { grid-template-columns: 1fr; }
  }
`;

// ── helpers ───────────────────────────────────────────────────────────────────

function getStatus(value, low, high) {
  if (value < low) return "low";
  if (value > high) return "high";
  return "ok";
}

function StatusPill({ status }) {
  const map = { ok: ["pill-ok", "Normal"], high: ["pill-high", "High"], low: ["pill-low", "Low"] };
  const [cls, label] = map[status] || map.ok;
  return <span className={"status-pill " + cls}>{label}</span>;
}

function RangeBar({ value, low, high, status }) {
  const min     = low * 0.5;
  const max     = high * 1.5;
  const range   = max - min;
  const pct     = Math.min(Math.max(((value - min) / range) * 100, 4), 96);
  const okLeft  = ((low  - min) / range) * 100;
  const okWidth = ((high - low) / range) * 100;
  return (
    <div className="range-bar-wrap">
      <div className="range-bar-track">
        <div className="range-bar-ok" style={{ left: okLeft + "%", width: okWidth + "%" }} />
        <div className={"range-bar-marker status-" + status} style={{ left: pct + "%" }} />
      </div>
      <div className="range-labels">
        <span>{low}</span><span>Normal range</span><span>{high}</span>
      </div>
    </div>
  );
}

function MarkerCard({ marker }) {
  const { name, value, unit, low, high, category } = marker;
  const status = getStatus(value, low, high);
  return (
    <div className={"marker-card status-" + status}>
      <div className="marker-top">
        <div>
          <div className="marker-name">{name}</div>
          <div className="marker-category">{category}</div>
        </div>
        <div className={"marker-value status-" + status}>
          <div className="val">{value}</div>
          <div className="unit">{unit}</div>
        </div>
      </div>
      <RangeBar value={value} low={low} high={high} status={status} />
      <StatusPill status={status} />
    </div>
  );
}

// ── API helpers ───────────────────────────────────────────────────────────────

function buildContentBlock(base64Data, mediaType) {
  if (mediaType === "application/pdf") {
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: base64Data }
    };
  }
  return {
    type: "image",
    source: { type: "base64", media_type: mediaType, data: base64Data }
  };
}

function repairJSON(raw) {
  var s = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  try { return JSON.parse(s); } catch (e1) {
    // Trim to last closing brace and re-balance brackets
    var lastBrace = s.lastIndexOf("}");
    if (lastBrace !== -1) { s = s.slice(0, lastBrace + 1); }
    var opens  = (s.match(/\[/g) || []).length - (s.match(/\]/g) || []).length;
    var braces = (s.match(/\{/g) || []).length - (s.match(/\}/g) || []).length;
    for (var i = 0; i < opens;  i++) { s += "]"; }
    for (var j = 0; j < braces; j++) { s += "}"; }
    return JSON.parse(s);
  }
}

async function analyzeReport(base64Data, mediaType) {
  var systemPrompt =
    "You are a clinical health data analyst. Extract all blood markers from the uploaded lab report. " +
    "Return ONLY a valid JSON object with no markdown, no preamble, no extra text. " +
    "Structure: {\"patientName\":\"string\",\"reportDate\":\"string\",\"markers\":[{\"name\":\"string\",\"value\":number,\"unit\":\"string\",\"low\":number,\"high\":number,\"category\":\"string\"}],\"lifestyle\":[{\"emoji\":\"string\",\"label\":\"string\",\"desc\":\"string\"}],\"interpretation\":\"string\"}. " +
    "Rules: extract ALL visible markers. Keep lifestyle to 4 items max with one sentence each. Keep interpretation to 2 sentences max. Output ONLY the raw JSON object.";

  var response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: [
          buildContentBlock(base64Data, mediaType),
          { type: "text", text: "Analyze this blood test report and return the JSON." }
        ]
      }]
    })
  });

  var data = await response.json();

  if (!response.ok) {
    var msg = (data.error && data.error.message) ? data.error.message : JSON.stringify(data);
    throw new Error("API error " + response.status + ": " + msg);
  }
  if (!data.content || data.content.length === 0) {
    throw new Error("Empty response from API");
  }

  var raw = data.content.map(function(b) { return b.text || ""; }).join("");
  return repairJSON(raw);
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [stage,     setStage]     = useState("upload");
  const [results,   setResults]   = useState(null);
  const [activeTab, setActiveTab] = useState("markers");
  const [dragOver,  setDragOver]  = useState(false);
  const [error,     setError]     = useState(null);

  const handleFile = useCallback(async function(file) {
    if (!file) return;
    setError(null);
    setStage("loading");
    try {
      var base64 = await new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onload  = function() { resolve(reader.result.split(",")[1]); };
        reader.onerror = function() { reject(new Error("Failed to read file")); };
        reader.readAsDataURL(file);
      });
      var mediaType = file.type === "application/pdf" ? "application/pdf" : (file.type || "image/jpeg");
      var data = await analyzeReport(base64, mediaType);
      setResults(data);
      setActiveTab("markers");
      setStage("results");
    } catch (e) {
      console.error("VitaScan error:", e);
      setError(e.message || "Could not analyze the report. Please try again.");
      setStage("upload");
    }
  }, []);

  const onDrop = useCallback(function(e) {
    e.preventDefault();
    setDragOver(false);
    var file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  var markers   = (results && results.markers)   || [];
  var lifestyle = (results && results.lifestyle) || [];

  var counts = {
    total: markers.length,
    ok:    markers.filter(function(m) { return getStatus(m.value, m.low, m.high) === "ok";   }).length,
    high:  markers.filter(function(m) { return getStatus(m.value, m.low, m.high) === "high"; }).length,
    low:   markers.filter(function(m) { return getStatus(m.value, m.low, m.high) === "low";  }).length,
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <header className="header">
          <div className="logo">vita<span>scan</span></div>
          <span className="badge">Phase 1 — Prototype</span>
        </header>

        <main className="main">

          {stage === "upload" && (
            <div className="upload-section">
              <h1 className="upload-title">Your blood work,<br /><span>decoded.</span></h1>
              <p className="upload-sub">Upload your lab report and get instant visual insights and lifestyle guidance.</p>
              <div
                className={"drop-zone" + (dragOver ? " drag-over" : "")}
                onDragOver={function(e) { e.preventDefault(); setDragOver(true); }}
                onDragLeave={function() { setDragOver(false); }}
                onDrop={onDrop}
                onClick={function() { document.getElementById("file-input").click(); }}
              >
                <div className="drop-icon">🧬</div>
                <div className="drop-label">Drop your lab report here</div>
                <div className="drop-hint">PDF · JPG · PNG supported</div>
                <input
                  id="file-input"
                  type="file"
                  className="file-input"
                  accept="image/*,application/pdf"
                  onChange={function(e) { handleFile(e.target.files[0]); }}
                />
              </div>
              {error && <p style={{ color: "var(--danger)", marginTop: 20, fontSize: 14 }}>{error}</p>}
              <p style={{ marginTop: 24, fontSize: 12, color: "var(--muted)" }}>Your report is processed securely and never stored.</p>
            </div>
          )}

          {stage === "loading" && (
            <div className="loading-state">
              <div className="pulse-ring" />
              <div className="loading-text">Analyzing your report</div>
              <div className="loading-sub">Extracting markers · Interpreting results · Generating guidance</div>
            </div>
          )}

          {stage === "results" && results && (
            <>
              <div className="results-header">
                <div>
                  <div className="results-title">Lab Results Overview</div>
                  <div className="results-meta">
                    {results.patientName && results.patientName !== "Unknown" ? results.patientName + " · " : ""}
                    {results.reportDate  && results.reportDate  !== "Unknown" ? results.reportDate  + " · " : ""}
                    {counts.total} markers analyzed
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={function() { setStage("upload"); setResults(null); }}>
                  Upload New Report
                </button>
              </div>

              <div className="summary-cards">
                <div className="summary-card c-total"><div className="s-num">{counts.total}</div><div className="s-label">Markers</div></div>
                <div className="summary-card c-ok">   <div className="s-num">{counts.ok}</div>   <div className="s-label">Normal</div></div>
                <div className="summary-card c-danger"><div className="s-num">{counts.high}</div> <div className="s-label">High</div></div>
                <div className="summary-card c-warn">  <div className="s-num">{counts.low}</div>  <div className="s-label">Low</div></div>
              </div>

              <div className="tabs">
                {["markers", "insights", "lifestyle"].map(function(t) {
                  return (
                    <button key={t} className={"tab" + (activeTab === t ? " active" : "")} onClick={function() { setActiveTab(t); }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  );
                })}
              </div>

              {activeTab === "markers" && (
                <>
                  {counts.high > 0 && (
                    <>
                      <div className="section-title">Needs Attention</div>
                      <div className="markers-grid">
                        {markers.filter(function(m) { return getStatus(m.value, m.low, m.high) === "high"; }).map(function(m, i) { return <MarkerCard key={i} marker={m} />; })}
                      </div>
                    </>
                  )}
                  {counts.low > 0 && (
                    <>
                      <div className="section-title">Below Range</div>
                      <div className="markers-grid">
                        {markers.filter(function(m) { return getStatus(m.value, m.low, m.high) === "low"; }).map(function(m, i) { return <MarkerCard key={i} marker={m} />; })}
                      </div>
                    </>
                  )}
                  <div className="section-title">Within Normal Range</div>
                  <div className="markers-grid">
                    {markers.filter(function(m) { return getStatus(m.value, m.low, m.high) === "ok"; }).map(function(m, i) { return <MarkerCard key={i} marker={m} />; })}
                  </div>
                </>
              )}

              {activeTab === "insights" && (
                <div className="insights-panel">
                  <h3><div className="insight-icon blue">🔬</div>Clinical Interpretation</h3>
                  {results.interpretation && results.interpretation.split("\n").filter(Boolean).map(function(p, i) {
                    return <p key={i} className="insight-text" style={{ marginBottom: 14 }}>{p}</p>;
                  })}
                </div>
              )}

              {activeTab === "lifestyle" && (
                <div className="insights-panel">
                  <h3><div className="insight-icon teal">🌿</div>Lifestyle and Nutrition Guidance</h3>
                  <p className="insight-text" style={{ marginBottom: 20 }}>Personalized recommendations based on your results:</p>
                  <div className="lifestyle-grid">
                    {lifestyle.map(function(item, i) {
                      return (
                        <div key={i} className="lifestyle-item">
                          <span className="lifestyle-emoji">{item.emoji}</span>
                          <div>
                            <div className="lifestyle-label">{item.label}</div>
                            <div className="lifestyle-desc">{item.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="disclaimer">
                <span className="disclaimer-icon">⚠</span>
                <span>
                  This analysis is for informational purposes only and does not constitute medical advice.
                  Always consult a qualified healthcare professional before making any health decisions.
                </span>
              </div>
            </>
          )}

        </main>
      </div>
    </>
  );
}
