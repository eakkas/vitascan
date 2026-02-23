import { useState, useCallback, useEffect } from "react";
import { supabase } from './supabase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceArea, ResponsiveContainer } from "recharts";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap');

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

  body { background: var(--bg); color: var(--text); font-family: 'Open Sans', sans-serif; }

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

  .logo { font-family: 'Open Sans', sans-serif; font-weight: 800; font-size: 22px; letter-spacing: -0.5px; color: var(--text); }
  .logo span { color: var(--accent); }

  .badge {
    font-family: 'Open Sans', sans-serif;
    font-weight: 600;
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
    font-family: 'Open Sans', sans-serif;
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

  .upload-sub { color: var(--muted); font-size: 16px; margin-bottom: 48px; font-weight: 300; }

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
  .drop-hint { font-size: 13px; color: var(--muted); font-family: 'Open Sans', sans-serif; font-weight: 300; }
  .file-input { display: none; }

  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 28px; border-radius: 10px;
    font-size: 14px; font-weight: 500; cursor: pointer;
    border: none; transition: all 0.2s ease;
    font-family: 'Open Sans', sans-serif;
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
  .loading-text { font-family: 'Open Sans', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .loading-sub { color: var(--muted); font-size: 14px; font-family: 'Open Sans', sans-serif; font-weight: 300; }

  .results-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 40px; gap: 20px; flex-wrap: wrap; }
  .results-title { font-family: 'Open Sans', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
  .results-meta { font-size: 13px; color: var(--muted); font-family: 'Open Sans', sans-serif; font-weight: 300; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .cached-badge { font-size: 10px; background: rgba(82,122,72,0.12); border: 1px solid rgba(82,122,72,0.25); color: var(--ok); padding: 2px 8px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }

  .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 40px; }
  .summary-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 20px; text-align: center; }
  .summary-card .s-num { font-family: 'Open Sans', sans-serif; font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
  .summary-card .s-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; font-family: 'Open Sans', sans-serif; font-weight: 600; }
  .c-ok .s-num { color: var(--ok); }
  .c-warn .s-num { color: var(--warn); }
  .c-danger .s-num { color: var(--danger); }
  .c-total .s-num { color: var(--accent); }

  .section-title {
    font-family: 'Open Sans', sans-serif; font-size: 14px; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase; color: var(--muted);
    margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
  }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .health-section { margin-bottom: 40px; }
  .health-section-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px; padding-bottom: 12px;
    border-bottom: 1.5px solid var(--border);
  }
  .health-section-emoji { font-size: 18px; line-height: 1; }
  .health-section-label { font-family: 'Open Sans', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); flex: 1; }
  .health-section-alert {
    font-family: 'Open Sans', sans-serif; font-size: 10px; font-weight: 600;
    background: rgba(184,72,56,0.1); color: var(--danger);
    border: 1px solid rgba(184,72,56,0.22); padding: 2px 9px;
    border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase;
  }

  .markers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 8px; }

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
  .marker-category { font-size: 11px; color: var(--muted); font-family: 'Open Sans', sans-serif; font-weight: 600; letter-spacing: 0.3px; }
  .marker-value { text-align: right; }
  .marker-value .val { font-family: 'Open Sans', sans-serif; font-size: 22px; font-weight: 800; line-height: 1; }
  .marker-value .unit { font-size: 11px; color: var(--muted); font-family: 'Open Sans', sans-serif; font-weight: 600; }
  .status-ok .val { color: var(--ok); }
  .status-high .val { color: var(--danger); }
  .status-low .val { color: var(--warn); }

  .marker-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
  .info-btn {
    background: none; border: none; cursor: pointer; font-size: 16px;
    color: var(--muted); padding: 2px 4px; border-radius: 6px;
    transition: all 0.15s; line-height: 1; opacity: 0.7;
  }
  .info-btn:hover  { opacity: 1; color: var(--accent); }
  .info-btn-active { opacity: 1; color: var(--accent); }
  .info-panel {
    margin-top: 12px; padding-top: 12px;
    border-top: 1px dashed var(--border);
    animation: fadeIn 0.18s ease;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  .info-block { margin-bottom: 10px; }
  .info-block:last-child { margin-bottom: 0; }
  .info-block-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--muted); margin-bottom: 4px; }
  .info-block-text  { font-size: 12px; line-height: 1.65; color: var(--text); font-weight: 400; }
  .info-loading { font-size: 12px; color: var(--muted); font-style: italic; }
  .info-error   { font-size: 12px; color: var(--danger); cursor: pointer; }

  .range-bar-wrap { margin-bottom: 6px; }
  .range-bar-track { height: 6px; background: var(--dim); border-radius: 10px; position: relative; margin-bottom: 4px; }
  .range-bar-ok { position: absolute; top: 0; height: 100%; background: rgba(82,122,72,0.18); border-radius: 2px; }
  .range-bar-marker {
    position: absolute; top: -3px; width: 12px; height: 12px;
    border-radius: 50%; transform: translateX(-50%);
    border: 2px solid var(--bg); box-shadow: 0 0 8px currentColor;
    z-index: 2;
  }
  .status-ok .range-bar-marker { background: var(--ok); color: var(--ok); }
  .status-high .range-bar-marker { background: var(--danger); color: var(--danger); }
  .status-low .range-bar-marker { background: var(--warn); color: var(--warn); }
  .range-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); font-family: 'Open Sans', sans-serif; font-weight: 400; }

  .status-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px; font-size: 11px;
    font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
    font-family: 'Open Sans', sans-serif;
  }
  .pill-ok   { background: rgba(82,122,72,0.12);  color: var(--ok);     border: 1px solid rgba(82,122,72,0.25); }
  .pill-high { background: rgba(184,72,56,0.1);   color: var(--danger); border: 1px solid rgba(184,72,56,0.22); }
  .pill-low  { background: rgba(201,123,40,0.1);  color: var(--warn);   border: 1px solid rgba(201,123,40,0.22); }

  .insights-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; margin-bottom: 32px; }
  .insights-panel h3 { font-family: 'Open Sans', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
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
    font-family: 'Open Sans', sans-serif; transition: all 0.2s;
  }
  .tab.active { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }

  /* ── Auth screen ── */
  .auth-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--bg);
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(237,163,90,0.14) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 90% 80%, rgba(202,220,174,0.25) 0%, transparent 50%);
  }

  .auth-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 48px 40px;
    max-width: 420px;
    width: 100%;
    text-align: center;
    box-shadow: 0 8px 40px rgba(58,37,24,0.08);
  }

  .auth-logo {
    font-family: 'Open Sans', sans-serif;
    font-weight: 800;
    font-size: 32px;
    letter-spacing: -1px;
    color: var(--text);
    margin-bottom: 8px;
  }
  .auth-logo span { color: var(--accent); }

  .auth-tagline {
    font-size: 14px;
    color: var(--muted);
    margin-bottom: 40px;
    font-weight: 300;
  }

  .btn-google {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 13px 20px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: white;
    font-family: 'Open Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #3c4043;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-google:hover { background: #f8f9fa; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

  .auth-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0;
    font-size: 12px;
    color: var(--muted);
  }
  .auth-divider::before, .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .auth-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: rgba(255,255,255,0.6);
    font-family: 'Open Sans', sans-serif;
    font-size: 14px;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s;
    margin-bottom: 12px;
    display: block;
  }
  .auth-input:focus { border-color: var(--accent); }
  .auth-input::placeholder { color: var(--muted); }

  .btn-primary {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: none;
    background: var(--accent);
    color: white;
    font-family: 'Open Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .btn-primary:hover { opacity: 0.88; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .auth-error { font-size: 13px; color: var(--danger); margin-top: 14px; }
  .auth-success {
    font-size: 14px; color: var(--ok); margin-top: 14px; line-height: 1.6;
    background: rgba(82,122,72,0.08); border: 1px solid rgba(82,122,72,0.2);
    border-radius: 10px; padding: 14px 16px;
  }

  /* ── Header user area ── */
  .header-right { display: flex; align-items: center; gap: 8px; }

  .header-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--accent);
    color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    flex-shrink: 0;
  }

  .header-email {
    font-size: 13px;
    color: var(--muted);
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .icon-btn {
    background: none;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 6px 10px;
    cursor: pointer;
    font-size: 15px;
    color: var(--muted);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    line-height: 1;
  }
  .icon-btn:hover { background: rgba(58,37,24,0.06); color: var(--text); }

  /* ── History view ── */
  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .history-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .report-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .report-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--accent);
    border-radius: 3px 0 0 3px;
  }
  .report-card:hover { border-color: rgba(237,163,90,0.5); transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.07); }

  .report-card-name { font-size: 15px; font-weight: 700; margin-bottom: 4px; color: var(--text); }
  .report-card-date { font-size: 12px; color: var(--muted); margin-bottom: 18px; font-weight: 300; }
  .report-card-stats { display: flex; gap: 16px; }
  .report-stat { text-align: center; }
  .report-stat-num { font-size: 22px; font-weight: 800; line-height: 1; margin-bottom: 2px; }
  .report-stat-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .report-stat.s-ok .report-stat-num { color: var(--ok); }
  .report-stat.s-high .report-stat-num { color: var(--danger); }
  .report-stat.s-low .report-stat-num { color: var(--warn); }
  .report-stat.s-total .report-stat-num { color: var(--accent); }

  /* ── Debug table ── */
  .debug-wrap { overflow-x: auto; }
  .debug-table { border-collapse: collapse; width: 100%; font-size: 12px; font-family: 'Open Sans', sans-serif; }
  .debug-table th { background: var(--surface2); border: 1px solid var(--border); padding: 8px 12px; text-align: left; font-weight: 700; white-space: nowrap; position: sticky; top: 0; }
  .debug-table th.col-marker { position: sticky; left: 0; z-index: 2; min-width: 180px; }
  .debug-table td { border: 1px solid var(--border); padding: 6px 12px; white-space: nowrap; background: var(--surface); }
  .debug-table td.col-marker { font-weight: 600; position: sticky; left: 0; background: var(--surface2); z-index: 1; }
  .debug-table tr:hover td { background: rgba(237,163,90,0.07); }
  .debug-table tr:hover td.col-marker { background: var(--surface2); }
  .debug-cell-ok   { color: var(--ok); }
  .debug-cell-high { color: var(--danger); font-weight: 600; }
  .debug-cell-low  { color: var(--warn);   font-weight: 600; }
  .debug-cell-none { color: var(--muted);  }

  .year-divider {
    font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
    color: var(--muted); margin: 28px 0 16px; display: flex; align-items: center; gap: 12px;
  }
  .year-divider:first-child { margin-top: 0; }
  .year-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .history-empty {
    text-align: center;
    padding: 80px 40px;
    color: var(--muted);
  }
  .history-empty-icon { font-size: 48px; margin-bottom: 20px; }
  .history-empty-text { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--text); }
  .history-empty-sub { font-size: 14px; font-weight: 300; }

  /* ── Profile screen ── */
  .profile-screen { max-width: 560px; margin: 0 auto; }
  .form-group { margin-bottom: 24px; }
  .form-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--muted); margin-bottom: 8px; display: block; }
  .form-input { width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: 10px; background: rgba(255,255,255,0.6); font-family: 'Open Sans', sans-serif; font-size: 14px; color: var(--text); outline: none; transition: border-color 0.2s; }
  .form-input:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--muted); }
  .radio-group { display: flex; gap: 10px; flex-wrap: wrap; }
  .radio-option { display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 8px 16px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--muted); transition: all 0.15s; user-select: none; }
  .radio-option:hover { border-color: rgba(237,163,90,0.5); color: var(--text); }
  .radio-option.selected { border-color: var(--accent); background: rgba(237,163,90,0.1); color: var(--text); }
  .radio-option input { display: none; }
  .checkbox-group { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
  .checkbox-option { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--muted); transition: all 0.15s; user-select: none; }
  .checkbox-option:hover { border-color: rgba(237,163,90,0.5); color: var(--text); }
  .checkbox-option.selected { border-color: var(--accent); background: rgba(237,163,90,0.1); color: var(--text); }
  .checkbox-option input { display: none; }
  .profile-actions { display: flex; gap: 12px; margin-top: 32px; }
  .profile-error { font-size: 13px; color: var(--danger); margin-top: 12px; }

  /* ── Trends screen ── */
  .chip-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
  .chip { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; border: 1px solid var(--border); background: var(--surface); cursor: pointer; color: var(--muted); transition: all 0.15s; font-family: 'Open Sans', sans-serif; text-transform: capitalize; }
  .chip:hover { border-color: rgba(237,163,90,0.5); color: var(--text); }
  .chip.chip-active { border-color: var(--accent); background: rgba(237,163,90,0.12); color: var(--text); font-weight: 600; }
  .trend-chart-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; }
  .trend-chart-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; text-transform: capitalize; }
  .trend-chart-unit { font-size: 12px; color: var(--muted); margin-bottom: 24px; }
  .trends-empty { text-align: center; padding: 80px 40px; color: var(--muted); }
  .trends-empty-icon { font-size: 48px; margin-bottom: 20px; }
  .trends-empty-text { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--text); }
  .trends-empty-sub { font-size: 14px; font-weight: 300; }

  /* ── Optimal ranges ── */
  .range-bar-optimal { position: absolute; top: 0; height: 100%; background: rgba(237,163,90,0.35); border-radius: 2px; z-index: 1; }

  @media (max-width: 600px) {
    .header { padding: 16px 20px; }
    .header-email { display: none; }
    .main { padding: 32px 16px; }
    .upload-title { font-size: 28px; }
    .drop-zone { padding: 40px 20px; }
    .markers-grid { grid-template-columns: 1fr; }
    .auth-card { padding: 36px 24px; }
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

function RangeBar({ value, low, high, status, optimalLow, optimalHigh }) {
  const min     = low * 0.5;
  const max     = high * 1.5;
  const range   = max - min;
  const pct     = Math.min(Math.max(((value - min) / range) * 100, 4), 96);
  const okLeft  = ((low  - min) / range) * 100;
  const okWidth = ((high - low) / range) * 100;

  var hasOptimal = optimalLow !== null && optimalLow !== undefined
    && optimalHigh !== null && optimalHigh !== undefined;
  var optLeft  = hasOptimal ? ((optimalLow  - min) / range) * 100 : 0;
  var optWidth = hasOptimal ? ((optimalHigh - optimalLow) / range) * 100 : 0;

  return (
    <div className="range-bar-wrap">
      <div className="range-bar-track">
        <div className="range-bar-ok" style={{ left: okLeft + "%", width: okWidth + "%" }} />
        {hasOptimal && (
          <div className="range-bar-optimal" style={{ left: optLeft + "%", width: optWidth + "%" }} />
        )}
        <div className={"range-bar-marker status-" + status} style={{ left: pct + "%" }} />
      </div>
      <div className="range-labels">
        <span>{low}</span>
        <span>
          Normal
          {hasOptimal && (
            <> · <span style={{ color: "var(--accent)" }}>Optimal</span></>
          )}
        </span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function MarkerCard({ marker, unitSystem }) {
  const { name, value, unit, low, high, category } = marker;
  var dispVal  = displayConvert(value, name, unitSystem);
  var dispLow  = displayConvert(low,   name, unitSystem);
  var dispHigh = displayConvert(high,  name, unitSystem);
  var dispUnit = displayUnit(name, unit, unitSystem);
  const status = getStatus(dispVal, dispLow, dispHigh);
  var optimal  = getOptimalRange(name);
  var dispOptLow  = optimal ? displayConvert(optimal.low,  name, unitSystem) : null;
  var dispOptHigh = optimal ? displayConvert(optimal.high, name, unitSystem) : null;
  const [expanded,    setExpanded]    = useState(false);
  const [info,        setInfo]        = useState(() => loadMarkerInfo(name));
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [infoError,   setInfoError]   = useState(null);

  function handleInfoClick(e) {
    e.stopPropagation();
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (info) return;
    setLoadingInfo(true);
    setInfoError(null);
    fetchMarkerInfo(name)
      .then(function(data) { setInfo(data); setLoadingInfo(false); })
      .catch(function()    { setInfoError("Could not load info. Tap to retry."); setLoadingInfo(false); });
  }

  return (
    <div className={"marker-card status-" + status}>
      <div className="marker-top">
        <div>
          <div className="marker-name">{name}</div>
          <div className="marker-category">{category}</div>
        </div>
        <div className={"marker-value status-" + status}>
          <div className="val">{dispVal}</div>
          <div className="unit">{dispUnit}</div>
        </div>
      </div>
      <RangeBar value={dispVal} low={dispLow} high={dispHigh} status={status}
        optimalLow={dispOptLow}
        optimalHigh={dispOptHigh} />
      <div className="marker-footer">
        <StatusPill status={status} />
        <button className={"info-btn" + (expanded ? " info-btn-active" : "")} onClick={handleInfoClick} title="What is this marker?">ⓘ</button>
      </div>
      {expanded && (
        <div className="info-panel">
          {loadingInfo && <div className="info-loading">Loading…</div>}
          {infoError   && <div className="info-error" onClick={handleInfoClick}>{infoError}</div>}
          {info && !loadingInfo && (
            <>
              <div className="info-block">
                <div className="info-block-label">What is this?</div>
                <div className="info-block-text">{info.what}</div>
              </div>
              <div className="info-block">
                <div className="info-block-label">What does it mean?</div>
                <div className="info-block-text">{info.implications}</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Marker sections ───────────────────────────────────────────────────────────

var MARKER_SECTIONS = [
  {
    id: "cardiovascular", label: "Heart & Cardiovascular", emoji: "❤️",
    keywords: ["cholesterol", "ldl", "hdl", "triglyceride", "vldl", "lipoprotein",
      "apolipoprotein", "apob", "apoa", "apo b", "apo a", "homocysteine",
      "bnp", "nt-probnp", "troponin", "creatine kinase", "ck-mb", "ck mb",
      "hs-crp", "hscrp", "c-reactive protein", "non-hdl", "cardiac", "d-dimer"]
  },
  {
    id: "liver", label: "Liver Health", emoji: "🫁",
    keywords: ["alt", "alanine aminotransferase", "sgpt", "ast", "aspartate aminotransferase",
      "sgot", "alp", "alkaline phosphatase", "ggt", "gamma-glutamyl", "gamma glutamyl",
      "bilirubin", "albumin", "total protein", "globulin", "a/g ratio", "ag ratio",
      "prothrombin", "inr", "lactate dehydrogenase", "ldh"]
  },
  {
    id: "kidney", label: "Kidney Health", emoji: "🫘",
    keywords: ["creatinine", "bun", "blood urea nitrogen", "urea", "egfr", "gfr",
      "uric acid", "cystatin", "microalbumin", "uacr", "renal", "bun/creatinine"]
  },
  {
    id: "blood_sugar", label: "Blood Sugar & Metabolic", emoji: "🩸",
    keywords: ["glucose", "hba1c", "hemoglobin a1c", "haemoglobin a1c", "glycated hemoglobin",
      "insulin", "homa", "c-peptide", "c peptide", "fructosamine", "blood sugar"]
  },
  {
    id: "blood_count", label: "Complete Blood Count", emoji: "🔬",
    keywords: ["wbc", "white blood cell", "white blood count", "rbc", "red blood cell",
      "red blood count", "hemoglobin", "haemoglobin", "hematocrit", "haematocrit",
      "mcv", "mch", "mchc", "rdw", "platelet", "plt", "mpv",
      "neutrophil", "lymphocyte", "monocyte", "eosinophil", "basophil", "reticulocyte"]
  },
  {
    id: "thyroid", label: "Thyroid", emoji: "🦋",
    keywords: ["tsh", "thyroid stimulating", "thyrotropin", "free t4", "ft4", "thyroxine",
      "free t3", "ft3", "triiodothyronine", "anti-tpo", "anti tpo", "thyroid peroxidase",
      "anti-tg", "thyroglobulin", "reverse t3", "rt3", "thyroid"]
  },
  {
    id: "vitamins", label: "Vitamins & Minerals", emoji: "💊",
    keywords: ["vitamin d", "25-oh", "25 oh", "vitamin b12", "b12", "cobalamin",
      "folate", "folic acid", "vitamin b6", "pyridoxine", "vitamin c", "ascorbic",
      "vitamin a", "retinol", "vitamin e", "tocopherol", "vitamin k",
      "ferritin", "tibc", "transferrin saturation", "zinc", "magnesium",
      "selenium", "copper", "phosphorus", "phosphate", "iodine"]
  },
  {
    id: "electrolytes", label: "Electrolytes", emoji: "⚡",
    keywords: ["sodium", "potassium", "chloride", "bicarbonate", "co2", "carbon dioxide",
      "anion gap", "osmolality", "osmolarity"]
  },
  {
    id: "hormones", label: "Hormones", emoji: "⚗️",
    keywords: ["testosterone", "estradiol", "estrogen", "oestradiol", "progesterone",
      "fsh", "follicle stimulating", "lh", "luteinizing", "luteinising",
      "prolactin", "dhea", "cortisol", "shbg", "sex hormone binding",
      "igf", "growth hormone", "psa", "prostate specific", "amh", "anti-mullerian",
      "androstenedione", "dihydrotestosterone", "dht", "parathyroid", "pth"]
  },
  {
    id: "inflammation", label: "Inflammation & Immunity", emoji: "🛡️",
    keywords: ["crp", "c-reactive protein", "esr", "erythrocyte sedimentation",
      "interleukin", "il-6", "tnf", "procalcitonin", "pct",
      "complement", "immunoglobulin", "igg", "iga", "igm",
      "ana", "antinuclear", "rheumatoid factor", "anti-ccp"]
  },
  {
    id: "bone", label: "Bone Health", emoji: "🦴",
    keywords: ["calcium", "osteocalcin", "ctx", "c-telopeptide", "bone density",
      "deoxypyridinoline", "p1np", "bone alkaline"]
  },
  {
    id: "iron", label: "Iron Studies", emoji: "🔩",
    keywords: ["iron", "serum iron", "tibc", "transferrin", "ferritin", "saturation"]
  },
];

var CONDITION_OPTIONS = ["Diabetes","Hypertension","High Cholesterol","Thyroid Disorder","Anemia","Other"];

var OPTIMAL_RANGES = {
  "glucose":                          { low: 70,   high: 90   },
  "hba1c":                            { low: 4.6,  high: 5.4  },
  "hemoglobin a1c":                   { low: 4.6,  high: 5.4  },
  "haemoglobin a1c":                  { low: 4.6,  high: 5.4  },
  "insulin":                          { low: 2,    high: 6    },
  "homa":                             { low: 0,    high: 1.0  },
  "ldl":                              { low: 40,   high: 100  },
  "hdl":                              { low: 60,   high: 100  },
  "triglyceride":                     { low: 50,   high: 100  },
  "non-hdl":                          { low: 0,    high: 130  },
  "cholesterol":                      { low: 150,  high: 200  },
  "homocysteine":                     { low: 6,    high: 9    },
  "hs-crp":                           { low: 0,    high: 0.5  },
  "hscrp":                            { low: 0,    high: 0.5  },
  "c-reactive protein":               { low: 0,    high: 0.5  },
  "tsh":                              { low: 1.0,  high: 2.5  },
  "free t4":                          { low: 1.0,  high: 1.5  },
  "ft4":                              { low: 1.0,  high: 1.5  },
  "free t3":                          { low: 3.2,  high: 4.0  },
  "ft3":                              { low: 3.2,  high: 4.0  },
  "vitamin d":                        { low: 40,   high: 65   },
  "25-oh":                            { low: 40,   high: 65   },
  "vitamin b12":                      { low: 500,  high: 1200 },
  "b12":                              { low: 500,  high: 1200 },
  "folate":                           { low: 10,   high: 25   },
  "folic acid":                       { low: 10,   high: 25   },
  "ferritin":                         { low: 50,   high: 150  },
  "magnesium":                        { low: 2.0,  high: 2.5  },
  "zinc":                             { low: 90,   high: 130  },
  "alt":                              { low: 0,    high: 25   },
  "alanine aminotransferase":         { low: 0,    high: 25   },
  "sgpt":                             { low: 0,    high: 25   },
  "ast":                              { low: 0,    high: 22   },
  "aspartate aminotransferase":       { low: 0,    high: 22   },
  "sgot":                             { low: 0,    high: 22   },
  "ggt":                              { low: 0,    high: 16   },
  "creatinine":                       { low: 0.7,  high: 1.0  },
  "uric acid":                        { low: 3.0,  high: 5.5  },
  "bun":                              { low: 7,    high: 15   },
  "hemoglobin":                       { low: 13.5, high: 17.0 },
  "haemoglobin":                      { low: 13.5, high: 17.0 },
  "hematocrit":                       { low: 40,   high: 50   },
  "haematocrit":                      { low: 40,   high: 50   },
  "wbc":                              { low: 4.5,  high: 7.5  },
  "white blood":                      { low: 4.5,  high: 7.5  },
  "sodium":                           { low: 136,  high: 142  },
  "potassium":                        { low: 4.0,  high: 4.5  },
  "calcium":                          { low: 9.0,  high: 10.0 },
  "testosterone":                     { low: 600,  high: 900  },
  "dhea":                             { low: 150,  high: 350  },
  "cortisol":                         { low: 10,   high: 18   },
  "esr":                              { low: 0,    high: 10   },
};

function getProfileText(profile) {
  if (!profile) return null;
  var conditions = (profile.conditions && profile.conditions.length > 0)
    ? profile.conditions.join(", ") : "none reported";
  return "Patient profile: " + (profile.full_name || "Unknown") +
    ", age " + (profile.age || "unknown") +
    ", biological sex " + (profile.biological_sex || "not specified") +
    ". Known conditions: " + conditions +
    ". Use this to personalise interpretation and flag markers especially relevant for this patient.";
}

function getOptimalRange(markerName) {
  var name = markerName.toLowerCase();
  var keys = Object.keys(OPTIMAL_RANGES);
  for (var i = 0; i < keys.length; i++) {
    if (name.includes(keys[i])) return OPTIMAL_RANGES[keys[i]];
  }
  return null;
}

// ── Marker normalisation ──────────────────────────────────────────────────────
// Entries are checked in order — most specific MUST come before general catch-alls.

var CANONICAL_MAP = [
  // ── Testosterone family ──
  { keywords: ["free testosterone", "testosterone, free", "testosterone free"], canonical: "Free Testosterone" },
  { keywords: ["bioavailable testosterone"],                                     canonical: "Bioavailable Testosterone" },
  { keywords: ["testosterone"],                                                  canonical: "Testosterone" },

  // ── Thyroid ──
  { keywords: ["free t4", "ft4", "thyroxine, free", "t4, free"],   canonical: "Free T4" },
  { keywords: ["free t3", "ft3", "triiodothyronine, free", "t3, free"], canonical: "Free T3" },
  { keywords: ["reverse t3", "rt3"],                                canonical: "Reverse T3" },
  { keywords: ["tsh", "thyroid stimulating", "thyrotropin"],        canonical: "TSH" },
  { keywords: ["anti-tpo", "anti tpo", "thyroid peroxidase"],       canonical: "Anti-TPO" },
  { keywords: ["thyroglobulin"],                                     canonical: "Thyroglobulin" },

  // ── Lipids ──
  { keywords: ["ldl"],                                              canonical: "LDL Cholesterol" },
  { keywords: ["hdl"],                                              canonical: "HDL Cholesterol" },
  { keywords: ["non-hdl", "non hdl"],                               canonical: "Non-HDL Cholesterol" },
  { keywords: ["vldl"],                                             canonical: "VLDL Cholesterol" },
  { keywords: ["triglyceride"],                                      canonical: "Triglycerides" },
  { keywords: ["lipoprotein(a)", "lipoprotein (a)", "lp(a)"],       canonical: "Lipoprotein(a)" },
  { keywords: ["apolipoprotein b", "apo b", "apob"],                canonical: "ApoB" },
  { keywords: ["apolipoprotein a", "apo a", "apoa"],                canonical: "ApoA-I" },
  { keywords: ["cholesterol"],                                       canonical: "Total Cholesterol" },

  // ── Blood sugar ──
  { keywords: ["hba1c", "hemoglobin a1c", "haemoglobin a1c", "glycated hemoglobin", "glycohemoglobin", "a1c"], canonical: "HbA1c" },
  { keywords: ["fasting glucose", "glucose, fasting"],              canonical: "Glucose" },
  { keywords: ["glucose"],                                           canonical: "Glucose" },
  { keywords: ["insulin"],                                           canonical: "Insulin" },
  { keywords: ["homa"],                                              canonical: "HOMA-IR" },
  { keywords: ["c-peptide", "c peptide"],                           canonical: "C-Peptide" },

  // ── Liver ──
  { keywords: ["alt", "alanine aminotransferase", "sgpt"],          canonical: "ALT" },
  { keywords: ["ast", "aspartate aminotransferase", "sgot"],        canonical: "AST" },
  { keywords: ["alkaline phosphatase", "alp"],                      canonical: "ALP" },
  { keywords: ["ggt", "gamma-glutamyl", "gamma glutamyl"],          canonical: "GGT" },
  { keywords: ["direct bilirubin", "bilirubin, direct", "conjugated bilirubin"], canonical: "Direct Bilirubin" },
  { keywords: ["indirect bilirubin", "bilirubin, indirect", "unconjugated bilirubin"], canonical: "Indirect Bilirubin" },
  { keywords: ["bilirubin"],                                         canonical: "Total Bilirubin" },
  { keywords: ["albumin"],                                           canonical: "Albumin" },
  { keywords: ["total protein", "protein, total"],                  canonical: "Total Protein" },
  { keywords: ["ldh", "lactate dehydrogenase"],                     canonical: "LDH" },

  // ── Kidney ──
  { keywords: ["egfr", "estimated gfr", "gfr"],                    canonical: "eGFR" },
  { keywords: ["bun/creatinine", "bun / creatinine", "bun:creatinine"], canonical: "BUN/Creatinine Ratio" },
  { keywords: ["creatinine"],                                        canonical: "Creatinine" },
  { keywords: ["bun", "blood urea nitrogen", "urea nitrogen"],      canonical: "BUN" },
  { keywords: ["uric acid"],                                         canonical: "Uric Acid" },
  { keywords: ["cystatin"],                                          canonical: "Cystatin C" },
  { keywords: ["microalbumin"],                                      canonical: "Microalbumin" },

  // ── CBC ──
  { keywords: ["wbc", "white blood cell", "white blood count", "leukocyte count"], canonical: "WBC" },
  { keywords: ["rbc", "red blood cell", "red blood count", "erythrocyte count"],   canonical: "RBC" },
  { keywords: ["hemoglobin", "haemoglobin"],                        canonical: "Hemoglobin" },
  { keywords: ["hematocrit", "haematocrit"],                        canonical: "Hematocrit" },
  { keywords: ["platelet", "plt"],                                   canonical: "Platelets" },
  { keywords: ["neutrophil"],                                        canonical: "Neutrophils" },
  { keywords: ["lymphocyte"],                                        canonical: "Lymphocytes" },
  { keywords: ["monocyte"],                                          canonical: "Monocytes" },
  { keywords: ["eosinophil"],                                        canonical: "Eosinophils" },
  { keywords: ["basophil"],                                          canonical: "Basophils" },
  { keywords: ["mcv"],                                               canonical: "MCV" },
  { keywords: ["mch"],                                               canonical: "MCH" },
  { keywords: ["mchc"],                                              canonical: "MCHC" },
  { keywords: ["rdw"],                                               canonical: "RDW" },
  { keywords: ["mpv"],                                               canonical: "MPV" },
  { keywords: ["reticulocyte"],                                      canonical: "Reticulocytes" },

  // ── Vitamins & minerals ──
  { keywords: ["vitamin d", "25-oh", "25 oh", "25-hydroxyvitamin", "calcidiol"], canonical: "Vitamin D" },
  { keywords: ["vitamin b12", "b12", "cobalamin"],                  canonical: "Vitamin B12" },
  { keywords: ["folate", "folic acid"],                             canonical: "Folate" },
  { keywords: ["vitamin b6", "pyridoxine"],                         canonical: "Vitamin B6" },
  { keywords: ["vitamin c", "ascorbic"],                            canonical: "Vitamin C" },
  { keywords: ["vitamin a", "retinol"],                             canonical: "Vitamin A" },
  { keywords: ["vitamin e", "tocopherol"],                          canonical: "Vitamin E" },
  { keywords: ["magnesium"],                                         canonical: "Magnesium" },
  { keywords: ["zinc"],                                              canonical: "Zinc" },
  { keywords: ["selenium"],                                          canonical: "Selenium" },
  { keywords: ["copper"],                                            canonical: "Copper" },
  { keywords: ["phosphorus", "phosphate"],                          canonical: "Phosphorus" },
  { keywords: ["iodine"],                                            canonical: "Iodine" },

  // ── Iron studies ──
  { keywords: ["tibc", "total iron binding"],                       canonical: "TIBC" },
  { keywords: ["transferrin saturation", "iron saturation"],        canonical: "Transferrin Saturation" },
  { keywords: ["transferrin"],                                       canonical: "Transferrin" },
  { keywords: ["ferritin"],                                          canonical: "Ferritin" },
  { keywords: ["serum iron", "iron, serum", "iron"],                canonical: "Serum Iron" },

  // ── Electrolytes ──
  { keywords: ["sodium"],                                            canonical: "Sodium" },
  { keywords: ["potassium"],                                         canonical: "Potassium" },
  { keywords: ["chloride"],                                          canonical: "Chloride" },
  { keywords: ["bicarbonate", "co2", "carbon dioxide"],             canonical: "Bicarbonate" },
  { keywords: ["calcium"],                                           canonical: "Calcium" },
  { keywords: ["anion gap"],                                         canonical: "Anion Gap" },

  // ── Hormones ──
  { keywords: ["estradiol", "oestradiol", "e2"],                    canonical: "Estradiol" },
  { keywords: ["progesterone"],                                      canonical: "Progesterone" },
  { keywords: ["fsh", "follicle stimulating"],                      canonical: "FSH" },
  { keywords: ["lh", "luteinizing", "luteinising"],                 canonical: "LH" },
  { keywords: ["prolactin"],                                         canonical: "Prolactin" },
  { keywords: ["dhea-s", "dheas", "dehydroepiandrosterone sulfate", "dhea sulfate", "dhea"], canonical: "DHEA-S" },
  { keywords: ["cortisol"],                                          canonical: "Cortisol" },
  { keywords: ["shbg", "sex hormone binding"],                      canonical: "SHBG" },
  { keywords: ["igf-1", "igf1", "insulin-like growth factor"],      canonical: "IGF-1" },
  { keywords: ["psa", "prostate specific"],                         canonical: "PSA" },
  { keywords: ["amh", "anti-mullerian", "antimullerian"],           canonical: "AMH" },
  { keywords: ["parathyroid", "pth"],                               canonical: "PTH" },

  // ── Inflammation ──
  { keywords: ["hs-crp", "hscrp", "high sensitivity crp", "high-sensitivity c-reactive"], canonical: "hs-CRP" },
  { keywords: ["c-reactive protein", "crp"],                        canonical: "CRP" },
  { keywords: ["esr", "erythrocyte sedimentation"],                 canonical: "ESR" },
  { keywords: ["homocysteine"],                                      canonical: "Homocysteine" },
  { keywords: ["procalcitonin", "pct"],                             canonical: "Procalcitonin" },

  // ── Cardiac ──
  { keywords: ["nt-probnp", "nt probnp"],                           canonical: "NT-proBNP" },
  { keywords: ["bnp", "brain natriuretic"],                         canonical: "BNP" },
  { keywords: ["troponin"],                                          canonical: "Troponin" },
  { keywords: ["d-dimer", "d dimer"],                               canonical: "D-Dimer" },
  { keywords: ["creatine kinase", "ck-mb", "ck mb"],                canonical: "CK-MB" },

  // ── Bone ──
  { keywords: ["osteocalcin"],                                       canonical: "Osteocalcin" },
  { keywords: ["p1np"],                                              canonical: "P1NP" },
  { keywords: ["ctx", "c-telopeptide"],                             canonical: "CTx" },
];

// Preferred unit per canonical name + conversion factors FROM alternative units.
// factor: multiply the raw value by this to get preferred unit.
// preferred = stored/US Conventional unit (all values in DB use this)
// si        = { unit, factor } where factor converts FROM preferred TO si
// alts      = { unit: factor } where factor converts FROM alt unit TO preferred (import-time)
var UNIT_NORMS = {
  "Testosterone":          { preferred: "ng/dL",  si: { unit: "nmol/L",  factor: 0.03467 }, alts: { "nmol/l": 28.818, "pmol/l": 0.02882 } },
  "Free Testosterone":     { preferred: "pg/mL",  si: { unit: "pmol/L",  factor: 3.467  }, alts: { "pmol/l": 0.2882, "nmol/l": 288.2 } },
  "Estradiol":             { preferred: "pg/mL",  si: { unit: "pmol/L",  factor: 3.671  }, alts: { "pmol/l": 0.2724, "nmol/l": 272.4 } },
  "Progesterone":          { preferred: "ng/mL",  si: { unit: "nmol/L",  factor: 3.180  }, alts: { "nmol/l": 0.3144 } },
  "Cortisol":              { preferred: "µg/dL",  si: { unit: "nmol/L",  factor: 27.59  }, alts: { "nmol/l": 0.03625, "µg/l": 0.1 } },
  "DHEA-S":                { preferred: "µg/dL",  si: { unit: "µmol/L",  factor: 0.02714}, alts: { "µmol/l": 36.81, "nmol/l": 0.03681 } },
  "TSH":                   { preferred: "mIU/L",  alts: { "µiu/ml": 1, "uiu/ml": 1 } },
  "Free T4":               { preferred: "ng/dL",  si: { unit: "pmol/L",  factor: 12.87  }, alts: { "pmol/l": 0.07752, "nmol/l": 77.52 } },
  "Free T3":               { preferred: "pg/mL",  si: { unit: "pmol/L",  factor: 1.536  }, alts: { "pmol/l": 0.6513, "nmol/l": 651.3 } },
  "Glucose":               { preferred: "mg/dL",  si: { unit: "mmol/L",  factor: 0.05551}, alts: { "mmol/l": 18.016 } },
  "HbA1c":                 { preferred: "%",      alts: { "mmol/mol": 0.09148 } },
  "Insulin":               { preferred: "µIU/mL", si: { unit: "pmol/L",  factor: 6.945  }, alts: { "pmol/l": 0.1389, "miu/l": 1 } },
  "Total Cholesterol":     { preferred: "mg/dL",  si: { unit: "mmol/L",  factor: 0.02586}, alts: { "mmol/l": 38.67 } },
  "LDL Cholesterol":       { preferred: "mg/dL",  si: { unit: "mmol/L",  factor: 0.02586}, alts: { "mmol/l": 38.67 } },
  "HDL Cholesterol":       { preferred: "mg/dL",  si: { unit: "mmol/L",  factor: 0.02586}, alts: { "mmol/l": 38.67 } },
  "Non-HDL Cholesterol":   { preferred: "mg/dL",  si: { unit: "mmol/L",  factor: 0.02586}, alts: { "mmol/l": 38.67 } },
  "Triglycerides":         { preferred: "mg/dL",  si: { unit: "mmol/L",  factor: 0.01129}, alts: { "mmol/l": 88.57 } },
  "Homocysteine":          { preferred: "µmol/L", alts: { "mg/l": 7.397, "mg/dl": 73.97 } },
  "hs-CRP":                { preferred: "mg/L",   alts: { "mg/dl": 10, "nmol/l": 0.1047 } },
  "CRP":                   { preferred: "mg/L",   alts: { "mg/dl": 10 } },
  "Vitamin D":             { preferred: "ng/mL",  si: { unit: "nmol/L",  factor: 2.496  }, alts: { "nmol/l": 0.4006 } },
  "Vitamin B12":           { preferred: "pg/mL",  si: { unit: "pmol/L",  factor: 0.7378 }, alts: { "pmol/l": 1.355, "ng/l": 1 } },
  "Folate":                { preferred: "ng/mL",  si: { unit: "nmol/L",  factor: 2.266  }, alts: { "nmol/l": 0.4413 } },
  "Ferritin":              { preferred: "ng/mL",  alts: { "µg/l": 1, "pmol/l": 0.4442 } },
  "Serum Iron":            { preferred: "µg/dL",  si: { unit: "µmol/L",  factor: 0.1791 }, alts: { "µmol/l": 5.587, "mmol/l": 5587 } },
  "Transferrin Saturation":{ preferred: "%",      alts: {} },
  "TIBC":                  { preferred: "µg/dL",  si: { unit: "µmol/L",  factor: 0.1791 }, alts: { "µmol/l": 5.587 } },
  "Hemoglobin":            { preferred: "g/dL",   alts: { "g/l": 0.1, "mmol/l": 1.6113 } },
  "Hematocrit":            { preferred: "%",      alts: { "l/l": 100 } },
  "Creatinine":            { preferred: "mg/dL",  si: { unit: "µmol/L",  factor: 88.4   }, alts: { "µmol/l": 0.01131, "umol/l": 0.01131 } },
  "BUN":                   { preferred: "mg/dL",  si: { unit: "mmol/L",  factor: 0.3570 }, alts: { "mmol/l": 2.8, "µmol/l": 0.0028 } },
  "Uric Acid":             { preferred: "mg/dL",  si: { unit: "µmol/L",  factor: 59.48  }, alts: { "µmol/l": 0.01681, "mmol/l": 16.81 } },
  "Calcium":               { preferred: "mg/dL",  si: { unit: "mmol/L",  factor: 0.2495 }, alts: { "mmol/l": 4.008 } },
  "Magnesium":             { preferred: "mg/dL",  si: { unit: "mmol/L",  factor: 0.4114 }, alts: { "mmol/l": 2.431, "meq/l": 1.215 } },
  "Phosphorus":            { preferred: "mg/dL",  si: { unit: "mmol/L",  factor: 0.3229 }, alts: { "mmol/l": 3.097 } },
  "Sodium":                { preferred: "mEq/L",  alts: { "mmol/l": 1 } },
  "Potassium":             { preferred: "mEq/L",  alts: { "mmol/l": 1 } },
  "Chloride":              { preferred: "mEq/L",  alts: { "mmol/l": 1 } },
  "Zinc":                  { preferred: "µg/dL",  si: { unit: "µmol/L",  factor: 0.1530 }, alts: { "µmol/l": 6.54, "umol/l": 6.54 } },
  "IGF-1":                 { preferred: "ng/mL",  si: { unit: "nmol/L",  factor: 0.1307 }, alts: { "nmol/l": 7.647 } },
  "PTH":                   { preferred: "pg/mL",  si: { unit: "pmol/L",  factor: 0.1060 }, alts: { "pmol/l": 9.43 } },
};

// Returns the canonical name for a raw marker name, or the cleaned raw name if no match.
function normalizeMarkerName(rawName) {
  var lower = rawName.toLowerCase();
  for (var i = 0; i < CANONICAL_MAP.length; i++) {
    var entry = CANONICAL_MAP[i];
    for (var j = 0; j < entry.keywords.length; j++) {
      if (lower.includes(entry.keywords[j])) return entry.canonical;
    }
  }
  return rawName;
}

// Normalises every marker: canonical name + converts value/low/high to US Conventional unit.
function normalizeMarkers(markers) {
  return markers.map(function(m) {
    var canonical = normalizeMarkerName(m.name);
    var val  = convertToPreferred(m.value, m.unit, canonical);
    var low  = convertToPreferred(m.low,   m.unit, canonical);
    var high = convertToPreferred(m.high,  m.unit, canonical);
    return Object.assign({}, m, {
      name:  canonical,
      value: val.value,
      unit:  val.unit,
      low:   low.value,
      high:  high.value,
    });
  });
}

// Converts value+unit to the preferred unit for a canonical marker.
// Returns { value, unit } — unchanged if no conversion applies.
function convertToPreferred(value, rawUnit, canonicalName) {
  var norm = UNIT_NORMS[canonicalName];
  if (!norm) return { value: value, unit: rawUnit };
  var unitLower = (rawUnit || "").toLowerCase().trim();
  if (unitLower === norm.preferred.toLowerCase()) return { value: value, unit: norm.preferred };
  var factor = norm.alts[unitLower];
  if (factor !== undefined) {
    return { value: parseFloat((value * factor).toFixed(2)), unit: norm.preferred };
  }
  return { value: value, unit: rawUnit };
}

// Normalises a raw date string from AI into "15 Jan 2025".
// Always constructs Date objects from explicit parts to avoid UTC timezone offset issues.
function normalizeDate(raw) {
  if (!raw || raw === "Unknown") return null;
  var fmt = function(d) {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  // YYYY-MM-DD (ISO) — must handle explicitly; new Date("YYYY-MM-DD") is UTC midnight
  var iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    var d = new Date(+iso[1], +iso[2] - 1, +iso[3]);
    if (!isNaN(d.getTime())) return fmt(d);
  }
  // Numeric NN/NN/YYYY — detect MM/DD vs DD/MM by which part exceeds 12
  var num = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (num) {
    var a = +num[1], b = +num[2], yr = +num[3], d2;
    if (a > 12)      d2 = new Date(yr, b - 1, a); // a must be day → DD/MM/YYYY
    else if (b > 12) d2 = new Date(yr, a - 1, b); // b must be day → MM/DD/YYYY
    else             d2 = new Date(raw);            // ambiguous → let JS decide
    if (!isNaN(d2.getTime())) return fmt(d2);
  }
  // Everything else ("January 15 2025", "Jan 15, 2025", etc.)
  var d3 = new Date(raw);
  if (!isNaN(d3.getTime())) return fmt(d3);
  return raw; // fallback
}

// Converts a stored (US Conventional) value to the user's preferred unit system.
// Returns the converted numeric value (rounded to avoid floating-point noise).
function displayConvert(value, canonicalName, unitSystem) {
  if (unitSystem !== "si") return value;
  var norm = UNIT_NORMS[canonicalName];
  if (!norm || !norm.si) return value;
  return parseFloat((value * norm.si.factor).toFixed(2));
}

// Returns the display unit string for the given unit system.
function displayUnit(canonicalName, storedUnit, unitSystem) {
  if (unitSystem !== "si") return storedUnit;
  var norm = UNIT_NORMS[canonicalName];
  if (!norm || !norm.si) return storedUnit;
  return norm.si.unit;
}

function getTrendMarkers(history) {
  var counts = {};
  history.forEach(function(report) {
    var markers = report.markers || [];
    var seen = {};
    markers.forEach(function(m) {
      var key = normalizeMarkerName(m.name);
      if (!seen[key]) {
        counts[key] = (counts[key] || 0) + 1;
        seen[key] = true;
      }
    });
  });
  return Object.keys(counts)
    .filter(function(k) { return counts[k] >= 2; })
    .sort(function(a, b) { return counts[b] - counts[a]; });
}

function getTrendData(history, canonicalName, unitSystem) {
  var points = [];
  // history is sorted newest-first; reverse for chronological order
  var sorted = history.slice().reverse();
  sorted.forEach(function(report) {
    var markers = report.markers || [];
    var match = markers.find(function(m) { return normalizeMarkerName(m.name) === canonicalName; });
    if (match) {
      var converted = convertToPreferred(match.value, match.unit, canonicalName);
      var convLow   = convertToPreferred(match.low,   match.unit, canonicalName);
      var convHigh  = convertToPreferred(match.high,  match.unit, canonicalName);
      var dispVal  = displayConvert(converted.value,    canonicalName, unitSystem);
      var dispLow  = displayConvert(convLow.value,      canonicalName, unitSystem);
      var dispHigh = displayConvert(convHigh.value,     canonicalName, unitSystem);
      var dispUnt  = displayUnit(canonicalName, converted.unit, unitSystem);
      var dateStr = report.report_date && report.report_date !== "Unknown"
        ? report.report_date
        : new Date(report.created_at).toLocaleDateString();
      points.push({
        date: dateStr,
        rawDate: report.created_at || report.report_date,
        value: dispVal,
        low:   dispLow,
        high:  dispHigh,
        unit:  dispUnt,
        status: getStatus(dispVal, dispLow, dispHigh),
      });
    }
  });
  return points;
}

function TrendDot(props) {
  var { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined) return null;
  var colorMap = { ok: "#527A48", high: "#B84838", low: "#C97B28" };
  var fill = colorMap[payload && payload.status] || colorMap.ok;
  return <circle cx={cx} cy={cy} r={5} fill={fill} stroke="var(--bg)" strokeWidth={2} />;
}

function TrendTooltip(props) {
  var { active, payload } = props;
  if (!active || !payload || !payload.length) return null;
  var d = payload[0].payload;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
      padding: "10px 14px", fontSize: 13, boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: "var(--text)" }}>{d.date}</div>
      <div style={{ color: "var(--text)" }}>{d.value} {d.unit}</div>
      <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 2 }}>
        Ref: {d.low} – {d.high} {d.unit}
      </div>
    </div>
  );
}

function categorizeMarkers(markers) {
  var sections = {};
  var other = [];

  markers.forEach(function(marker) {
    var name = marker.name.toLowerCase();
    var matched = false;

    for (var i = 0; i < MARKER_SECTIONS.length; i++) {
      var section = MARKER_SECTIONS[i];
      if (section.keywords.some(function(kw) { return name.includes(kw); })) {
        if (!sections[section.id]) {
          sections[section.id] = { id: section.id, label: section.label, emoji: section.emoji, markers: [] };
        }
        sections[section.id].markers.push(marker);
        matched = true;
        break;
      }
    }

    if (!matched) other.push(marker);
  });

  var ordered = MARKER_SECTIONS
    .filter(function(s) { return sections[s.id]; })
    .map(function(s) { return sections[s.id]; });

  if (other.length > 0) {
    ordered.push({ id: "other", label: "Other Markers", emoji: "📋", markers: other });
  }

  // Within each section sort: high → low → ok
  var statusOrder = { high: 0, low: 1, ok: 2 };
  ordered.forEach(function(section) {
    section.markers.sort(function(a, b) {
      return (statusOrder[getStatus(a.value, a.low, a.high)] || 0) -
             (statusOrder[getStatus(b.value, b.low, b.high)] || 0);
    });
  });

  return ordered;
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

var CACHE_KEY = "vitascan_cache";

async function hashFile(base64Data) {
  var buf = new TextEncoder().encode(base64Data);
  var hashBuf = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuf)).map(function(b) { return b.toString(16).padStart(2, "0"); }).join("");
}

function loadFromCache(hash) {
  try {
    var store = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    return store[hash] || null;
  } catch (e) { return null; }
}

function saveToCache(hash, result) {
  try {
    var store = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    store[hash] = result;
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch (e) { /* quota exceeded — fail silently */ }
}

// ── Marker info helpers ───────────────────────────────────────────────────────

var MARKER_INFO_KEY = "vitascan_marker_info";

function loadMarkerInfo(name) {
  try {
    var store = JSON.parse(localStorage.getItem(MARKER_INFO_KEY) || "{}");
    return store[name.toLowerCase()] || null;
  } catch (e) { return null; }
}

function saveMarkerInfo(name, info) {
  try {
    var store = JSON.parse(localStorage.getItem(MARKER_INFO_KEY) || "{}");
    store[name.toLowerCase()] = info;
    localStorage.setItem(MARKER_INFO_KEY, JSON.stringify(store));
  } catch (e) { /* quota exceeded — fail silently */ }
  // Fire-and-forget upsert to Supabase
  supabase.from('marker_info').upsert({
    name: name.toLowerCase(),
    what: info.what,
    implications: info.implications,
  }).then(function() {}).catch(function() {});
}

async function fetchMarkerInfo(name) {
  // 1. localStorage first
  var cached = loadMarkerInfo(name);
  if (cached) return cached;

  // 2. Supabase fallback
  try {
    var { data: sbData } = await supabase
      .from('marker_info')
      .select('what, implications')
      .eq('name', name.toLowerCase())
      .single();
    if (sbData) {
      saveMarkerInfo(name, sbData); // populate localStorage
      return sbData;
    }
  } catch (e) { /* continue to AI */ }

  // 3. AI API
  var apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

  var response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: "Explain the blood test marker \"" + name + "\" in simple, patient-friendly language. Return ONLY a JSON object with no markdown: {\"what\": \"1-2 sentences on what this marker measures\", \"implications\": \"1-2 sentences on what high or low levels may indicate\"}." }]
      }],
      generationConfig: { maxOutputTokens: 300, thinkingConfig: { thinkingBudget: 0 } }
    })
  });

  var data = await response.json();
  if (!response.ok || !data.candidates || !data.candidates[0]) throw new Error("Failed");
  var raw = data.candidates[0].content.parts.map(function(p) { return p.text || ""; }).join("");
  var info = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
  saveMarkerInfo(name, info); // saves to localStorage + Supabase
  return info;
}

// ── API helpers ───────────────────────────────────────────────────────────────

function repairJSON(raw) {
  var s = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  try { return JSON.parse(s); } catch (e1) {
    var lastBrace = s.lastIndexOf("}");
    if (lastBrace !== -1) { s = s.slice(0, lastBrace + 1); }
    var opens  = (s.match(/\[/g) || []).length - (s.match(/\]/g) || []).length;
    var braces = (s.match(/\{/g) || []).length - (s.match(/\}/g) || []).length;
    for (var i = 0; i < opens;  i++) { s += "]"; }
    for (var j = 0; j < braces; j++) { s += "}"; }
    return JSON.parse(s);
  }
}

async function analyzeReport(base64Data, mediaType, profileText) {
  var profilePrefix = profileText ? profileText + "\n\n" : "";
  var systemPrompt = profilePrefix +
    "You are a clinical health data analyst. Extract every single lab marker from the uploaded report without skipping any. " +
    "Return ONLY a valid JSON object with no markdown, no preamble, no extra text. " +
    "Structure: {\"patientName\":\"string\",\"reportDate\":\"string\",\"markers\":[{\"name\":\"string\",\"value\":number,\"unit\":\"string\",\"low\":number,\"high\":number,\"category\":\"string\"}],\"lifestyle\":[{\"emoji\":\"string\",\"label\":\"string\",\"desc\":\"string\"}],\"interpretation\":\"string\"}. " +
    "Rules: you MUST include every marker printed on the report — do not skip, summarise, or group any. If a reference range is missing, estimate a standard clinical range. Keep lifestyle to 4 items max with one sentence each. Keep interpretation to 2 sentences max. Output ONLY the raw JSON object.";

  var apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

  var response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{
        role: "user",
        parts: [
          { inline_data: { mime_type: mediaType, data: base64Data } },
          { text: "Analyze this blood test report and return the JSON." }
        ]
      }],
      generationConfig: { maxOutputTokens: 16000, thinkingConfig: { thinkingBudget: 0 } }
    })
  });

  var data = await response.json();

  if (!response.ok) {
    var msg = (data.error && data.error.message) ? data.error.message : JSON.stringify(data);
    throw new Error("API error " + response.status + ": " + msg);
  }
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("Empty response from API");
  }

  var raw = data.candidates[0].content.parts.map(function(p) { return p.text || ""; }).join("");
  return repairJSON(raw);
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  // ── Core stage state ──
  const [stage,     setStage]     = useState("upload");
  const [results,   setResults]   = useState(null);
  const [activeTab, setActiveTab] = useState("markers");
  const [dragOver,  setDragOver]  = useState(false);
  const [error,     setError]     = useState(null);
  const [fromCache, setFromCache] = useState(false);

  // ── Auth state ──
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode,    setAuthMode]    = useState("login"); // "login" | "magic_sent"
  const [authEmail,   setAuthEmail]   = useState("");
  const [authError,   setAuthError]   = useState(null);
  const [authBusy,    setAuthBusy]    = useState(false);

  // ── Report history state ──
  const [history,        setHistory]        = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Profile state ──
  const [profile,       setProfile]       = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError,  setProfileError]  = useState(null);
  const [profileForm,   setProfileForm]   = useState({
    full_name: "", age: "", biological_sex: "", conditions: [],
  });

  // ── Trends state ──
  const [selectedTrendMarker, setSelectedTrendMarker] = useState(null);

  // ── Unit system preference (persisted to localStorage) ──
  const [unitSystem, setUnitSystem] = useState(function() {
    return localStorage.getItem("vitascan_unit_system") || "us";
  });

  function handleUnitSystemChange(val) {
    setUnitSystem(val);
    localStorage.setItem("vitascan_unit_system", val);
  }

  // ── Session bootstrap ──
  useEffect(function() {
    supabase.auth.getSession().then(function({ data: { session } }) {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    var { data: { subscription } } = supabase.auth.onAuthStateChange(function(_event, session) {
      setUser(session?.user ?? null);
    });
    return function() { subscription.unsubscribe(); };
  }, []);

  // ── Load history when user signs in ──
  useEffect(function() {
    if (user) {
      loadHistory();
    } else {
      setHistory([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Load profile when user signs in ──
  useEffect(function() {
    if (user) { loadProfile(); }
    else { setProfile(null); setProfileLoaded(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Profile loader ──
  async function loadProfile() {
    try {
      var { data, error: err } = await supabase
        .from('profiles')
        .select('full_name, age, biological_sex, conditions')
        .eq('user_id', user.id)
        .single();
      if (err || !data) {
        setProfile(null);
        setStage("profile");
      } else {
        setProfile(data);
        setProfileForm({
          full_name:      data.full_name      || "",
          age:            data.age            ? String(data.age) : "",
          biological_sex: data.biological_sex || "",
          conditions:     data.conditions     || [],
        });
      }
    } catch (e) {
      setProfile(null);
      setStage("profile");
    } finally {
      setProfileLoaded(true);
    }
  }

  // ── Profile save ──
  async function saveProfile(e) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    var payload = {
      user_id:        user.id,
      full_name:      profileForm.full_name.trim() || null,
      age:            profileForm.age ? parseInt(profileForm.age, 10) : null,
      biological_sex: profileForm.biological_sex || null,
      conditions:     profileForm.conditions,
      updated_at:     new Date().toISOString(),
    };
    try {
      var { error: err } = await supabase.from('profiles').upsert(payload);
      if (err) throw err;
      setProfile(payload);
      setStage("upload");
    } catch (e2) {
      setProfileError(e2.message || "Could not save profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  // ── History loader ──
  async function loadHistory() {
    setHistoryLoading(true);
    try {
      var { data } = await supabase
        .from('reports')
        .select('id, created_at, patient_name, report_date, markers, lifestyle, interpretation')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setHistory(data || []);
    } catch (e) {
      // fail silently — history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  }

  // ── Auth handlers ──
  async function handleGoogleSignIn() {
    setAuthBusy(true);
    setAuthError(null);
    var { error: err } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (err) { setAuthError(err.message); setAuthBusy(false); }
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    if (!authEmail.trim()) return;
    setAuthBusy(true);
    setAuthError(null);
    var { error: err } = await supabase.auth.signInWithOtp({ email: authEmail.trim() });
    setAuthBusy(false);
    if (err) { setAuthError(err.message); }
    else     { setAuthMode("magic_sent"); }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setStage("upload");
    setResults(null);
    setHistory([]);
    setProfile(null);
    setProfileLoaded(false);
  }

  // ── File handler ──
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
      var hash = await hashFile(base64);
      var cached = loadFromCache(hash);
      if (cached) {
        setResults(cached);
        setFromCache(true);
        setActiveTab("markers");
        setStage("results");
        return;
      }
      var profileText = getProfileText(profile);
      var data = await analyzeReport(base64, mediaType, profileText);
      data = Object.assign({}, data, {
        markers:    normalizeMarkers(data.markers || []),
        reportDate: normalizeDate(data.reportDate),
      });
      saveToCache(hash, data);

      // Save to Supabase (fire-and-forget — don't block UI on this)
      if (user) {
        supabase.from('reports').upsert({
          user_id: user.id,
          file_hash: hash,
          patient_name: data.patientName,
          report_date: data.reportDate,
          markers: data.markers,
          lifestyle: data.lifestyle,
          interpretation: data.interpretation,
        }, { onConflict: 'user_id,file_hash' }).then(function() {
          loadHistory();
        }).catch(function() {});
      }

      setResults(data);
      setFromCache(false);
      setActiveTab("markers");
      setStage("results");
    } catch (e) {
      console.error("VitaScan error:", e);
      setError(e.message || "Could not analyze the report. Please try again.");
      setStage("upload");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const onDrop = useCallback(function(e) {
    e.preventDefault();
    setDragOver(false);
    var file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── History card click ──
  function handleHistoryItem(item) {
    setResults({
      patientName:    item.patient_name,
      reportDate:     item.report_date,
      markers:        item.markers || [],
      lifestyle:      item.lifestyle || [],
      interpretation: item.interpretation || "",
    });
    setFromCache(false);
    setActiveTab("markers");
    setStage("results");
  }

  // ── Derived counts ──
  var markers   = (results && results.markers)   || [];
  var lifestyle = (results && results.lifestyle) || [];

  var counts = {
    total: markers.length,
    ok:    markers.filter(function(m) { return getStatus(m.value, m.low, m.high) === "ok";   }).length,
    high:  markers.filter(function(m) { return getStatus(m.value, m.low, m.high) === "high"; }).length,
    low:   markers.filter(function(m) { return getStatus(m.value, m.low, m.high) === "low";  }).length,
  };

  // ── Render: loading spinner (auth bootstrap) ──
  if (authLoading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="app">
          <div className="loading-state" style={{ paddingTop: 120 }}>
            <div className="pulse-ring" />
          </div>
        </div>
      </>
    );
  }

  // ── Render: auth screen ──
  if (!user) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="auth-screen">
          <div className="auth-card">
            <div className="auth-logo">vita<span>scan</span></div>
            <div className="auth-tagline">Your blood work, decoded.</div>

            {authMode === "magic_sent" ? (
              <>
                <div className="auth-success">
                  ✉️ Check your inbox!<br />
                  We sent a sign-in link to <strong>{authEmail}</strong>.<br />
                  Click the link to continue.
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ marginTop: 20, width: "100%", justifyContent: "center" }}
                  onClick={function() { setAuthMode("login"); setAuthEmail(""); setAuthError(null); }}
                >
                  Use a different email
                </button>
              </>
            ) : (
              <>
                <button className="btn-google" onClick={handleGoogleSignIn} disabled={authBusy}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="auth-divider">or</div>

                <form onSubmit={handleMagicLink}>
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="Enter your email"
                    value={authEmail}
                    onChange={function(e) { setAuthEmail(e.target.value); }}
                    required
                  />
                  <button className="btn-primary" type="submit" disabled={authBusy || !authEmail.trim()}>
                    {authBusy ? "Sending…" : "Send magic link"}
                  </button>
                </form>

                {authError && <div className="auth-error">{authError}</div>}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Render: profile loading spinner (wait for profile check before showing app) ──
  if (!profileLoaded) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="app">
          <div className="loading-state" style={{ paddingTop: 120 }}>
            <div className="pulse-ring" />
          </div>
        </div>
      </>
    );
  }

  // ── Render: authenticated app ──
  var avatarLetter = (user.email || "?")[0].toUpperCase();

  return (
    <>
      <style>{STYLES}</style>
      <div className="app">
        <header className="header">
          <div className="logo">vita<span>scan</span></div>
          <div className="header-right">
            {profile && (
              <button
                className="icon-btn"
                title="Edit profile"
                onClick={function() {
                  setProfileForm({
                    full_name:      profile.full_name      || "",
                    age:            profile.age            ? String(profile.age) : "",
                    biological_sex: profile.biological_sex || "",
                    conditions:     profile.conditions     || [],
                  });
                  setProfileError(null);
                  setStage("profile");
                }}
              >
                👤
              </button>
            )}
            <button
              className="icon-btn"
              title="Trends"
              onClick={function() { setStage("trends"); }}
            >
              📈
            </button>
            <button
              className="icon-btn"
              title="Debug: marker table"
              onClick={function() { setStage("debug"); }}
            >
              🧪
            </button>
            <button
              className="icon-btn"
              title="Report history"
              onClick={function() { setStage("history"); }}
            >
              🕐
            </button>
            <div className="header-avatar" title={user.email}>{avatarLetter}</div>
            <span className="header-email">{user.email}</span>
            <button className="btn btn-ghost" style={{ padding: "8px 16px" }} onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </header>

        <main className="main">

          {stage === "profile" && (
            <div className="profile-screen">
              <div style={{ marginBottom: 32 }}>
                <div className="results-title">Your Profile</div>
                <div className="results-meta">Help us personalise your results</div>
              </div>
              <form onSubmit={saveProfile}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Alex Johnson"
                    value={profileForm.full_name}
                    onChange={function(e) { setProfileForm(function(f) { return Object.assign({}, f, { full_name: e.target.value }); }); }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 35"
                    style={{ maxWidth: 140 }}
                    value={profileForm.age}
                    onChange={function(e) { setProfileForm(function(f) { return Object.assign({}, f, { age: e.target.value }); }); }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Biological Sex</label>
                  <div className="radio-group">
                    {["Male", "Female", "Other"].map(function(opt) {
                      return (
                        <label key={opt} className={"radio-option" + (profileForm.biological_sex === opt ? " selected" : "")}>
                          <input
                            type="radio"
                            name="biological_sex"
                            value={opt}
                            checked={profileForm.biological_sex === opt}
                            onChange={function() { setProfileForm(function(f) { return Object.assign({}, f, { biological_sex: opt }); }); }}
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Known Conditions</label>
                  <div className="checkbox-group">
                    {CONDITION_OPTIONS.map(function(opt) {
                      var checked = profileForm.conditions.indexOf(opt) !== -1;
                      return (
                        <label key={opt} className={"checkbox-option" + (checked ? " selected" : "")}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={function() {
                              setProfileForm(function(f) {
                                var next = checked
                                  ? f.conditions.filter(function(c) { return c !== opt; })
                                  : f.conditions.concat(opt);
                                return Object.assign({}, f, { conditions: next });
                              });
                            }}
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit System</label>
                  <div className="radio-group">
                    {[
                      { val: "us", label: "US Conventional", desc: "mg/dL · ng/dL" },
                      { val: "si", label: "SI / Metric",      desc: "mmol/L · nmol/L" },
                    ].map(function(opt) {
                      return (
                        <label key={opt.val} className={"radio-option" + (unitSystem === opt.val ? " selected" : "")}>
                          <input type="radio" name="unit_system" value={opt.val}
                            checked={unitSystem === opt.val}
                            onChange={function() { handleUnitSystemChange(opt.val); }}
                          />
                          <span>{opt.label} <span style={{ fontSize: 11, opacity: 0.65 }}>({opt.desc})</span></span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                {profileError && <div className="profile-error">{profileError}</div>}
                <div className="profile-actions">
                  <button className="btn-primary" type="submit" disabled={profileSaving} style={{ width: "auto", padding: "12px 32px" }}>
                    {profileSaving ? "Saving…" : "Save Profile"}
                  </button>
                  {profile !== null && (
                    <button type="button" className="btn btn-ghost" onClick={function() { setStage("upload"); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

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
              <p style={{ marginTop: 24, fontSize: 12, color: "var(--muted)" }}>Your report is processed securely and saved to your account.</p>
            </div>
          )}

          {stage === "loading" && (
            <div className="loading-state">
              <div className="pulse-ring" />
              <div className="loading-text">Analyzing your report</div>
              <div className="loading-sub">Extracting markers · Interpreting results · Generating guidance</div>
            </div>
          )}

          {stage === "history" && (
            <div className="history-view">
              <div className="history-header">
                <div>
                  <div className="results-title">Report History</div>
                  <div className="results-meta">{history.length} report{history.length !== 1 ? "s" : ""} saved</div>
                </div>
                <button className="btn btn-ghost" onClick={function() { setStage("upload"); }}>
                  + New Report
                </button>
              </div>

              {historyLoading && (
                <div className="loading-state" style={{ padding: "40px 0" }}>
                  <div className="pulse-ring" />
                </div>
              )}

              {!historyLoading && history.length === 0 && (
                <div className="history-empty">
                  <div className="history-empty-icon">🧬</div>
                  <div className="history-empty-text">No reports yet</div>
                  <div className="history-empty-sub">Upload your first lab report to get started.</div>
                </div>
              )}

              {!historyLoading && history.length > 0 && (function() {
                // Sort by report_date desc, fall back to created_at
                var sorted = history.slice().sort(function(a, b) {
                  var da = a.report_date ? new Date(a.report_date) : new Date(a.created_at);
                  var db = b.report_date ? new Date(b.report_date) : new Date(b.created_at);
                  return db - da;
                });
                // Group by year
                var byYear = {};
                sorted.forEach(function(item) {
                  var d = item.report_date ? new Date(item.report_date) : new Date(item.created_at);
                  var yr = isNaN(d) ? "Unknown" : d.getFullYear();
                  if (!byYear[yr]) byYear[yr] = [];
                  byYear[yr].push(item);
                });
                var years = Object.keys(byYear).sort(function(a, b) { return b - a; });
                return years.map(function(year) {
                  return (
                    <div key={year}>
                      <div className="year-divider">{year}</div>
                      <div className="history-grid">
                        {byYear[year].map(function(item) {
                          var itemMarkers = item.markers || [];
                          var itemCounts = {
                            total: itemMarkers.length,
                            ok:    itemMarkers.filter(function(m) { return getStatus(m.value, m.low, m.high) === "ok"; }).length,
                            high:  itemMarkers.filter(function(m) { return getStatus(m.value, m.low, m.high) === "high"; }).length,
                            low:   itemMarkers.filter(function(m) { return getStatus(m.value, m.low, m.high) === "low"; }).length,
                          };
                          var dateLabel = item.report_date && item.report_date !== "Unknown"
                            ? item.report_date
                            : new Date(item.created_at).toLocaleDateString();
                          return (
                            <div key={item.id} className="report-card" onClick={function() { handleHistoryItem(item); }}>
                              <div className="report-card-name">
                                {item.patient_name && item.patient_name !== "Unknown" ? item.patient_name : "Lab Report"}
                              </div>
                              <div className="report-card-date">{dateLabel}</div>
                              <div className="report-card-stats">
                                <div className="report-stat s-total">
                                  <div className="report-stat-num">{itemCounts.total}</div>
                                  <div className="report-stat-label">Total</div>
                                </div>
                                <div className="report-stat s-ok">
                                  <div className="report-stat-num">{itemCounts.ok}</div>
                                  <div className="report-stat-label">Normal</div>
                                </div>
                                <div className="report-stat s-high">
                                  <div className="report-stat-num">{itemCounts.high}</div>
                                  <div className="report-stat-label">High</div>
                                </div>
                                <div className="report-stat s-low">
                                  <div className="report-stat-num">{itemCounts.low}</div>
                                  <div className="report-stat-label">Low</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {stage === "debug" && (
            <div>
              <div className="history-header">
                <div>
                  <div className="results-title">Marker Debug Table</div>
                  <div className="results-meta">{history.length} report{history.length !== 1 ? "s" : ""} · all canonical values in stored unit</div>
                </div>
                <button className="btn btn-ghost" onClick={function() { setStage("history"); }}>← Back</button>
              </div>
              {history.length === 0 ? (
                <div className="history-empty">
                  <div className="history-empty-icon">🧪</div>
                  <div className="history-empty-text">No reports yet</div>
                </div>
              ) : (function() {
                // Columns: reports sorted oldest → newest
                var cols = history.slice().sort(function(a, b) {
                  var da = a.report_date ? new Date(a.report_date) : new Date(a.created_at);
                  var db = b.report_date ? new Date(b.report_date) : new Date(b.created_at);
                  return da - db;
                });
                // Rows: all unique canonical marker names, sorted alphabetically
                var markerSet = {};
                cols.forEach(function(report) {
                  (report.markers || []).forEach(function(m) { markerSet[normalizeMarkerName(m.name)] = true; });
                });
                var markerNames = Object.keys(markerSet).sort();
                return (
                  <div className="debug-wrap">
                    <table className="debug-table">
                      <thead>
                        <tr>
                          <th className="col-marker">Marker</th>
                          {cols.map(function(r) {
                            return (
                              <th key={r.id}>
                                {r.report_date || new Date(r.created_at).toLocaleDateString()}
                                <div style={{ fontWeight: 400, opacity: 0.7, fontSize: 10 }}>
                                  {r.patient_name && r.patient_name !== "Unknown" ? r.patient_name : "—"}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {markerNames.map(function(name) {
                          return (
                            <tr key={name}>
                              <td className="col-marker">{name}</td>
                              {cols.map(function(r) {
                                var m = (r.markers || []).find(function(x) { return normalizeMarkerName(x.name) === name; });
                                if (!m) return <td key={r.id} className="debug-cell-none">—</td>;
                                var status = getStatus(m.value, m.low, m.high);
                                return (
                                  <td key={r.id} className={"debug-cell-" + status} title={"ref: " + m.low + "–" + m.high + " " + m.unit}>
                                    {m.value} {m.unit}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {stage === "trends" && (
            <div>
              <div className="history-header">
                <div>
                  <div className="results-title">Marker Trends</div>
                  <div className="results-meta">Track changes across reports over time</div>
                </div>
                <button className="btn btn-ghost" onClick={function() { setStage("upload"); }}>
                  + New Report
                </button>
              </div>

              {history.length < 2 ? (
                <div className="trends-empty">
                  <div className="trends-empty-icon">📈</div>
                  <div className="trends-empty-text">Not enough data yet</div>
                  <div className="trends-empty-sub">Upload at least 2 reports to see trends</div>
                </div>
              ) : (function() {
                var trendMarkers = getTrendMarkers(history);
                if (trendMarkers.length === 0) {
                  return (
                    <div className="trends-empty">
                      <div className="trends-empty-icon">📊</div>
                      <div className="trends-empty-text">No shared markers found</div>
                      <div className="trends-empty-sub">No markers appear in 2 or more reports yet</div>
                    </div>
                  );
                }
                var activeName = selectedTrendMarker && trendMarkers.indexOf(selectedTrendMarker) !== -1
                  ? selectedTrendMarker : trendMarkers[0];
                var trendData = getTrendData(history, activeName, unitSystem);
                var samplePoint = trendData[0] || {};
                var yValues = trendData.map(function(d) { return d.value; });
                var allLow  = trendData.map(function(d) { return d.low; });
                var allHigh = trendData.map(function(d) { return d.high; });
                var yMin = Math.min.apply(null, yValues.concat(allLow))  * 0.85;
                var yMax = Math.max.apply(null, yValues.concat(allHigh)) * 1.15;
                var refLow  = allLow[0]  || samplePoint.low;
                var refHigh = allHigh[0] || samplePoint.high;
                return (
                  <>
                    <div className="chip-list">
                      {trendMarkers.map(function(name) {
                        return (
                          <button
                            key={name}
                            className={"chip" + (name === activeName ? " chip-active" : "")}
                            onClick={function() { setSelectedTrendMarker(name); }}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                    <div className="trend-chart-wrap">
                      <div className="trend-chart-title">{activeName}</div>
                      <div className="trend-chart-unit">{samplePoint.unit || ""}</div>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted)", fontFamily: "Open Sans" }} />
                          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: "var(--muted)", fontFamily: "Open Sans" }} width={50} />
                          <Tooltip content={<TrendTooltip />} />
                          {refLow !== undefined && refHigh !== undefined && (
                            <ReferenceArea y1={refLow} y2={refHigh} fill="rgba(82,122,72,0.10)" strokeOpacity={0} />
                          )}
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="var(--accent)"
                            strokeWidth={2}
                            dot={<TrendDot />}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                          <svg width="10" height="10"><circle cx="5" cy="5" r="5" fill="#527A48" /></svg>
                          Normal
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                          <svg width="10" height="10"><circle cx="5" cy="5" r="5" fill="#B84838" /></svg>
                          High
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                          <svg width="10" height="10"><circle cx="5" cy="5" r="5" fill="#C97B28" /></svg>
                          Low
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                          <div style={{ width: 16, height: 10, background: "rgba(82,122,72,0.18)", borderRadius: 2 }} />
                          Lab range
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
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
                    {fromCache && <span className="cached-badge">cached</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-ghost" onClick={function() { setStage("history"); }}>
                    History
                  </button>
                  <button className="btn btn-ghost" onClick={function() { setStage("upload"); setResults(null); }}>
                    New Report
                  </button>
                </div>
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
                  {categorizeMarkers(markers).map(function(section) {
                    var abnormal = section.markers.filter(function(m) { return getStatus(m.value, m.low, m.high) !== "ok"; }).length;
                    return (
                      <div key={section.id} className="health-section">
                        <div className="health-section-header">
                          <span className="health-section-emoji">{section.emoji}</span>
                          <span className="health-section-label">{section.label}</span>
                          {abnormal > 0 && <span className="health-section-alert">{abnormal} out of range</span>}
                        </div>
                        <div className="markers-grid">
                          {section.markers.map(function(m, i) { return <MarkerCard key={i} marker={m} unitSystem={unitSystem} />; })}
                        </div>
                      </div>
                    );
                  })}
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
