import React, { useState, useCallback, useEffect, useRef } from "react";
import * as Sentry from "@sentry/react";
import { supabase } from './supabase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceArea, ReferenceLine, ResponsiveContainer } from "recharts";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import * as XLSX from "xlsx";

var isNative = Capacitor.isNativePlatform();
var NATIVE_REDIRECT = "com.vitascan.app://login-callback";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #F0F4F8;
    --surface: #FFFFFF;
    --surface2: #F8FAFC;
    --border: rgba(15,23,42,0.07);
    --accent: #0EA5E9;
    --accent2: #2DD4BF;
    --ok: #10B981;
    --danger: #EF4444;
    --warn: #F97316;
    --text: #0F172A;
    --muted: #94A3B8;
    --dim: rgba(15,23,42,0.07);
  }

  body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; }

  .app { min-height: 100vh; background: var(--bg); }

  .header {
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
    padding-top: calc(16px + env(safe-area-inset-top));
    display: flex;
    align-items: center;
    justify-content: space-between;
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255,255,255,0.92);
  }

  .logo { font-family: 'Inter', sans-serif; font-weight: 800; font-size: 22px; letter-spacing: -0.5px; color: var(--text); }
  .logo span { color: var(--accent); }

  .badge {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 10px;
    background: rgba(14,165,233,0.1);
    border: 1px solid rgba(14,165,233,0.2);
    color: var(--accent);
    padding: 3px 10px;
    border-radius: 20px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .main { max-width: 680px; margin: 0 auto; padding: 32px 16px; padding-bottom: calc(80px + env(safe-area-inset-bottom)); }
  .upload-section { text-align: center; padding: 48px 16px; }

  .upload-title {
    font-family: 'Inter', sans-serif;
    font-size: 36px;
    font-weight: 800;
    letter-spacing: -1.5px;
    line-height: 1.1;
    margin-bottom: 12px;
  }
  .upload-title span {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .upload-sub { color: var(--muted); font-size: 15px; margin-bottom: 32px; font-weight: 400; }

  .drop-zone {
    border: 1.5px dashed rgba(14,165,233,0.35);
    border-radius: 20px;
    padding: 48px 32px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(14,165,233,0.03);
    max-width: 520px;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
  }
  .drop-zone:hover { border-color: rgba(14,165,233,0.6); background: rgba(14,165,233,0.06); }
  .drop-zone.drag-over { border-color: var(--accent); background: rgba(14,165,233,0.08); }

  .drop-icon {
    width: 56px; height: 56px;
    margin: 0 auto 16px;
    background: rgba(14,165,233,0.1);
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
  }
  .drop-label { font-size: 16px; color: var(--text); font-weight: 500; margin-bottom: 6px; }
  .drop-hint { font-size: 13px; color: var(--muted); font-weight: 400; }
  .file-input { display: none; }

  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 22px; border-radius: 10px;
    font-size: 14px; font-weight: 500; cursor: pointer;
    border: none; transition: all 0.2s ease;
    font-family: 'Inter', sans-serif;
  }
  .btn-ghost { background: rgba(15,23,42,0.04); color: var(--muted); border: 1px solid var(--border); }
  .btn-ghost:hover { background: rgba(15,23,42,0.08); color: var(--text); }

  .loading-state { text-align: center; padding: 80px 40px; }
  .pulse-ring {
    width: 80px; height: 80px; border-radius: 50%;
    border: 2px solid transparent;
    border-top-color: var(--accent);
    border-right-color: rgba(14,165,233,0.3);
    animation: spin 1s linear infinite;
    margin: 0 auto 24px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .loading-sub { color: var(--muted); font-size: 14px; font-family: 'Inter', sans-serif; font-weight: 400; }

  .results-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .results-title { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
  .results-meta { font-size: 13px; color: var(--muted); font-family: 'Inter', sans-serif; font-weight: 400; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .cached-badge { font-size: 10px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: var(--ok); padding: 2px 8px; border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase; }

  /* ── Health Score Card ── */
  .score-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .score-ring-wrap { position: relative; flex-shrink: 0; }
  .score-ring-wrap svg { display: block; }
  .score-ring-pct {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column;
  }
  .score-ring-num { font-size: 22px; font-weight: 800; line-height: 1; }
  .score-ring-unit { font-size: 10px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .score-info { flex: 1; min-width: 0; }
  .score-label { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
  .score-sub { font-size: 13px; color: var(--muted); margin-bottom: 12px; }
  .score-progress-track { height: 6px; background: var(--dim); border-radius: 6px; overflow: hidden; margin-bottom: 6px; }
  .score-progress-fill { height: 100%; border-radius: 6px; transition: width 0.5s ease; }
  .score-tally { font-size: 12px; color: var(--muted); }
  .score-excellent .score-label, .score-excellent .score-ring-num { color: #10B981; }
  .score-excellent .score-progress-fill { background: #10B981; }
  .score-good .score-label, .score-good .score-ring-num { color: #0EA5E9; }
  .score-good .score-progress-fill { background: #0EA5E9; }
  .score-fair .score-label, .score-fair .score-ring-num { color: #F97316; }
  .score-fair .score-progress-fill { background: #F97316; }
  .score-review .score-label, .score-review .score-ring-num { color: #EF4444; }
  .score-review .score-progress-fill { background: #EF4444; }

  /* ── Attention / All Clear ── */
  .attention-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px; margin-top: 8px;
  }
  .attention-header-label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--danger); }
  .attention-header::after { content: ''; flex: 1; height: 1px; background: rgba(239,68,68,0.2); }
  .allclear-toggle {
    display: flex; align-items: center; gap: 10px;
    cursor: pointer; padding: 14px 16px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; margin-top: 16px; margin-bottom: 8px;
    transition: all 0.2s;
  }
  .allclear-toggle:hover { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.03); }
  .allclear-toggle-icon { font-size: 18px; }
  .allclear-toggle-label { font-size: 14px; font-weight: 600; color: var(--ok); flex: 1; }
  .allclear-count-pill {
    font-size: 11px; font-weight: 700; background: rgba(16,185,129,0.12);
    color: var(--ok); border: 1px solid rgba(16,185,129,0.2);
    padding: 2px 10px; border-radius: 20px; letter-spacing: 0.3px;
  }
  .allclear-chevron { color: var(--muted); font-size: 12px; transition: transform 0.2s; }
  .allclear-chevron.open { transform: rotate(180deg); }

  .section-title {
    font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase; color: var(--muted);
    margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
  }
  .section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .health-section { margin-bottom: 32px; }
  .health-section-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 14px; padding-bottom: 10px;
    border-bottom: 1.5px solid var(--border);
  }
  .health-section-emoji { font-size: 18px; line-height: 1; }
  .health-section-label { font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); flex: 1; }
  .health-section-alert {
    font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 600;
    background: rgba(239,68,68,0.08); color: var(--danger);
    border: 1px solid rgba(239,68,68,0.2); padding: 2px 9px;
    border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase;
  }

  .markers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; margin-bottom: 8px; }

  .marker-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; padding: 18px; position: relative; overflow: hidden;
  }
  .marker-card::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; border-radius: 3px 0 0 3px;
  }
  .marker-card.status-ok::before { background: var(--ok); }
  .marker-card.status-high::before { background: var(--danger); }
  .marker-card.status-low::before { background: var(--warn); }

  .marker-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .marker-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
  .marker-category { font-size: 11px; color: var(--muted); font-weight: 500; letter-spacing: 0.3px; }
  .marker-value { text-align: right; }
  .marker-value .val { font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 800; line-height: 1; }
  .marker-value .unit { font-size: 11px; color: var(--muted); font-weight: 600; }
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
  .info-error   { font-size: 12px; color: var(--danger); cursor: pointer; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px; }

  .range-bar-wrap { margin-bottom: 6px; }
  .range-bar-track { height: 6px; background: var(--dim); border-radius: 10px; position: relative; margin-bottom: 4px; }
  .range-bar-ok { position: absolute; top: 0; height: 100%; background: rgba(16,185,129,0.18); border-radius: 2px; }
  .range-bar-marker {
    position: absolute; top: -3px; width: 12px; height: 12px;
    border-radius: 50%; transform: translateX(-50%);
    border: 2px solid var(--bg); box-shadow: 0 0 8px currentColor;
    z-index: 2;
  }
  .status-ok .range-bar-marker { background: var(--ok); color: var(--ok); }
  .status-high .range-bar-marker { background: var(--danger); color: var(--danger); }
  .status-low .range-bar-marker { background: var(--warn); color: var(--warn); }
  .range-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); font-weight: 400; }

  .status-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px; font-size: 11px;
    font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
    font-family: 'Inter', sans-serif;
  }
  .pill-ok   { background: rgba(16,185,129,0.1);  color: var(--ok);     border: 1px solid rgba(16,185,129,0.2); }
  .pill-high { background: rgba(239,68,68,0.08);  color: var(--danger); border: 1px solid rgba(239,68,68,0.2); }
  .pill-low  { background: rgba(249,115,22,0.08); color: var(--warn);   border: 1px solid rgba(249,115,22,0.2); }

  .insights-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 24px; }
  .insights-panel h3 { font-family: 'Inter', sans-serif; font-size: 17px; font-weight: 700; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; }
  .insight-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
  .insight-icon.blue { background: rgba(14,165,233,0.1); }
  .insight-icon.teal { background: rgba(45,212,191,0.15); }
  .insight-text { font-size: 14px; line-height: 1.7; color: var(--muted); }

  .tab-empty { text-align: center; padding: 40px 20px; }
  .tab-empty-icon { font-size: 36px; margin-bottom: 14px; }
  .tab-empty-text { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
  .tab-empty-sub  { font-size: 13px; color: var(--muted); font-weight: 400; }
  .lifestyle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-top: 14px; }
  .lifestyle-item { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 14px; display: flex; gap: 10px; align-items: flex-start; }
  .lifestyle-emoji { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
  .lifestyle-label { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
  .lifestyle-desc { font-size: 12px; color: var(--muted); line-height: 1.5; }

  .disclaimer {
    background: rgba(249,115,22,0.05); border: 1px solid rgba(249,115,22,0.15);
    border-radius: 12px; padding: 14px 18px; font-size: 12px; color: var(--muted);
    line-height: 1.6; display: flex; gap: 10px; align-items: flex-start; margin-top: 24px;
  }
  .disclaimer-icon { color: var(--warn); font-size: 15px; flex-shrink: 0; margin-top: 1px; }
  .stale-notice { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; background: rgba(249,115,22,0.05); border: 1px solid rgba(249,115,22,0.15); border-radius: 10px; margin-bottom: 18px; }
  .stale-notice-text { font-size: 12px; color: var(--muted); line-height: 1.4; }
  .btn-refresh { background: none; border: 1px solid var(--accent); color: var(--accent); border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; white-space: nowrap; transition: all 0.15s; flex-shrink: 0; }
  .btn-refresh:hover { background: rgba(14,165,233,0.08); }
  .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Bottom Navigation ── */
  .bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0;
    height: calc(64px + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
    background: rgba(255,255,255,0.95);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--border);
    display: flex; align-items: stretch;
    z-index: 200;
    box-shadow: 0 -4px 20px rgba(15,23,42,0.06);
  }
  .bottom-nav-tab {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 4px; background: none; border: none;
    cursor: pointer; padding: 8px 4px; transition: all 0.15s;
    color: var(--muted); font-family: 'Inter', sans-serif;
    -webkit-tap-highlight-color: transparent;
  }
  .bottom-nav-tab.active { color: var(--accent); }
  .bottom-nav-icon { font-size: 22px; line-height: 1; }
  .bottom-nav-label { font-size: 10px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase; }

  /* ── Recent strip (upload screen) ── */
  .recent-strip { margin-top: 28px; text-align: left; max-width: 520px; margin-left: auto; margin-right: auto; }
  .recent-strip-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); margin-bottom: 10px; }
  .recent-strip-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; cursor: pointer; transition: all 0.15s; margin-bottom: 8px;
  }
  .recent-strip-item:hover { border-color: rgba(14,165,233,0.3); transform: translateY(-1px); }
  .recent-strip-icon { font-size: 18px; flex-shrink: 0; }
  .recent-strip-info { flex: 1; min-width: 0; }
  .recent-strip-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .recent-strip-date { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .report-score-pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 20px; font-size: 11px;
    font-weight: 700; letter-spacing: 0.3px; flex-shrink: 0;
    font-family: 'Inter', sans-serif;
  }
  .score-pill-excellent { background: rgba(16,185,129,0.1); color: #10B981; border: 1px solid rgba(16,185,129,0.2); }
  .score-pill-good      { background: rgba(14,165,233,0.1); color: #0EA5E9; border: 1px solid rgba(14,165,233,0.2); }
  .score-pill-fair      { background: rgba(249,115,22,0.08); color: #F97316; border: 1px solid rgba(249,115,22,0.2); }
  .score-pill-review    { background: rgba(239,68,68,0.08); color: #EF4444; border: 1px solid rgba(239,68,68,0.2); }

  /* ── Auth screen ── */
  .auth-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--bg);
  }

  .auth-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 48px 40px;
    max-width: 420px;
    width: 100%;
    text-align: center;
    box-shadow: 0 8px 40px rgba(15,23,42,0.08);
  }

  .auth-logo {
    font-family: 'Inter', sans-serif;
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
    font-weight: 400;
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
    font-family: 'Inter', sans-serif;
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
    background: var(--surface2);
    font-family: 'Inter', sans-serif;
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
    font-family: 'Inter', sans-serif;
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
    background: rgba(16,185,129,0.07); border: 1px solid rgba(16,185,129,0.2);
    border-radius: 10px; padding: 14px 16px;
  }

  /* ── Header user area ── */
  .header-right { display: flex; align-items: center; gap: 8px; }

  .header-avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700;
    flex-shrink: 0;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .header-avatar:hover { opacity: 0.85; }

  /* ── History view ── */
  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .report-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 18px 20px;
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
  .report-card:hover { border-color: rgba(14,165,233,0.3); transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
  .report-card-delete { position: absolute; top: 12px; right: 12px; background: none; border: none; color: var(--muted); font-size: 16px; cursor: pointer; padding: 4px 6px; border-radius: 6px; line-height: 1; opacity: 0; transition: opacity 0.15s, color 0.15s; }
  .report-card:hover .report-card-delete { opacity: 1; }
  .report-card-delete:hover { color: var(--danger) !important; }
  .report-delete-confirm { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .report-delete-confirm-text { font-size: 12px; color: var(--text); font-weight: 500; }
  .report-delete-confirm-btns { display: flex; gap: 8px; flex-shrink: 0; }
  .report-delete-yes { background: var(--danger); color: white; border: none; border-radius: 7px; padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
  .report-delete-no  { background: none; border: 1px solid var(--border); border-radius: 7px; padding: 5px 12px; font-size: 12px; font-weight: 500; cursor: pointer; color: var(--muted); font-family: 'Inter', sans-serif; }
  .report-card-date-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: var(--muted);
    background: var(--surface2); border: 1px solid var(--border);
    padding: 2px 8px; border-radius: 6px; margin-bottom: 8px;
  }
  .report-card-lab { font-size: 11px; color: var(--muted); font-weight: 500; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
  .report-card-note { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border); }
  .report-card-note-text { font-size: 12px; color: var(--text); line-height: 1.5; cursor: text; }
  .report-card-note-empty { font-size: 12px; color: var(--muted); font-style: italic; cursor: text; }
  .report-card-note-input { width: 100%; font-size: 12px; font-family: 'Inter', sans-serif; color: var(--text); background: rgba(255,255,255,0.8); border: 1px solid var(--accent); border-radius: 6px; padding: 6px 8px; resize: none; outline: none; line-height: 1.5; box-sizing: border-box; }

  .report-card-name { font-size: 15px; font-weight: 700; margin-bottom: 2px; color: var(--text); }
  .report-card-date { font-size: 12px; color: var(--muted); margin-bottom: 14px; font-weight: 400; }
  .report-card-stats { display: flex; gap: 16px; }
  .report-ratio-bar { display: flex; height: 3px; border-radius: 3px; overflow: hidden; background: var(--dim); margin-top: 12px; }
  .report-ratio-bar div { height: 100%; }
  .report-stat { text-align: center; }
  .report-stat-num { font-size: 20px; font-weight: 800; line-height: 1; margin-bottom: 2px; }
  .report-stat-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .report-stat.s-ok .report-stat-num { color: var(--ok); }
  .report-stat.s-high .report-stat-num { color: var(--danger); }
  .report-stat.s-low .report-stat-num { color: var(--warn); }
  .report-stat.s-total .report-stat-num { color: var(--accent); }

  /* ── Debug table ── */
  .debug-wrap { overflow-x: auto; }
  .debug-table { border-collapse: collapse; width: 100%; font-size: 12px; font-family: 'Inter', sans-serif; }
  .debug-table th { background: var(--surface2); border: 1px solid var(--border); padding: 8px 12px; text-align: left; font-weight: 700; white-space: nowrap; position: sticky; top: 0; }
  .debug-table th.col-marker { position: sticky; left: 0; z-index: 2; min-width: 180px; }
  .debug-table td { border: 1px solid var(--border); padding: 6px 12px; white-space: nowrap; background: var(--surface); }
  .debug-table td.col-marker { font-weight: 600; position: sticky; left: 0; background: var(--surface2); z-index: 1; }
  .debug-table tr:hover td { background: rgba(14,165,233,0.05); }
  .debug-table tr:hover td.col-marker { background: var(--surface2); }
  .debug-cell-ok   { color: var(--ok); }
  .debug-cell-high { color: var(--danger); font-weight: 600; }
  .debug-cell-low  { color: var(--warn);   font-weight: 600; }
  .debug-cell-none { color: var(--muted);  }
  .debug-section-header { background: rgba(14,165,233,0.07) !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--accent); padding: 10px 16px; }
  .debug-table tr.debug-section-row:hover td { background: rgba(14,165,233,0.07); }

  .year-divider {
    font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
    color: var(--muted); margin: 24px 0 12px; display: flex; align-items: center; gap: 12px;
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
  .history-empty-sub { font-size: 14px; font-weight: 400; }

  /* ── Profile screen ── */
  .profile-screen { max-width: 560px; margin: 0 auto; }
  .form-group { margin-bottom: 22px; }
  .form-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--muted); margin-bottom: 8px; display: block; }
  .form-input { width: 100%; padding: 11px 14px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface2); font-family: 'Inter', sans-serif; font-size: 14px; color: var(--text); outline: none; transition: border-color 0.2s; }
  .form-input:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--muted); }
  .radio-group { display: flex; gap: 10px; flex-wrap: wrap; }
  .radio-option { display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 8px 14px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--muted); transition: all 0.15s; user-select: none; }
  .radio-option:hover { border-color: rgba(14,165,233,0.4); color: var(--text); }
  .radio-option.selected { border-color: var(--accent); background: rgba(14,165,233,0.07); color: var(--text); }
  .radio-option input { display: none; }
  .checkbox-group { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
  .checkbox-option { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--muted); transition: all 0.15s; user-select: none; }
  .checkbox-option:hover { border-color: rgba(14,165,233,0.4); color: var(--text); }
  .checkbox-option.selected { border-color: var(--accent); background: rgba(14,165,233,0.07); color: var(--text); }
  .checkbox-option input { display: none; }
  .profile-actions { display: flex; gap: 12px; margin-top: 28px; }
  .profile-error { font-size: 13px; color: var(--danger); margin-top: 12px; }
  .danger-zone { margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--border); }
  .danger-zone-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 16px; }
  .btn-delete { background: none; border: 1px solid var(--danger); color: var(--danger); border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif; }
  .btn-delete:hover { background: rgba(239,68,68,0.06); }
  .delete-confirm-text { font-size: 13px; color: var(--text); line-height: 1.5; }
  .btn-delete-confirm { background: var(--danger); color: white; border: none; border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; }
  .btn-delete-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Trends screen ── */
  .trends-empty { text-align: center; padding: 80px 40px; color: var(--muted); }
  .trends-empty-icon { font-size: 48px; margin-bottom: 20px; }
  .trends-empty-text { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--text); }
  .trends-empty-sub { font-size: 14px; font-weight: 400; }

  /* ── Progress card ── */
  .trends-progress-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 20px 20px 14px; }
  .trends-progress-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--muted); margin-bottom: 4px; }
  .trends-progress-timeline { position: relative; display: flex; justify-content: space-between; align-items: center; padding: 20px 0 18px; }
  .trends-progress-line { position: absolute; left: 6px; right: 6px; top: 50%; height: 2px; background: linear-gradient(to right, var(--border), var(--accent), var(--ok)); opacity: 0.35; transform: translateY(-50%); pointer-events: none; }
  .trends-progress-point { display: flex; flex-direction: column; align-items: center; gap: 5px; position: relative; z-index: 1; }
  .trends-progress-pct { font-size: 10px; font-family: 'Inter', sans-serif; line-height: 1; }
  .trends-progress-dot { border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 0 1px rgba(0,0,0,0.08); flex-shrink: 0; }
  .trends-progress-date { font-size: 10px; color: var(--muted); font-family: 'Inter', sans-serif; line-height: 1; }
  .trends-progress-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
  .trends-progress-delta { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; }
  .trends-progress-delta-arrow { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; }
  .trends-progress-sub { font-size: 12px; color: var(--muted); }

  /* ── Section headers ── */
  .trends-section-header { display: flex; align-items: center; justify-content: space-between; padding: 0 2px; margin-top: 6px; }
  .trends-section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; display: flex; align-items: center; gap: 8px; }
  .trends-section-title.danger { color: var(--danger); }
  .trends-section-title.ok     { color: var(--ok); }
  .trends-section-badge { border-radius: 20px; padding: 2px 8px; font-size: 11px; font-weight: 700; }
  .trends-section-title.danger .trends-section-badge { background: var(--danger); color: white; }
  .trends-section-title.ok     .trends-section-badge { background: rgba(16,185,129,0.12); color: var(--ok); }
  .trends-section-toggle { font-size: 12px; color: var(--accent); font-weight: 600; cursor: pointer; border: none; background: none; font-family: 'Inter', sans-serif; }

  /* ── Marker list ── */
  .trend-marker-list { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; }
  .trend-marker-row { border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.15s; }
  .trend-marker-row:hover { background: var(--surface2); }
  .trend-marker-row.tmr-expanded { background: var(--surface2); }
  .trend-marker-row.tmr-last { border-bottom: none; }
  .trend-marker-top { display: flex; align-items: center; gap: 9px; padding: 13px 16px 0; }
  .trend-sparkline-wrap { padding: 7px 16px 11px 35px; }
  .trend-marker-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
  .trend-marker-name { font-size: 14px; font-weight: 600; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-transform: capitalize; }
  .trend-marker-value { font-size: 14px; font-weight: 700; white-space: nowrap; }
  .trend-marker-unit { font-size: 11px; color: var(--muted); font-weight: 400; }
  .trend-marker-arrow { font-size: 13px; flex-shrink: 0; }

  /* ── Delta tag ── */
  .trend-delta { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
  .trend-delta-bad  { background: rgba(239,68,68,0.10);  color: var(--danger); }
  .trend-delta-ok   { background: rgba(16,185,129,0.10); color: var(--ok); }
  .trend-delta-neu  { background: var(--dim); color: var(--muted); }

  /* ── Accordion chart panel ── */
  .trend-accordion { border-top: 1px solid var(--border); padding: 16px; }

  /* ── Optimal ranges ── */
  .range-bar-optimal { position: absolute; top: 0; height: 100%; background: rgba(14,165,233,0.22); border-left: 2px solid rgba(14,165,233,0.5); border-right: 2px solid rgba(14,165,233,0.5); z-index: 1; }

  /* ── Trend stats + legend (inside accordion) ── */
  .trend-stats { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
  .trend-stat { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; min-width: 72px; }
  .trend-stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: var(--muted); margin-bottom: 4px; }
  .trend-stat-value { font-size: 17px; font-weight: 800; line-height: 1; }
  .trend-stat-unit { font-size: 11px; color: var(--muted); margin-left: 3px; font-weight: 400; }
  .trend-stat.s-ok      .trend-stat-value { color: var(--ok); }
  .trend-stat.s-high    .trend-stat-value { color: var(--danger); }
  .trend-stat.s-low     .trend-stat-value { color: var(--warn); }
  .trend-stat.s-neutral .trend-stat-value { color: var(--text); }
  .trend-legend { display: flex; gap: 14px; margin-top: 14px; flex-wrap: wrap; align-items: center; padding-top: 12px; border-top: 1px solid var(--border); }
  .trend-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); }

  /* ── Priorities card ── */
  .priorities-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 18px 20px; }
  .priorities-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .priorities-card-icon { font-size: 17px; }
  .priorities-card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: var(--text); }
  .priority-item { display: flex; gap: 14px; align-items: flex-start; padding: 12px 0 0; margin-top: 12px; border-top: 1px solid var(--border); }
  .priority-rank { width: 22px; height: 22px; border-radius: 50%; background: var(--dim); font-size: 11px; font-weight: 800; color: var(--muted); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .priority-body { flex: 1; min-width: 0; }
  .priority-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
  .priority-name { font-size: 14px; font-weight: 600; text-transform: capitalize; }
  .priority-value { font-size: 12px; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
  .priority-action { font-size: 13px; color: var(--muted); line-height: 1.5; }

  /* ── Pattern banners ── */
  .patterns-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }
  .pattern-banner { display: flex; align-items: flex-start; gap: 12px; background: rgba(249,115,22,0.07); border: 1px solid rgba(249,115,22,0.22); border-radius: 14px; padding: 12px 14px; }
  .pattern-banner-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  .pattern-banner-body { flex: 1; min-width: 0; }
  .pattern-banner-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
  .pattern-banner-desc  { font-size: 12px; color: var(--muted); line-height: 1.5; }

  /* ── Life Events ── */
  .events-section { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 16px 18px; margin-bottom: 16px; }
  .events-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .events-section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: var(--text); }
  .events-add-btn { font-size: 13px; font-weight: 600; color: var(--accent); background: rgba(14,165,233,0.1); border: 1px solid rgba(14,165,233,0.2); border-radius: 20px; padding: 5px 14px; cursor: pointer; font-family: 'Inter', sans-serif; }
  .events-add-btn:hover { background: rgba(14,165,233,0.18); }
  .events-empty { font-size: 13px; color: var(--muted); line-height: 1.5; padding: 4px 0; }
  .events-list { display: flex; flex-direction: column; gap: 8px; }
  .event-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px; background: var(--surface2); border-radius: 12px; }
  .event-icon { font-size: 17px; flex-shrink: 0; margin-top: 1px; }
  .event-body { flex: 1; min-width: 0; }
  .event-label { font-size: 13px; font-weight: 600; color: var(--text); }
  .event-date  { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .event-delete { background: none; border: none; color: var(--muted); font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1; flex-shrink: 0; font-family: 'Inter', sans-serif; }
  .event-delete:hover { color: var(--danger); }
  .event-modal-overlay { position: fixed; inset: 0; z-index: 300; background: rgba(15,23,42,0.45); display: flex; align-items: flex-end; justify-content: center; animation: fadeIn 0.15s; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .event-modal { background: var(--surface); border-radius: 24px 24px 0 0; padding: 28px 20px calc(28px + env(safe-area-inset-bottom)); width: 100%; max-width: 680px; animation: slideUp 0.22s cubic-bezier(0.34,1.2,0.64,1); }
  .event-modal-title { font-size: 17px; font-weight: 700; margin-bottom: 20px; }
  .event-type-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .event-type-pill { display: flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 20px; border: 1.5px solid var(--border); background: var(--surface2); font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; color: var(--text); }
  .event-type-pill.selected { border-color: var(--accent); background: rgba(14,165,233,0.1); color: var(--accent); font-weight: 600; }
  .event-modal-actions { display: flex; gap: 10px; margin-top: 20px; }

  /* ── Bio Age Card ── */
  .bio-age-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 20px; margin-bottom: 16px; }
  .bio-age-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .bio-age-icon { font-size: 20px; }
  .bio-age-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.7px; color: var(--text); }
  .bio-age-body { display: flex; align-items: center; gap: 18px; }
  .bio-age-number { font-size: 52px; font-weight: 800; letter-spacing: -2px; line-height: 1; }
  .bio-age-number.ba-younger { color: var(--ok); }
  .bio-age-number.ba-older   { color: var(--danger); }
  .bio-age-number.ba-neutral { color: var(--accent); }
  .bio-age-info { flex: 1; min-width: 0; }
  .bio-age-label { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .bio-age-delta { font-size: 13px; font-weight: 500; }
  .bio-age-delta.ba-younger { color: var(--ok); }
  .bio-age-delta.ba-older   { color: var(--danger); }
  .bio-age-delta.ba-neutral { color: var(--muted); }
  .bio-age-timeline { display: flex; gap: 0; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border); overflow-x: auto; }
  .bio-age-tl-item { flex: 1; min-width: 48px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .bio-age-tl-age  { font-size: 14px; font-weight: 700; }
  .bio-age-tl-bar  { width: 3px; height: 18px; border-radius: 2px; }
  .bio-age-tl-date { font-size: 10px; color: var(--muted); text-align: center; white-space: nowrap; }
  .bio-age-footer  { font-size: 11px; color: var(--muted); margin-top: 10px; line-height: 1.5; }
  .bio-age-needs   { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; }
  .bio-age-needs-title   { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 5px; }
  .bio-age-needs-markers { font-size: 12px; color: var(--muted); line-height: 1.6; }

  /* ── Chat FAB ── */
  .chat-fab { position: fixed; bottom: calc(76px + env(safe-area-inset-bottom)); right: 20px; width: 52px; height: 52px; border-radius: 50%; background: var(--accent); color: white; border: none; box-shadow: 0 4px 20px rgba(14,165,233,0.38); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 22px; z-index: 100; transition: transform 0.15s, box-shadow 0.15s; font-family: 'Inter', sans-serif; }
  .chat-fab:hover { transform: scale(1.07); box-shadow: 0 6px 24px rgba(14,165,233,0.5); }
  .chat-fab:active { transform: scale(0.95); }

  /* ── Chat overlay ── */
  .chat-overlay { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; background: var(--bg); animation: slideUp 0.26s cubic-bezier(0.34,1.4,0.64,1); }
  @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .chat-overlay-header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 52px 20px 14px; display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .chat-overlay-title { font-size: 17px; font-weight: 700; flex: 1; letter-spacing: -0.3px; }
  .chat-overlay-close { width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--dim); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 15px; color: var(--muted); font-family: 'Inter', sans-serif; }
  .chat-messages { flex: 1; overflow-y: auto; padding: 16px 16px 0; display: flex; flex-direction: column; gap: 12px; }
  .chat-empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 32px 28px 16px; text-align: center; }
  .chat-empty-icon { font-size: 42px; }
  .chat-empty-text { font-size: 14px; color: var(--muted); line-height: 1.6; max-width: 280px; }
  .chat-starters { padding: 12px 16px 0; display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
  .chat-starter { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; font-size: 14px; font-family: 'Inter', sans-serif; color: var(--text); text-align: left; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
  .chat-starter:hover { border-color: rgba(14,165,233,0.4); background: rgba(14,165,233,0.04); }
  .chat-msg { display: flex; flex-direction: column; max-width: 84%; }
  .chat-msg-user  { align-self: flex-end;  align-items: flex-end; }
  .chat-msg-model { align-self: flex-start; align-items: flex-start; }
  .chat-bubble { padding: 11px 14px; border-radius: 18px; font-size: 14px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
  .chat-msg-user  .chat-bubble { background: var(--accent); color: white; border-bottom-right-radius: 4px; }
  .chat-msg-model .chat-bubble { background: var(--surface); border: 1px solid var(--border); color: var(--text); border-bottom-left-radius: 4px; }
  .chat-typing { align-self: flex-start; padding: 12px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: 18px; border-bottom-left-radius: 4px; font-size: 18px; letter-spacing: 3px; color: var(--muted); }
  .chat-input-row { display: flex; align-items: flex-end; gap: 10px; padding: 12px 16px; padding-bottom: calc(12px + env(safe-area-inset-bottom)); border-top: 1px solid var(--border); background: var(--surface); flex-shrink: 0; }
  .chat-input { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 22px; padding: 10px 16px; font-size: 14px; font-family: 'Inter', sans-serif; color: var(--text); outline: none; resize: none; line-height: 1.4; max-height: 100px; }
  .chat-input:focus { border-color: rgba(14,165,233,0.5); }
  .chat-send { width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; transition: opacity 0.15s; font-family: 'Inter', sans-serif; }
  .chat-send:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ── Sync toast ── */
  .sync-toast {
    position: fixed; bottom: calc(72px + env(safe-area-inset-bottom)); right: 16px;
    padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600;
    z-index: 1000; animation: fadeIn 0.2s ease; box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    display: flex; align-items: center; gap: 8px;
  }
  .sync-toast-saved { background: var(--surface); color: var(--ok);     border: 1px solid rgba(16,185,129,0.3); }
  .sync-toast-error { background: var(--surface); color: var(--danger); border: 1px solid rgba(239,68,68,0.3); }

  /* ── Onboarding card ── */
  .toggle-row { display: flex; align-items: flex-start; gap: 14px; cursor: pointer; }
  .toggle-switch { position: relative; width: 40px; height: 22px; flex-shrink: 0; margin-top: 2px; }
  .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
  .toggle-slider { position: absolute; inset: 0; background: var(--dim); border-radius: 22px; transition: background 0.2s; }
  .toggle-slider::before { content: ''; position: absolute; width: 16px; height: 16px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
  .toggle-switch input:checked + .toggle-slider { background: var(--accent); }
  .toggle-switch input:checked + .toggle-slider::before { transform: translateX(18px); }
  .toggle-label { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .toggle-desc { font-size: 12px; color: var(--muted); line-height: 1.6; }
  .settings-info-box { background: rgba(15,23,42,0.03); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; font-size: 12px; color: var(--muted); line-height: 1.65; margin-top: 8px; }
  .settings-info-box strong { color: var(--text); font-weight: 600; }

  .onboarding-card {
    background: rgba(14,165,233,0.06); border: 1px solid rgba(14,165,233,0.2);
    border-radius: 16px; padding: 18px 22px; margin-bottom: 28px;
    display: flex; gap: 14px; align-items: flex-start;
  }
  .onboarding-icon  { font-size: 26px; flex-shrink: 0; }
  .onboarding-title { font-size: 15px; font-weight: 700; margin-bottom: 5px; color: var(--text); }
  .onboarding-text  { font-size: 13px; color: var(--muted); line-height: 1.6; }

  @media (max-width: 680px) {
    .markers-grid  { grid-template-columns: 1fr; }
    .main { padding: 24px 12px; padding-bottom: calc(80px + env(safe-area-inset-bottom)); }
    .results-title { font-size: 20px; }
    .score-card { flex-direction: column; text-align: center; }
  }

  @media (max-width: 600px) {
    .header { padding: 12px 16px; padding-top: calc(12px + env(safe-area-inset-top)); }
    .upload-title { font-size: 28px; }
    .drop-zone { padding: 36px 16px; }
    .auth-card { padding: 36px 24px; }
    .lifestyle-grid { grid-template-columns: 1fr; }
  }
`;

function computeHealthScore(markers) {
  if (!markers || markers.length === 0) return null;
  var inRange = markers.filter(function(m) {
    return getStatus(m.value, m.low, m.high) === "ok";
  }).length;
  var pct = Math.round((inRange / markers.length) * 100);
  var label, cls;
  if (pct >= 90)      { label = t("score_excellent"); cls = "score-excellent"; }
  else if (pct >= 75) { label = t("score_good");      cls = "score-good"; }
  else if (pct >= 55) { label = t("score_fair");      cls = "score-fair"; }
  else                { label = t("score_review");    cls = "score-review"; }
  return { pct: pct, inRange: inRange, total: markers.length, label: label, cls: cls };
}

function HealthScoreCard({ markers }) {
  var score = computeHealthScore(markers);
  if (!score) return null;
  var r = 34;
  var circ = 2 * Math.PI * r;
  var dash = (score.pct / 100) * circ;
  var colorMap = { "score-excellent": "#10B981", "score-good": "#0EA5E9", "score-fair": "#F97316", "score-review": "#EF4444" };
  var color = colorMap[score.cls] || "#0EA5E9";
  var subKey = "score_sub_" + score.cls.replace("score-", "");
  return (
    <div className={"score-card " + score.cls}>
      <div className="score-ring-wrap">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="var(--dim)" strokeWidth="6" />
          <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={dash + " " + circ}
            strokeLinecap="round"
            transform="rotate(-90 44 44)"
          />
        </svg>
        <div className="score-ring-pct">
          <span className="score-ring-num">{score.pct}</span>
          <span className="score-ring-unit">%</span>
        </div>
      </div>
      <div className="score-info">
        <div className="score-label">{score.label}</div>
        <div className="score-sub">{t(subKey)}</div>
        <div className="score-progress-track">
          <div className="score-progress-fill" style={{ width: score.pct + "%" }} />
        </div>
        <div className="score-tally">{score.inRange} / {score.total} markers in range</div>
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function parseReportDate(item) {
  if (item.report_date) {
    var d = new Date(item.report_date);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(item.created_at);
}

function buildHistorySummary(history) {
  if (!history || history.length === 0) return null;
  var sorted = history.slice().sort(function(a, b) {
    return parseReportDate(a) - parseReportDate(b);
  }).slice(-4); // last 4 reports
  var lines = sorted.map(function(r) {
    var dateLabel = r.report_date || new Date(r.created_at).toLocaleDateString();
    var markers = (r.markers || []).slice(0, 20).map(function(m) {
      var st = getStatus(m.value, m.low, m.high);
      return m.name + ": " + m.value + " " + (m.unit || "") + (st !== "ok" ? " [" + st + "]" : "");
    }).join(", ");
    return dateLabel + " — " + markers;
  }).join("\n");
  return lines || null;
}

function getStatus(value, low, high) {
  if (value < low) return "low";
  if (value > high) return "high";
  return "ok";
}

function StatusPill({ status }) {
  const map = { ok: ["pill-ok", t("pill_normal")], high: ["pill-high", t("pill_high")], low: ["pill-low", t("pill_low")] };
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
          {t("range_lab")}
          {hasOptimal && (
            <> · <span style={{ color: "var(--accent)" }}>{t("range_optimal")}</span></>
          )}
        </span>
        <span>{high}</span>
      </div>
    </div>
  );
}

function MarkerCard({ marker, unitSystem, showOptimalRanges }) {
  const { name, value, unit, low, high } = marker;
  var category = getMarkerCategory(name, marker.category);
  // Show original lab units when available (raw_* fields set during normalizeMarkers).
  // Falls back to normalized values for reports saved before this change.
  var dispVal  = marker.raw_value !== undefined ? marker.raw_value : value;
  var dispLow  = marker.raw_low   !== undefined ? marker.raw_low   : low;
  var dispHigh = marker.raw_high  !== undefined ? marker.raw_high  : high;
  var dispUnit = marker.raw_unit  !== undefined ? marker.raw_unit  : unit;
  const status = getStatus(dispVal, dispLow, dispHigh);
  // Optimal ranges are stored in preferred unit; try to match the raw display unit.
  var optimal = showOptimalRanges ? getOptimalRange(name) : null;
  var dispOptLow = null, dispOptHigh = null;
  if (optimal) {
    var norm = UNIT_NORMS[name];
    if (!norm || dispUnit.toLowerCase() === (norm.preferred || "").toLowerCase()) {
      dispOptLow  = optimal.low;
      dispOptHigh = optimal.high;
    } else if (norm.si && dispUnit.toLowerCase() === norm.si.unit.toLowerCase()) {
      dispOptLow  = parseFloat((optimal.low  * norm.si.factor).toFixed(2));
      dispOptHigh = parseFloat((optimal.high * norm.si.factor).toFixed(2));
    }
    // else: raw unit has no known conversion from preferred — skip optimal overlay
  }
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
          <div className="marker-category">{localizeSection(category)}</div>
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
          {loadingInfo && <div className="info-loading">{t("info_loading")}</div>}
          {infoError   && <div className="info-error" onClick={handleInfoClick}>{t("info_error")}</div>}
          {info && !loadingInfo && (
            <>
              <div className="info-block">
                <div className="info-block-label">{t("info_what")}</div>
                <div className="info-block-text">{info.what}</div>
              </div>
              <div className="info-block">
                <div className="info-block-label">{t("info_implications")}</div>
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
    id: "cardiovascular", label: "Heart & Cardiovascular", labelTr: "Kalp ve Kardiyovasküler", emoji: "❤️", color: "#B84838",
    keywords: ["cholesterol", "ldl", "hdl", "triglyceride", "vldl", "lipoprotein",
      "apolipoprotein", "apob", "apoa", "apo b", "apo a", "homocysteine",
      "bnp", "nt-probnp", "troponin", "creatine kinase", "ck-mb", "ck mb",
      "hs-crp", "hscrp", "c-reactive protein", "non-hdl", "cardiac", "d-dimer"]
  },
  {
    id: "liver", label: "Liver Health", labelTr: "Karaciğer Sağlığı", emoji: "🫁", color: "#A06830",
    keywords: ["alt", "alanine aminotransferase", "sgpt", "ast", "aspartate aminotransferase",
      "sgot", "alp", "alkaline phosphatase", "ggt", "gamma-glutamyl", "gamma glutamyl",
      "bilirubin", "albumin", "total protein", "globulin", "a/g ratio", "ag ratio",
      "prothrombin", "inr", "lactate dehydrogenase", "ldh"]
  },
  {
    id: "kidney", label: "Kidney Health", labelTr: "Böbrek Sağlığı", emoji: "🫘", color: "#4A9E80",
    keywords: ["creatinine", "bun", "blood urea nitrogen", "urea", "egfr", "gfr",
      "uric acid", "cystatin", "microalbumin", "uacr", "renal", "bun/creatinine"]
  },
  {
    id: "blood_sugar", label: "Blood Sugar & Metabolic", labelTr: "Kan Şekeri ve Metabolizma", emoji: "🩸", color: "#C97B28",
    keywords: ["glucose", "hba1c", "hemoglobin a1c", "haemoglobin a1c", "glycated hemoglobin",
      "insulin", "homa", "c-peptide", "c peptide", "fructosamine", "blood sugar"]
  },
  {
    id: "blood_count", label: "Complete Blood Count", labelTr: "Tam Kan Sayımı", emoji: "🔬", color: "#B84860",
    keywords: ["wbc", "white blood cell", "white blood count", "rbc", "red blood cell",
      "red blood count", "hemoglobin", "haemoglobin", "hematocrit", "haematocrit",
      "mcv", "mch", "mchc", "rdw", "platelet", "plt", "mpv",
      "neutrophil", "lymphocyte", "monocyte", "eosinophil", "basophil", "reticulocyte"]
  },
  {
    id: "thyroid", label: "Thyroid", labelTr: "Tiroid", emoji: "🦋", color: "#5080B0",
    keywords: ["tsh", "thyroid stimulating", "thyrotropin", "free t4", "ft4", "thyroxine",
      "free t3", "ft3", "triiodothyronine", "anti-tpo", "anti tpo", "thyroid peroxidase",
      "anti-tg", "thyroglobulin", "reverse t3", "rt3", "thyroid"]
  },
  {
    id: "vitamins", label: "Vitamins & Minerals", labelTr: "Vitaminler ve Mineraller", emoji: "💊", color: "#5A8A3A",
    keywords: ["vitamin d", "25-oh", "25 oh", "vitamin b12", "b12", "cobalamin",
      "folate", "folic acid", "vitamin b6", "pyridoxine", "vitamin c", "ascorbic",
      "vitamin a", "retinol", "vitamin e", "tocopherol", "vitamin k",
      "ferritin", "tibc", "transferrin saturation", "zinc", "magnesium",
      "selenium", "copper", "phosphorus", "phosphate", "iodine"]
  },
  {
    id: "electrolytes", label: "Electrolytes", labelTr: "Elektrolitler", emoji: "⚡", color: "#6E78C0",
    keywords: ["sodium", "potassium", "chloride", "bicarbonate", "co2", "carbon dioxide",
      "anion gap", "osmolality", "osmolarity"]
  },
  {
    id: "hormones", label: "Hormones", labelTr: "Hormonlar", emoji: "⚗️", color: "#8B5EA0",
    keywords: ["testosterone", "estradiol", "estrogen", "oestradiol", "progesterone",
      "fsh", "follicle stimulating", "lh", "luteinizing", "luteinising",
      "prolactin", "dhea", "cortisol", "shbg", "sex hormone binding",
      "igf", "growth hormone", "psa", "prostate specific", "amh", "anti-mullerian",
      "androstenedione", "dihydrotestosterone", "dht", "parathyroid", "pth"]
  },
  {
    id: "inflammation", label: "Inflammation & Immunity", labelTr: "İltihap ve Bağışıklık", emoji: "🛡️", color: "#3A8FA8",
    keywords: ["crp", "c-reactive protein", "esr", "erythrocyte sedimentation",
      "interleukin", "il-6", "tnf", "procalcitonin", "pct",
      "complement", "immunoglobulin", "igg", "iga", "igm",
      "ana", "antinuclear", "rheumatoid factor", "anti-ccp"]
  },
  {
    id: "bone", label: "Bone Health", labelTr: "Kemik Sağlığı", emoji: "🦴", color: "#6A8090",
    keywords: ["calcium", "osteocalcin", "ctx", "c-telopeptide", "bone density",
      "deoxypyridinoline", "p1np", "bone alkaline"]
  },
  {
    id: "iron", label: "Iron Studies", labelTr: "Demir Çalışmaları", emoji: "🔩", color: "#B07840",
    keywords: ["iron", "serum iron", "tibc", "transferrin", "ferritin", "saturation"]
  },
];

var CONDITION_OPTIONS = ["Diabetes","Hypertension","High Cholesterol","Thyroid Disorder","Anemia","Other"];

var CONDITION_KEYS = {
  "Diabetes":         "cond_diabetes",
  "Hypertension":     "cond_hypertension",
  "High Cholesterol": "cond_high_cholesterol",
  "Thyroid Disorder": "cond_thyroid",
  "Anemia":           "cond_anemia",
  "Other":            "cond_other",
};

// ── i18n ──────────────────────────────────────────────────────────────────────

var STRINGS = {
  en: {
    auth_tagline: "Your blood work, decoded.",
    auth_check_inbox: "Check your inbox!",
    auth_sent_to: "We sent a sign-in link to",
    auth_click_link: "Click the link to continue.",
    auth_use_different: "Use a different email",
    auth_google: "Continue with Google",
    auth_or: "or",
    auth_email_ph: "Enter your email",
    auth_sending: "Sending\u2026",
    auth_magic_link: "Send magic link",
    hdr_edit_profile: "Edit profile",
    hdr_trends: "Trends",
    hdr_debug: "Debug: marker table",
    hdr_history: "Report history",
    hdr_sign_out: "Sign out",
    loading_analyzing: "Analyzing your report",
    loading_sub: "Extracting markers \u00b7 Interpreting results \u00b7 Generating guidance",
    upload_title1: "Your blood work,",
    upload_title2: "decoded.",
    upload_sub: "Upload your lab report and get instant visual insights and lifestyle guidance.",
    upload_drop_label: "Drop your lab report here",
    upload_drop_hint: "PDF \u00b7 JPG \u00b7 PNG supported",
    upload_privacy: "Your report is processed securely and saved to your account.",
    btn_new_report: "+ New Report",
    history_title: "Report History",
    history_saved: "{{n}} report{{s}} saved",
    history_empty_text: "No reports yet",
    history_empty_sub: "Upload your first lab report to get started.",
    history_fallback_name: "Lab Report",
    stat_total: "Total",
    stat_normal: "Normal",
    stat_high: "High",
    stat_low: "Low",
    note_ph: "Add a note\u2026",
    delete_report_q: "Delete this report?",
    btn_delete: "Delete",
    btn_cancel: "Cancel",
    trends_title: "Marker Trends",
    trends_meta: "Track changes across reports over time",
    trends_empty_text: "Not enough data yet",
    trends_empty_sub: "Upload at least 2 reports to see trends",
    trends_no_shared_text: "No shared markers found",
    trends_no_shared_sub: "No markers appear in 2 or more reports yet",
    trends_all_domains: "All Domains",
    trends_n_markers: "{{n}} marker{{s}}",
    trends_all_normal: "All normal",
    trends_n_oor: "{{n}} out of range",
    trends_latest: "Latest",
    trends_min: "Min",
    trends_max: "Max",
    trends_avg: "Avg",
    legend_normal: "Normal",
    legend_high: "High",
    legend_low: "Low",
    legend_lab_range: "Lab range",
    legend_optimal: "Optimal range",
    results_title: "Lab Results Overview",
    results_n_markers: "{{n}} markers analyzed",
    badge_cached: "cached",
    btn_history: "History",
    tab_markers: "Markers",
    tab_insights: "Insights",
    tab_lifestyle: "Lifestyle",
    s_label_markers: "Markers",
    section_oor: "{{n}} out of range",
    insights_title: "Clinical Interpretation",
    stale_notice: "A report was added that may affect this interpretation.",
    btn_refreshing: "Refreshing\u2026",
    btn_refresh: "\u21ba Refresh",
    no_interpretation: "No interpretation available",
    no_interpretation_sub: "Re-upload this report to generate a clinical summary",
    lifestyle_title: "Lifestyle and Nutrition Guidance",
    lifestyle_intro: "Personalized recommendations based on your results:",
    no_lifestyle: "No recommendations available",
    no_lifestyle_sub: "Re-upload this report to generate lifestyle guidance",
    disclaimer: "This is an AI-generated analysis for informational purposes only. It is not a medical device and does not constitute medical advice. AI interpretation may contain errors \u2014 always verify against your original lab report and consult a qualified healthcare professional before making any health decisions.",
    info_loading: "Loading\u2026",
    info_error: "\u21ba Could not load info \u2014 tap to retry",
    info_what: "What is this?",
    info_implications: "What does it mean?",
    range_lab: "Lab range",
    range_optimal: "Optimal",
    pill_normal: "Normal",
    pill_high: "High",
    pill_low: "Low",
    toast_saved: "\u2713 Saved to history",
    toast_error: "\u26a0 Sync failed",
    footer: "VitaScan provides AI-generated analysis for <strong>informational purposes only</strong>. It is not a medical device and does not constitute medical advice. AI analysis may contain errors \u2014 always verify results with your original lab report and consult a qualified healthcare professional before making any health decisions.",
    onboarding_title: "Welcome to VitaScan",
    onboarding_text: "Tell us a bit about yourself so we can personalise your results and flag markers that matter most for your health profile. You can update this any time.",
    profile_edit_title: "Edit Profile",
    profile_new_title: "Your Profile",
    profile_meta: "Help us personalise your results",
    lbl_full_name: "Full Name",
    lbl_age: "Age",
    lbl_bio_sex: "Biological Sex",
    sex_male: "Male",
    sex_female: "Female",
    sex_other: "Other",
    lbl_conditions: "Known Conditions",
    lbl_unit_system: "Unit System",
    unit_us: "US Conventional",
    unit_si: "SI / Metric",
    lbl_display_prefs: "Display Preferences",
    optimal_toggle_label: "Show Optimal Ranges",
    optimal_toggle_desc: "Displays an amber zone on the marker bar representing functional medicine target ranges \u2014 tighter than standard lab reference ranges, based on longevity and preventive health research. These are not diagnostic thresholds and are not universally accepted by conventional medicine. Use as a starting point for discussion with your doctor.",
    ref_ranges_title: "Where do reference ranges come from?",
    ref_ranges_body: " The green band on each marker bar is extracted directly from your lab report \u2014 each laboratory sets its own reference ranges based on its equipment, reagents, and local population data. This means ranges may differ between labs and countries, which is normal and expected. VitaScan does not override them.",
    lbl_language: "Language",
    btn_saving: "Saving\u2026",
    btn_save_profile: "Save Profile",
    danger_zone: "Danger Zone",
    btn_delete_account: "Delete Account",
    delete_confirm_text: "This permanently deletes all your reports, profile, and account. It cannot be undone.",
    btn_delete_all: "Yes, delete everything",
    btn_deleting: "Deleting\u2026",
    debug_title: "Marker Debug Table",
    debug_renormalizing: "Re-normalizing\u2026",
    debug_renormalize: "Re-normalize All",
    debug_export_excel: "Export to Excel",
    debug_back: "\u2190 Back",
    cond_diabetes: "Diabetes",
    cond_hypertension: "Hypertension",
    cond_high_cholesterol: "High Cholesterol",
    cond_thyroid: "Thyroid Disorder",
    cond_anemia: "Anemia",
    cond_other: "Other",
    score_excellent: "Excellent",
    score_good: "Good",
    score_fair: "Fair",
    score_review: "Needs Review",
    score_sub_excellent: "Your results look great",
    score_sub_good: "Most markers in healthy range",
    score_sub_fair: "Some markers need attention",
    score_sub_review: "Several markers need attention",
    section_attention: "Needs Attention",
    section_allclear: "All Clear",
    nav_home: "Home",
    nav_history: "History",
    nav_trends: "Trends",
    nav_profile: "Profile",
    chat_title: "Ask AI",
    chat_placeholder: "Ask about your results…",
    chat_empty: "Ask me anything about your blood test results. I have full context on your markers and trends.",
    chat_starter_1: "Summarise my latest results",
    chat_starter_2: "What should I focus on improving?",
    chat_starter_3: "Explain my out-of-range markers",
    chat_error: "Something went wrong. Please try again.",
  },
  tr: {
    auth_tagline: "Kan tahlilleriniz, yorumland\u0131.",
    auth_check_inbox: "Gelen kutunuzu kontrol edin!",
    auth_sent_to: "adresine giri\u015f ba\u011flant\u0131s\u0131 g\u00f6nderdik:",
    auth_click_link: "Devam etmek i\u00e7in ba\u011flant\u0131ya t\u0131klay\u0131n.",
    auth_use_different: "Farkl\u0131 bir e-posta kullan",
    auth_google: "Google ile devam et",
    auth_or: "veya",
    auth_email_ph: "E-posta adresinizi girin",
    auth_sending: "G\u00f6nderiliyor\u2026",
    auth_magic_link: "Giri\u015f ba\u011flant\u0131s\u0131 g\u00f6nder",
    hdr_edit_profile: "Profili d\u00fczenle",
    hdr_trends: "E\u011filimler",
    hdr_debug: "Hata ay\u0131klama: belirte\u00e7 tablosu",
    hdr_history: "Rapor ge\u00e7mi\u015fi",
    hdr_sign_out: "\u00c7\u0131k\u0131\u015f yap",
    loading_analyzing: "Raporunuz analiz ediliyor",
    loading_sub: "Belirte\u00e7ler \u00e7\u0131kar\u0131l\u0131yor \u00b7 Sonu\u00e7lar yorumlan\u0131yor \u00b7 Rehberlik olu\u015fturuluyor",
    upload_title1: "Kan tahlilleriniz,",
    upload_title2: "yorumland\u0131.",
    upload_sub: "Lab raporunuzu y\u00fckleyin ve anl\u0131k g\u00f6rsel i\u00e7g\u00f6r\u00fcler ve ya\u015fam tarz\u0131 rehberli\u011fi al\u0131n.",
    upload_drop_label: "Lab raporunuzu buraya s\u00fcr\u00fckleyin",
    upload_drop_hint: "PDF \u00b7 JPG \u00b7 PNG desteklenir",
    upload_privacy: "Raporunuz g\u00fcvenli \u015fekilde i\u015flenir ve hesab\u0131n\u0131za kaydedilir.",
    btn_new_report: "+ Yeni Rapor",
    history_title: "Rapor Ge\u00e7mi\u015fi",
    history_saved: "{{n}} rapor kaydedildi",
    history_empty_text: "Hen\u00fcz rapor yok",
    history_empty_sub: "Ba\u015flamak i\u00e7in ilk lab raporunuzu y\u00fckleyin.",
    history_fallback_name: "Lab Raporu",
    stat_total: "Toplam",
    stat_normal: "Normal",
    stat_high: "Y\u00fcksek",
    stat_low: "D\u00fc\u015f\u00fck",
    note_ph: "Not ekle\u2026",
    delete_report_q: "Bu raporu sil?",
    btn_delete: "Sil",
    btn_cancel: "\u0130ptal",
    trends_title: "Belirte\u00e7 E\u011filimleri",
    trends_meta: "Raporlar aras\u0131nda de\u011fi\u015fimleri takip edin",
    trends_empty_text: "Hen\u00fcz yeterli veri yok",
    trends_empty_sub: "E\u011filimleri g\u00f6rmek i\u00e7in en az 2 rapor y\u00fckleyin",
    trends_no_shared_text: "Ortak belirte\u00e7 bulunamad\u0131",
    trends_no_shared_sub: "Hen\u00fcz 2 veya daha fazla raporda ortak belirte\u00e7 yok",
    trends_all_domains: "T\u00fcm Alanlar",
    trends_n_markers: "{{n}} belirte\u00e7",
    trends_all_normal: "Hepsi normal",
    trends_n_oor: "{{n}} aral\u0131k d\u0131\u015f\u0131",
    trends_latest: "Son",
    trends_min: "Min",
    trends_max: "Maks",
    trends_avg: "Ort",
    legend_normal: "Normal",
    legend_high: "Y\u00fcksek",
    legend_low: "D\u00fc\u015f\u00fck",
    legend_lab_range: "Lab aral\u0131\u011f\u0131",
    legend_optimal: "Optimal aral\u0131k",
    results_title: "Lab Sonu\u00e7lar\u0131na Genel Bak\u0131\u015f",
    results_n_markers: "{{n}} belirte\u00e7 analiz edildi",
    badge_cached: "\u00f6nbellekten",
    btn_history: "Ge\u00e7mi\u015f",
    tab_markers: "Belirte\u00e7ler",
    tab_insights: "\u0130\u00e7g\u00f6r\u00fcler",
    tab_lifestyle: "Ya\u015fam Tarz\u0131",
    s_label_markers: "Belirte\u00e7ler",
    section_oor: "{{n}} aral\u0131k d\u0131\u015f\u0131",
    insights_title: "Klinik Yorum",
    stale_notice: "Bu yorumu etkileyebilecek yeni bir rapor eklendi.",
    btn_refreshing: "Yenileniyor\u2026",
    btn_refresh: "\u21ba Yenile",
    no_interpretation: "Yorum mevcut de\u011fil",
    no_interpretation_sub: "Klinik \u00f6zet olu\u015fturmak i\u00e7in bu raporu tekrar y\u00fckleyin",
    lifestyle_title: "Ya\u015fam Tarz\u0131 ve Beslenme Rehberli\u011fi",
    lifestyle_intro: "Sonu\u00e7lar\u0131n\u0131za g\u00f6re ki\u015fiselleştirilmi\u015f \u00f6neriler:",
    no_lifestyle: "\u00d6neri mevcut de\u011fil",
    no_lifestyle_sub: "Ya\u015fam tarz\u0131 rehberli\u011fi olu\u015fturmak i\u00e7in bu raporu tekrar y\u00fckleyin",
    disclaimer: "Bu, yaln\u0131zca bilgilendirme ama\u00e7l\u0131 bir yapay zeka analizidir. T\u0131bbi cihaz de\u011fildir ve t\u0131bbi tavsiye niteli\u011fi ta\u015f\u0131maz. Yapay zeka yorumu hatalar i\u00e7erebilir \u2014 her zaman orijinal lab raporunuzla kar\u015f\u0131la\u015ft\u0131r\u0131n ve herhangi bir sa\u011fl\u0131k karar\u0131 vermeden \u00f6nce nitelikli bir sa\u011fl\u0131k uzman\u0131na dan\u0131\u015f\u0131n.",
    info_loading: "Y\u00fckleniyor\u2026",
    info_error: "\u21ba Bilgi y\u00fcklenemedi \u2014 tekrar denemek i\u00e7in dokunun",
    info_what: "Bu nedir?",
    info_implications: "Ne anlama geliyor?",
    range_lab: "Lab aral\u0131\u011f\u0131",
    range_optimal: "Optimal",
    pill_normal: "Normal",
    pill_high: "Y\u00fcksek",
    pill_low: "D\u00fc\u015f\u00fck",
    toast_saved: "\u2713 Ge\u00e7mi\u015fe kaydedildi",
    toast_error: "\u26a0 Senkronizasyon ba\u015far\u0131s\u0131z",
    footer: "VitaScan yaln\u0131zca bilgilendirme ama\u00e7l\u0131 yapay zeka analizi sa\u011flar. T\u0131bbi cihaz de\u011fildir ve t\u0131bbi tavsiye niteli\u011fi ta\u015f\u0131maz. Yapay zeka analizi hatalar i\u00e7erebilir \u2014 sonu\u00e7lar\u0131 her zaman orijinal lab raporunuzla do\u011frulay\u0131n ve herhangi bir sa\u011fl\u0131k karar\u0131 vermeden \u00f6nce nitelikli bir sa\u011fl\u0131k uzman\u0131na dan\u0131\u015f\u0131n.",
    onboarding_title: "VitaScan'a Ho\u015f Geldiniz",
    onboarding_text: "Sonu\u00e7lar\u0131n\u0131z\u0131 ki\u015fiselleştirebilmemiz ve sa\u011fl\u0131k profiliniz i\u00e7in \u00f6nemli belirte\u00e7leri vurgulayabilmemiz i\u00e7in kendiniz hakk\u0131nda biraz bilgi verin. Bunu istedi\u011finiz zaman g\u00fcncelleyebilirsiniz.",
    profile_edit_title: "Profili D\u00fczenle",
    profile_new_title: "Profiliniz",
    profile_meta: "Sonu\u00e7lar\u0131n\u0131z\u0131 ki\u015fiselleştirmemize yard\u0131mc\u0131 olun",
    lbl_full_name: "Ad Soyad",
    lbl_age: "Ya\u015f",
    lbl_bio_sex: "Biyolojik Cinsiyet",
    sex_male: "Erkek",
    sex_female: "Kad\u0131n",
    sex_other: "Di\u011fer",
    lbl_conditions: "Bilinen Rahats\u0131zl\u0131klar",
    lbl_unit_system: "Birim Sistemi",
    unit_us: "ABD Konvansiyonel",
    unit_si: "SI / Metrik",
    lbl_display_prefs: "G\u00f6r\u00fcnt\u00fcleme Tercihleri",
    optimal_toggle_label: "Optimal Aral\u0131klar\u0131 G\u00f6ster",
    optimal_toggle_desc: "Belirte\u00e7 \u00e7ubu\u011funda, standart lab referans aral\u0131klar\u0131ndan daha dar olan ve uzun \u00f6m\u00fcr ile koruyucu sa\u011fl\u0131k ara\u015ft\u0131rmalar\u0131na dayanan fonksiyonel t\u0131p hedef aral\u0131klar\u0131n\u0131 temsil eden bir amber b\u00f6lge g\u00f6r\u00fcnt\u00fcler. Bunlar tan\u0131sal e\u015fikler de\u011fildir ve konvansiyonel t\u0131p taraf\u0131ndan evrensel olarak kabul edilmemektedir. Doktorunuzla tart\u0131\u015fmak i\u00e7in bir ba\u015flang\u0131\u00e7 noktas\u0131 olarak kullan\u0131n.",
    ref_ranges_title: "Referans aral\u0131klar\u0131 nereden geliyor?",
    ref_ranges_body: " Her belirte\u00e7 \u00e7ubu\u011fundaki ye\u015fil bant do\u011frudan lab raporunuzdan \u00e7\u0131kar\u0131lm\u0131\u015ft\u0131r \u2014 her laboratuvar kendi ekipman\u0131na, reaktiflerine ve yerel pop\u00fclasyon verilerine g\u00f6re kendi referans aral\u0131klar\u0131n\u0131 belirler. Bu, aral\u0131klar\u0131n laboratuvarlar ve \u00fclkeler aras\u0131nda farkl\u0131l\u0131k g\u00f6sterebilece\u011fi anlam\u0131na gelir; bu normal ve beklenen bir durumdur. VitaScan bunlar\u0131 ge\u00e7ersiz k\u0131lmaz.",
    lbl_language: "Dil",
    btn_saving: "Kaydediliyor\u2026",
    btn_save_profile: "Profili Kaydet",
    danger_zone: "Tehlikeli B\u00f6lge",
    btn_delete_account: "Hesab\u0131 Sil",
    delete_confirm_text: "Bu i\u015flem t\u00fcm raporlar\u0131n\u0131z\u0131, profilinizi ve hesab\u0131n\u0131z\u0131 kal\u0131c\u0131 olarak siler. Geri al\u0131namaz.",
    btn_delete_all: "Evet, her \u015feyi sil",
    btn_deleting: "Siliniyor\u2026",
    debug_title: "Belirte\u00e7 Hata Ay\u0131klama Tablosu",
    debug_renormalizing: "Yeniden normalleştiriliyor\u2026",
    debug_renormalize: "T\u00fcm\u00fcn\u00fc Yeniden Normalleştir",
    debug_export_excel: "Excel'e Aktar",
    debug_back: "\u2190 Geri",
    cond_diabetes: "Diyabet",
    cond_hypertension: "Hipertansiyon",
    cond_high_cholesterol: "Y\u00fcksek Kolesterol",
    cond_thyroid: "Tiroid Bozuklu\u011fu",
    cond_anemia: "Anemi",
    cond_other: "Di\u011fer",
    score_excellent: "M\u00fckemmel",
    score_good: "\u0130yi",
    score_fair: "Orta",
    score_review: "\u0130ncelenmeli",
    score_sub_excellent: "Sonu\u00e7lar\u0131n\u0131z harika g\u00f6r\u00fcn\u00fcyor",
    score_sub_good: "\u00c7o\u011fu belirte\u00e7 sa\u011fl\u0131kl\u0131 aral\u0131kta",
    score_sub_fair: "Baz\u0131 belirte\u00e7ler dikkat gerektiriyor",
    score_sub_review: "Birka\u00e7 belirte\u00e7 dikkat gerektiriyor",
    section_attention: "Dikkat Gerektiriyor",
    section_allclear: "Normal",
    nav_home: "Ana Sayfa",
    nav_history: "Ge\u00e7mi\u015f",
    nav_trends: "E\u011filimler",
    nav_profile: "Profil",
    chat_title: "Yapay Zekaya Sor",
    chat_placeholder: "Sonuçlarınız hakkında sorun…",
    chat_empty: "Kan tahlil sonuçlarınız hakkında her şeyi sorabilirsiniz. Belirteçleriniz ve trendleriniz hakkında tam bağlamım var.",
    chat_starter_1: "Son sonuçlarımı özetle",
    chat_starter_2: "Neyi iyileştirmeye odaklanmalıyım?",
    chat_starter_3: "Aralık dışı belirteçlerimi açıkla",
    chat_error: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
  }
};

// Module-level language variable — set at the top of each App() render
var _lang = "en";

function t(key) {
  return (STRINGS[_lang] && STRINGS[_lang][key]) || STRINGS.en[key] || key;
}

// Parameterised translation: tp("history_saved", { n: 3, s: "s" })
function tp(key, vars) {
  var s = t(key);
  Object.keys(vars).forEach(function(k) { s = s.replace("{{" + k + "}}", vars[k]); });
  return s;
}

// Return the localised section label for a given English section label
function localizeSection(englishLabel) {
  if (_lang !== "tr") return englishLabel;
  var sec = MARKER_SECTIONS.find(function(s) { return s.label === englishLabel; });
  return (sec && sec.labelTr) || englishLabel;
}

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

var SECTION_LABELS = MARKER_SECTIONS.map(function(s) { return s.label; });

function getMarkerCategory(markerName, aiCategory) {
  var lower = markerName.toLowerCase();
  for (var i = 0; i < MARKER_SECTIONS.length; i++) {
    var section = MARKER_SECTIONS[i];
    if (section.keywords.some(function(kw) { return lower.includes(kw); })) {
      return section.label;
    }
  }
  // Fall back to AI-provided category if it matches a known section exactly
  if (aiCategory && SECTION_LABELS.indexOf(aiCategory) !== -1) return aiCategory;
  return null;
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
  { keywords: ["dihydrotestosterone", "dihidrotestosteron", "dht"],             canonical: "Dihydrotestosterone (DHT)" },
  { keywords: ["free testosterone", "testosterone, free", "testosterone free"], canonical: "Free Testosterone" },
  { keywords: ["bioavailable testosterone"],                                     canonical: "Bioavailable Testosterone" },
  { keywords: ["testosterone"],                                                  canonical: "Testosterone" },

  // ── Thyroid ──
  { keywords: ["free t4", "ft4", "thyroxine, free", "t4, free"],   canonical: "Free T4" },
  { keywords: ["free t3", "ft3", "triiodothyronine, free", "t3, free"], canonical: "Free T3" },
  { keywords: ["reverse t3", "t3 reverse", "rt3"],                  canonical: "Reverse T3" },
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
  { keywords: ["estimated average glucose", "eag"],                 canonical: "Estimated Average Glucose" },
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
  // SHBG must come before the generic "globulin" entry — "Sex Hormone Binding Globulin" contains "globulin"
  { keywords: ["shbg", "sex hormone binding globulin", "sex hormone binding"], canonical: "SHBG" },
  { keywords: ["globulin"],                                         canonical: "Globulin" },
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
  { keywords: ["lymphocyte", "lymphs", "# lymph", "lymph #", "lymph %", "% lymph"], canonical: "Lymphocytes" },
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
  "HbA1c":                 { preferred: "%",      alts: { "mmol/mol": { factor: 0.09148, offset: 2.152 } } },
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
  "Hemoglobin":            { preferred: "g/dL",   si: { unit: "g/L",    factor: 10     }, alts: { "g/l": 0.1, "mmol/l": 1.6113 } },
  "Hematocrit":            { preferred: "%",      alts: { "l/l": 100 } },
  "Albumin":               { preferred: "g/dL",   si: { unit: "g/L",    factor: 10     }, alts: { "g/l": 0.1 } },
  "Total Protein":         { preferred: "g/dL",   si: { unit: "g/L",    factor: 10     }, alts: { "g/l": 0.1 } },
  "Globulin":              { preferred: "g/dL",   si: { unit: "g/L",    factor: 10     }, alts: { "g/l": 0.1 } },
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
// Deduplicates: if the same canonical name appears multiple times (e.g. HbA1c as both %
// and mmol/mol), keeps the entry with the UNIT_NORMS preferred unit; first occurrence wins on ties.
function normalizeMarkers(markers) {
  var normalized = markers.map(function(m) {
    var canonical = normalizeMarkerName(m.name);
    var val  = convertToPreferred(m.value, m.unit, canonical);
    var low  = convertToPreferred(m.low,   m.unit, canonical);
    var high = convertToPreferred(m.high,  m.unit, canonical);
    return Object.assign({}, m, {
      name:      canonical,
      value:     val.value,
      unit:      val.unit,
      low:       low.value,
      high:      high.value,
      raw_value: m.value,
      raw_unit:  m.unit,
      raw_low:   m.low,
      raw_high:  m.high,
    });
  });

  // Deduplicate in order, preferring the entry whose unit matches UNIT_NORMS preferred
  var result = [];
  var indexByName = {};
  normalized.forEach(function(m) {
    if (indexByName[m.name] === undefined) {
      indexByName[m.name] = result.length;
      result.push(m);
    } else {
      var norm = UNIT_NORMS[m.name];
      if (norm) {
        var preferred = norm.preferred.toLowerCase();
        var existing = result[indexByName[m.name]];
        if ((m.unit || "").toLowerCase() === preferred &&
            (existing.unit || "").toLowerCase() !== preferred) {
          result[indexByName[m.name]] = m; // replace with the preferred-unit entry
        }
      }
      // else keep first occurrence
    }
  });
  return result;
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
    // Support affine transforms { factor, offset } for conversions like HbA1c mmol/mol → %
    var converted = typeof factor === "object"
      ? value * factor.factor + factor.offset
      : value * factor;
    return { value: parseFloat(converted.toFixed(2)), unit: norm.preferred };
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
  var norm = UNIT_NORMS[canonicalName];
  var preferredUnit = norm ? norm.preferred.toLowerCase() : null;
  // history is sorted newest-first; reverse for chronological order
  var sorted = history.slice().reverse();
  sorted.forEach(function(report) {
    var markers = report.markers || [];
    var match = markers.find(function(m) { return normalizeMarkerName(m.name) === canonicalName; });
    if (match) {
      var converted = convertToPreferred(match.value, match.unit, canonicalName);
      var convLow   = convertToPreferred(match.low,   match.unit, canonicalName);
      var convHigh  = convertToPreferred(match.high,  match.unit, canonicalName);
      // Skip points whose unit couldn't be normalized — plotting them alongside
      // converted values (e.g. nmol/L mixed with g/dL) would skew the graph.
      if (preferredUnit && converted.unit.toLowerCase() !== preferredUnit) return;
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
  var colorMap = { ok: "#10B981", high: "#EF4444", low: "#F97316" };
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

var PRIORITY_WEIGHTS = [
  // weight 3 — critical
  { keys: ["hba1c", "a1c", "glycated hemoglobin", "glycated haemoglobin"], w: 3 },
  { keys: ["glucose", "blood glucose", "fasting glucose", "plasma glucose"], w: 3 },
  { keys: ["ldl", "ldl-c", "ldl cholesterol"], w: 3 },
  { keys: ["tsh", "thyroid stimulating"], w: 3 },
  { keys: ["creatinine"], w: 3 },
  { keys: ["egfr", "glomerular filtration"], w: 3 },
  { keys: ["hemoglobin", "haemoglobin", "hgb"], w: 3, exclude: ["a1c", "glycated"] },
  { keys: ["wbc", "white blood cell", "white blood count", "leukocyte"], w: 3 },
  { keys: ["platelet"], w: 3 },
  { keys: ["alt", "alanine aminotransferase", "alanine transaminase"], w: 3 },
  { keys: ["ast", "aspartate aminotransferase", "aspartate transaminase"], w: 3 },
  { keys: ["apob", "apolipoprotein b"], w: 3 },
  { keys: ["lp(a)", "lipoprotein(a)", "lipoprotein a"], w: 3 },
  // weight 2 — high
  { keys: ["cholesterol"], w: 2 },
  { keys: ["triglyceride"], w: 2 },
  { keys: ["hdl", "hdl cholesterol"], w: 2 },
  { keys: ["crp", "c-reactive protein", "c reactive protein"], w: 2 },
  { keys: ["homocysteine"], w: 2 },
  { keys: ["ferritin"], w: 2 },
  { keys: ["vitamin d", "25-oh", "25(oh)"], w: 2 },
  { keys: ["vitamin b12", "b12", "cobalamin"], w: 2 },
  { keys: ["folate", "folic acid"], w: 2 },
  { keys: ["testosterone"], w: 2 },
  { keys: ["free t4", "thyroxine"], w: 2 },
  { keys: ["free t3", "triiodothyronine"], w: 2 },
  { keys: ["insulin"], w: 2 },
  { keys: ["uric acid"], w: 2 },
  { keys: ["sodium"], w: 2 },
  { keys: ["potassium"], w: 2 },
  { keys: ["magnesium"], w: 2 },
];

var ACTION_RULES = [
  { match: ["hba1c", "a1c", "glycated"], high: "Reduce refined carbs and sugar; discuss diabetes screening with your doctor.", low: null },
  { match: ["glucose", "blood sugar", "blood glucose"], high: "Reduce refined carbs; confirm fasting protocol and repeat the test.", low: "Eat regularly to prevent hypoglycemia; discuss with your doctor." },
  { match: ["ldl"], high: "Review saturated fat intake; discuss cardiovascular risk management with your doctor.", low: null },
  { match: ["hdl"], low: "Increase aerobic exercise and healthy fats (olive oil, nuts, fatty fish).", high: null },
  { match: ["triglyceride"], high: "Reduce sugar, refined carbs, and alcohol; increase omega-3 intake.", low: null },
  { match: ["tsh", "thyroid stimulating"], high: "Elevated TSH may indicate hypothyroidism; discuss thyroid evaluation with your doctor.", low: "Suppressed TSH may indicate hyperthyroidism; discuss with your doctor." },
  { match: ["free t4", "thyroxine"], low: "Low T4 may indicate hypothyroidism; discuss with your doctor.", high: "Elevated T4; discuss thyroid evaluation with your doctor." },
  { match: ["free t3", "triiodothyronine"], low: "Low T3; discuss thyroid function with your doctor.", high: null },
  { match: ["vitamin d", "25-oh"], low: "Consider Vitamin D3 supplementation; discuss optimal dose with your doctor.", high: "Vitamin D is high; reduce supplementation and consult your doctor." },
  { match: ["b12", "cobalamin"], low: "Increase B12-rich foods (meat, fish, dairy) or consider supplementation.", high: null },
  { match: ["ferritin"], low: "Increase iron-rich foods or discuss iron supplementation with your doctor.", high: "High ferritin may indicate iron overload or inflammation; consult your doctor." },
  { match: ["creatinine"], high: "Elevated creatinine suggests reduced kidney function; consult your doctor.", low: null },
  { match: ["egfr", "glomerular"], low: "Low eGFR indicates reduced kidney function; follow up with your doctor.", high: null },
  { match: ["alt", "alanine"], high: "Elevated liver enzyme; avoid alcohol, review medications, and consult your doctor.", low: null },
  { match: ["ast", "aspartate"], high: "Elevated liver enzyme; avoid alcohol, review medications, and consult your doctor.", low: null },
  { match: ["crp", "c-reactive"], high: "Elevated inflammation marker; work with your doctor to identify the underlying cause.", low: null },
  { match: ["uric acid"], high: "Reduce purine-rich foods (red meat, shellfish) and alcohol.", low: null },
  { match: ["hemoglobin", "haemoglobin", "hgb"], low: "Low hemoglobin may indicate anemia; check iron, B12, and folate levels.", high: null },
  { match: ["wbc", "white blood", "leukocyte"], high: "Elevated WBC may indicate infection or inflammation; consult your doctor.", low: "Low WBC may indicate immune suppression; consult your doctor." },
  { match: ["platelet"], low: "Low platelets; consult your doctor and avoid aspirin/NSAIDs.", high: "Elevated platelets; discuss follow-up with your doctor." },
  { match: ["testosterone"], low: "Low testosterone; discuss sleep, exercise, and weight with your doctor.", high: null },
  { match: ["homocysteine"], high: "Increase folate, B6, and B12-rich foods or discuss supplementation.", low: null },
  { match: ["cholesterol"], high: "Review diet and lifestyle; discuss cardiovascular risk assessment with your doctor.", low: null },
  { match: ["sodium"], high: "Reduce salt and processed food intake.", low: "Discuss fluid balance and diet with your doctor." },
  { match: ["potassium"], high: "Reduce high-potassium foods; consult your doctor.", low: "Increase leafy greens and legumes; consult your doctor." },
  { match: ["magnesium"], low: "Increase leafy greens, nuts, and seeds or consider supplementation.", high: null },
  { match: ["iron"], low: "Increase red meat, legumes, or discuss iron supplementation with your doctor.", high: "High iron; reduce iron-rich foods and discuss with your doctor." },
  { match: ["folate", "folic"], low: "Increase leafy greens and legumes or consider supplementation.", high: null },
  { match: ["apob", "apolipoprotein b"], high: "Elevated ApoB is a key cardiovascular risk marker; discuss with your doctor.", low: null },
];

function getMarkerClinicalWeight(name) {
  var n = (name || "").toLowerCase();
  for (var i = 0; i < PRIORITY_WEIGHTS.length; i++) {
    var rule = PRIORITY_WEIGHTS[i];
    var hasExclude = rule.exclude && rule.exclude.some(function(ex) { return n.includes(ex); });
    if (!hasExclude && rule.keys.some(function(k) { return n.includes(k); })) return rule.w;
  }
  return 1;
}

function getMarkerAction(name, status) {
  var n = (name || "").toLowerCase();
  for (var i = 0; i < ACTION_RULES.length; i++) {
    var rule = ACTION_RULES[i];
    if (rule.match.some(function(k) { return n.includes(k); })) {
      if (status === "high" && rule.high) return rule.high;
      if (status === "low"  && rule.low)  return rule.low;
    }
  }
  return status === "high"
    ? "This marker is above range. Discuss the cause and next steps with your doctor."
    : "This marker is below range. Discuss the cause and next steps with your doctor.";
}

function computePriorities(markers, history, unitSystem) {
  var oor = markers.filter(function(m) { return getStatus(m.value, m.low, m.high) !== "ok"; });
  if (!oor.length) return [];
  var scored = oor.map(function(m) {
    var status = getStatus(m.value, m.low, m.high);
    var score = getMarkerClinicalWeight(m.name);
    // Severity: how far out of range (capped at +1)
    var pct = 0;
    if (status === "high" && m.high > 0) pct = (m.value - m.high) / m.high;
    if (status === "low"  && m.low  > 0) pct = (m.low - m.value) / m.low;
    score += Math.min(pct * 2, 1);
    // Trend: worsening boosts score, improving reduces it
    var trendDir = 0;
    if (history && history.length >= 2) {
      var pts = getTrendData(history, normalizeMarkerName(m.name), unitSystem);
      if (pts.length >= 2) {
        var prev = pts[pts.length - 2], curr = pts[pts.length - 1];
        trendDir = (status === "high")
          ? (curr.value > prev.value ? 1 : -1)
          : (curr.value < prev.value ? 1 : -1);
      }
    }
    score += trendDir * 0.5;
    return { m: m, status: status, score: score, trendDir: trendDir };
  });
  scored.sort(function(a, b) { return b.score - a.score; });
  return scored.slice(0, 3).map(function(item) {
    return {
      name:    item.m.name,
      value:   item.m.value,
      unit:    item.m.unit,
      status:  item.status,
      trendDir: item.trendDir,
      action:  getMarkerAction(item.m.name, item.status),
    };
  });
}

var MARKER_PATTERNS = [
  // Iron
  { id: "iron_deficiency",   icon: "🩸", title: "Iron Deficiency Pattern",      desc: "Low Ferritin with elevated TIBC is a classic sign of iron-deficiency anemia. Consider iron supplementation after discussing with your doctor.",          needs: [{ keys: ["ferritin"], status: "low" }, { keys: ["tibc", "total iron binding"], status: "high" }] },
  { id: "iron_deficiency2",  icon: "🩸", title: "Possible Iron Deficiency",      desc: "Low Ferritin alongside low Hemoglobin suggests iron-deficiency anemia. Discuss iron testing and supplementation with your doctor.",                       needs: [{ keys: ["ferritin"], status: "low" }, { keys: ["hemoglobin", "haemoglobin", "hgb"], status: "low" }] },
  { id: "iron_overload",     icon: "⚠️", title: "Possible Iron Overload",        desc: "High Ferritin with elevated serum Iron may indicate hemochromatosis or chronic inflammation. Follow up with your doctor.",                                  needs: [{ keys: ["ferritin"], status: "high" }, { keys: ["serum iron", "iron, serum"], status: "high" }] },
  // Thyroid
  { id: "hypothyroid",       icon: "🦋", title: "Hypothyroidism Pattern",        desc: "Elevated TSH with low Free T4 is consistent with primary hypothyroidism. Discuss thyroid hormone replacement therapy with your doctor.",                    needs: [{ keys: ["tsh", "thyroid stimulating"], status: "high" }, { keys: ["free t4", "ft4", "thyroxine"], status: "low" }] },
  { id: "hyperthyroid",      icon: "🦋", title: "Hyperthyroidism Pattern",       desc: "Suppressed TSH with high Free T4 is consistent with hyperthyroidism. Discuss further thyroid evaluation with your doctor.",                                   needs: [{ keys: ["tsh", "thyroid stimulating"], status: "low" }, { keys: ["free t4", "ft4", "thyroxine"], status: "high" }] },
  { id: "subclin_hypo",      icon: "🦋", title: "Subclinical Hypothyroidism",    desc: "Elevated TSH with normal T4 may indicate subclinical hypothyroidism. Monitor closely and discuss with your doctor.",                                         needs: [{ keys: ["tsh", "thyroid stimulating"], status: "high" }, { keys: ["free t4", "ft4"], status: "ok" }] },
  // Metabolic / Diabetes
  { id: "diabetes_risk",     icon: "🍬", title: "Metabolic Risk Pattern",        desc: "Elevated Glucose together with high HbA1c strongly suggests impaired glucose regulation or diabetes. Discuss urgent follow-up with your doctor.",            needs: [{ keys: ["glucose", "blood glucose", "fasting glucose"], status: "high" }, { keys: ["hba1c", "a1c", "glycated"], status: "high" }] },
  { id: "insulin_resist",    icon: "🍬", title: "Possible Insulin Resistance",   desc: "High fasting Insulin with elevated Glucose is a common sign of insulin resistance. Focus on reducing refined carbs and increasing physical activity.",        needs: [{ keys: ["insulin", "fasting insulin"], status: "high" }, { keys: ["glucose", "blood glucose"], status: "high" }] },
  { id: "metabolic_syn",     icon: "🍬", title: "Metabolic Syndrome Markers",    desc: "Elevated Triglycerides with low HDL is a hallmark of metabolic syndrome. Lifestyle changes (diet, exercise) are the first-line intervention.",              needs: [{ keys: ["triglyceride"], status: "high" }, { keys: ["hdl", "hdl cholesterol"], status: "low" }] },
  // Cardiovascular
  { id: "cardio_risk",       icon: "❤️", title: "Elevated Cardiovascular Risk",  desc: "High LDL Cholesterol alongside elevated CRP suggests both lipid burden and active inflammation — a higher-risk combination. Discuss with your doctor.",      needs: [{ keys: ["ldl", "ldl cholesterol"], status: "high" }, { keys: ["crp", "c-reactive"], status: "high" }] },
  { id: "homocys_b12",       icon: "❤️", title: "Elevated Homocysteine + Low B12", desc: "High Homocysteine with low B12 is often B12 deficiency. B12 supplementation typically lowers homocysteine and reduces cardiovascular risk.",               needs: [{ keys: ["homocysteine"], status: "high" }, { keys: ["b12", "cobalamin", "vitamin b12"], status: "low" }] },
  { id: "homocys_folate",    icon: "❤️", title: "Elevated Homocysteine + Low Folate", desc: "High Homocysteine with low Folate is often folate deficiency. Increasing dietary folate or supplementation can reduce homocysteine levels.",             needs: [{ keys: ["homocysteine"], status: "high" }, { keys: ["folate", "folic acid"], status: "low" }] },
  // Liver
  { id: "liver_stress",      icon: "🫀", title: "Liver Stress Pattern",           desc: "Both ALT and AST are elevated, which points to liver stress or damage. Avoid alcohol, review all medications, and consult your doctor promptly.",            needs: [{ keys: ["alt", "alanine aminotransferase", "alanine transaminase"], status: "high" }, { keys: ["ast", "aspartate aminotransferase", "aspartate transaminase"], status: "high" }] },
  // Kidney
  { id: "kidney_pattern",    icon: "🫘", title: "Kidney Function Concern",        desc: "Elevated Creatinine with low eGFR together confirm reduced kidney function. Prioritise follow-up with your doctor.",                                          needs: [{ keys: ["creatinine"], status: "high" }, { keys: ["egfr", "glomerular filtration"], status: "low" }] },
  // Inflammation
  { id: "inflam_uric",       icon: "🔥", title: "Inflammation + High Uric Acid", desc: "Elevated CRP alongside high Uric Acid may indicate chronic inflammation or gout. Reduce purine-rich foods and discuss with your doctor.",                      needs: [{ keys: ["crp", "c-reactive"], status: "high" }, { keys: ["uric acid"], status: "high" }] },
  // Vitamin D
  { id: "vitd_pth",          icon: "☀️", title: "Possible Vitamin D Deficiency",  desc: "Low Vitamin D with elevated PTH (secondary hyperparathyroidism) is a classic deficiency pattern. Supplementation is usually the first-line treatment.",     needs: [{ keys: ["vitamin d", "25-oh", "25(oh)"], status: "low" }, { keys: ["pth", "parathyroid"], status: "high" }] },
  // Anemia patterns
  { id: "b12_anemia",        icon: "🩸", title: "Possible B12 Deficiency Anemia", desc: "Low B12 with elevated MCV (large red cells) is a classic macrocytic anemia pattern. B12 supplementation or injection may be needed.",                       needs: [{ keys: ["b12", "cobalamin", "vitamin b12"], status: "low" }, { keys: ["mcv", "mean cell volume", "mean corpuscular volume"], status: "high" }] },
  { id: "folate_anemia",     icon: "🩸", title: "Possible Folate Deficiency Anemia", desc: "Low Folate with high MCV suggests macrocytic anemia from folate deficiency. Increase leafy greens or consider supplementation.",                          needs: [{ keys: ["folate", "folic acid"], status: "low" }, { keys: ["mcv", "mean cell volume"], status: "high" }] },
  // Testosterone
  { id: "low_t_shbg",        icon: "⚡", title: "Low Free Testosterone Pattern",  desc: "Low Testosterone with elevated SHBG means more testosterone is bound and unavailable. Discuss with your doctor — lifestyle factors often help.",              needs: [{ keys: ["testosterone"], status: "low" }, { keys: ["shbg", "sex hormone binding"], status: "high" }] },
];

function detectPatterns(markers) {
  if (!markers || !markers.length) return [];
  // Build a quick lookup: canonical name fragment → status
  var statusMap = {};
  markers.forEach(function(m) {
    statusMap[m.name.toLowerCase()] = getStatus(m.value, m.low, m.high);
  });
  var hasStatus = function(keyArr, requiredStatus) {
    return markers.some(function(m) {
      var n = m.name.toLowerCase();
      var st = getStatus(m.value, m.low, m.high);
      return keyArr.some(function(k) { return n.includes(k); }) &&
             (requiredStatus === "ok" ? st === "ok" : st === requiredStatus);
    });
  };
  var found = [];
  MARKER_PATTERNS.forEach(function(pattern) {
    var matched = pattern.needs.every(function(req) {
      return hasStatus(req.keys, req.status);
    });
    if (matched) found.push(pattern);
  });
  return found;
}

// ── Life events ──
var EVENT_TYPES = [
  { id: "supplement", label: "Supplement", icon: "💊" },
  { id: "diet",       label: "Diet",       icon: "🥗" },
  { id: "illness",    label: "Illness",    icon: "🤒" },
  { id: "medication", label: "Medication", icon: "💉" },
  { id: "exercise",   label: "Exercise",   icon: "🏃" },
  { id: "other",      label: "Other",      icon: "📝" },
];

// Returns events that should be overlaid on a trend chart as ReferenceLine markers.
// Matches each event to the nearest trendData date within 90 days.
function getChartEventLines(events, trendData) {
  if (!events || !events.length || !trendData || !trendData.length) return [];
  var results = [];
  events.forEach(function(ev) {
    var evMs = new Date(ev.date).getTime();
    if (isNaN(evMs)) return;
    var best = null, bestDiff = Infinity;
    trendData.forEach(function(pt) {
      var ptMs = new Date(pt.rawDate || pt.date).getTime();
      if (isNaN(ptMs)) return;
      var diff = Math.abs(evMs - ptMs);
      if (diff < bestDiff) { bestDiff = diff; best = pt; }
    });
    if (!best || bestDiff > 90 * 24 * 60 * 60 * 1000) return;
    var typeObj = EVENT_TYPES.find(function(t) { return t.id === ev.type; }) || EVENT_TYPES[5];
    results.push({ date: best.date, label: ev.label, icon: typeObj.icon, id: ev.id });
  });
  return results;
}

// PhenoAge biological age algorithm (Levine et al., 2018, EBioMedicine)
// Input: normalized markers (canonical names, US preferred units)
// Returns { age, missing } — age is number, missing is [] if computable; or { missing } if not enough data
function computeBioAge(markers) {
  var albumin    = markers.find(function(m) { return m.name === "Albumin"; });
  var creatinine = markers.find(function(m) { return m.name === "Creatinine"; });
  var glucose    = markers.find(function(m) { return m.name === "Glucose"; });
  var crp        = markers.find(function(m) { return m.name === "hs-CRP"; }) ||
                   markers.find(function(m) { return m.name === "CRP"; });
  var mcv        = markers.find(function(m) { return m.name === "MCV"; });
  var rdw        = markers.find(function(m) { return m.name === "RDW"; });
  var alp        = markers.find(function(m) { return m.name === "ALP"; });
  var wbc        = markers.find(function(m) { return m.name === "WBC"; });

  // Lymphocyte %: prefer direct % reading (value 5–90), otherwise derive from absolute ÷ WBC.
  // Handle unit scale mismatch: some labs report WBC in K/µL but Lymph absolute in /µL (×1000),
  // which would give a derived % of ~32000% — detect and correct by dividing lymph value by 1000.
  var lymph = markers.find(function(m) { return m.name === "Lymphocytes" && m.value >= 5 && m.value <= 90; });
  if (!lymph && wbc && wbc.value > 0) {
    var lymphAbs = markers.find(function(m) { return m.name === "Lymphocytes"; });
    if (lymphAbs) {
      var lymphVal = lymphAbs.value;
      var derived  = (lymphVal / wbc.value) * 100;
      // If ratio is implausibly large, try rescaling lymph by /1000 (unit mismatch correction)
      if (derived > 90 && derived > 0) derived = (lymphVal / 1000 / wbc.value) * 100;
      if (derived >= 5 && derived <= 90) {
        lymph = { name: "Lymphocytes", value: parseFloat(derived.toFixed(2)), unit: "%" };
      }
    }
  }

  var needed  = { albumin: albumin, creatinine: creatinine, glucose: glucose, crp: crp,
                  mcv: mcv, rdw: rdw, alp: alp, wbc: wbc, lymphocytes: lymph };
  var nameMap = { albumin: "Albumin", creatinine: "Creatinine", glucose: "Glucose",
                  crp: "CRP / hs-CRP", mcv: "MCV", rdw: "RDW",
                  alp: "Alkaline Phosphatase (ALP)", wbc: "WBC", lymphocytes: "Lymphocytes %" };
  var missing = Object.keys(needed)
    .filter(function(k) { return !needed[k]; })
    .map(function(k) { return nameMap[k]; });

  if (missing.length > 0) return { missing: missing };

  // Convert to SI units required by PhenoAge formula
  var xb = -19.9067
    + albumin.value    * 10      * (-0.0095)   // g/dL → g/L
    + creatinine.value * 88.4    *   0.0336    // mg/dL → µmol/L
    + glucose.value    * 0.05551 *   0.1953    // mg/dL → mmol/L
    + Math.log(Math.max(crp.value, 0) + 1)    *   0.0954
    + lymph.value                * (-0.0120)
    + mcv.value                  *   0.0268
    + rdw.value                  *   0.3306
    + alp.value                  *   0.00188
    + wbc.value                  *   0.0554;

  var gamma     = 0.0076927;
  var mortScore = 1 - Math.exp(-Math.exp(xb) * (Math.exp(gamma * 120) - 1) / gamma);
  if (mortScore >= 1) mortScore = 0.9999;
  if (mortScore <= 0) return { missing: [] };

  var rawAge = 141.50225 + Math.log(-0.00553 * Math.log(1 - mortScore)) / 0.090165;
  return { age: Math.round(Math.max(1, Math.min(120, rawAge)) * 10) / 10, missing: [] };
}

// Assembles the best set of markers for bio age by filling gaps from nearby reports.
// Uses the most recent value for each missing marker within maxDays of the reference date.
// Returns { markers, crossReport, oldestDate, refDate }
function gatherBioAgeMarkers(primaryMarkers, history, referenceDate, maxDays) {
  var MAX_DAYS = maxDays || 180;
  var refDate  = referenceDate ? new Date(referenceDate) : new Date();
  var maxMs    = MAX_DAYS * 24 * 60 * 60 * 1000;

  var merged      = primaryMarkers.slice();
  var presentNames = {};
  primaryMarkers.forEach(function(m) { presentNames[m.name] = true; });

  var oldestDate = null;
  // history is newest-first — iterating naturally gives most recent values first
  if (history) {
    for (var i = 0; i < history.length; i++) {
      var report  = history[i];
      var rDate   = report.report_date ? new Date(report.report_date) : new Date(report.created_at);
      var diff    = Math.abs(refDate - rDate);
      if (diff < 1000 * 60) continue; // same report (< 1 min apart)
      if (diff > maxMs) continue;     // outside time window

      var normMarkers = normalizeMarkers(report.markers || []);
      var prevLen = merged.length;
      normMarkers.forEach(function(m) {
        if (!presentNames[m.name]) {
          presentNames[m.name] = true;
          merged.push(m);
        }
      });
      if (merged.length > prevLen && (!oldestDate || rDate < oldestDate)) oldestDate = rDate;
    }
  }

  return { markers: merged, crossReport: !!oldestDate, oldestDate: oldestDate, refDate: refDate, maxDays: MAX_DAYS };
}

// BioAgeCard: always shows one consistent biological age computed from the most recent
// available value for each of the 9 markers across all history (1-year window).
// Not tied to any specific report — the same number appears everywhere in the app.
function BioAgeCard({ history, chronologicalAge }) {
  if (!history || !history.length) return null;

  // Use all history newest-first; gatherBioAgeMarkers picks the most recent value per marker
  var gathered = gatherBioAgeMarkers([], history, new Date(), 365);
  var result   = computeBioAge(gathered.markers);

  // Timeline: only include reports that independently had all 9 markers (no cross-report mixing)
  var timeline = [];
  history.slice().reverse().forEach(function(report) {
    var norm = normalizeMarkers(report.markers || []);
    var r = computeBioAge(norm);
    if (r && r.age !== undefined) {
      var rawDate = report.report_date || report.created_at;
      var d = new Date(rawDate);
      var dateStr = isNaN(d.getTime())
        ? rawDate
        : d.toLocaleDateString("en", { month: "short", year: "2-digit" });
      timeline.push({ age: r.age, date: dateStr });
    }
  });

  if (!result) return null;

  // Not enough markers across all history — show what's still missing
  if (result.missing && result.missing.length > 0) {
    return (
      <div className="bio-age-card">
        <div className="bio-age-header">
          <span className="bio-age-icon">🧬</span>
          <span className="bio-age-title">Biological Age</span>
        </div>
        <div className="bio-age-needs">
          <div className="bio-age-needs-title">Need {result.missing.length} more marker{result.missing.length !== 1 ? "s" : ""} to calculate</div>
          <div className="bio-age-needs-markers">Ask your doctor to include: {result.missing.join(" · ")}</div>
        </div>
        <div className="bio-age-footer">PhenoAge (Levine et al., 2018) uses 9 standard blood markers to estimate biological age.</div>
      </div>
    );
  }

  var age   = result.age;
  var chAge = chronologicalAge ? Number(chronologicalAge) : null;
  var delta = chAge !== null ? Math.round((age - chAge) * 10) / 10 : null;
  var cls   = delta === null ? "ba-neutral" : delta < -2 ? "ba-younger" : delta > 2 ? "ba-older" : "ba-neutral";
  var deltaLabel = delta === null
    ? "Add your age in Profile to compare"
    : delta < -2 ? Math.abs(delta).toFixed(1) + " yrs younger than your age"
    : delta >  2 ? delta.toFixed(1) + " yrs older than your age"
    : "Consistent with your chronological age";

  var footerNote = "Based on most recent values across your reports · PhenoAge (Levine et al., 2018) · Always consult your doctor";

  return (
    <div className="bio-age-card">
      <div className="bio-age-header">
        <span className="bio-age-icon">🧬</span>
        <span className="bio-age-title">Biological Age</span>
      </div>
      <div className="bio-age-body">
        <div className={"bio-age-number " + cls}>{age.toFixed(1)}</div>
        <div className="bio-age-info">
          <div className="bio-age-label">years</div>
          <div className={"bio-age-delta " + cls}>{deltaLabel}</div>
        </div>
      </div>
      {timeline.length >= 2 && (
        <div className="bio-age-timeline">
          {timeline.map(function(pt, i) {
            var ptDelta = chAge ? pt.age - chAge : 0;
            var col = ptDelta < -2 ? "var(--ok)" : ptDelta > 2 ? "var(--danger)" : "var(--accent)";
            return (
              <div key={i} className="bio-age-tl-item">
                <div className="bio-age-tl-age" style={{ color: col }}>{pt.age.toFixed(0)}</div>
                <div className="bio-age-tl-bar" style={{ background: col }} />
                <div className="bio-age-tl-date">{pt.date}</div>
              </div>
            );
          })}
        </div>
      )}
      <div className="bio-age-footer">{footerNote}</div>
    </div>
  );
}

function buildChatContext(results, markers, history, profile, unitSystem) {
  var lines = [];
  if (profile) {
    var pParts = [];
    if (profile.age) pParts.push("age " + profile.age);
    if (profile.biological_sex) pParts.push(profile.biological_sex);
    if (profile.conditions && profile.conditions.length) pParts.push("known conditions: " + profile.conditions.join(", "));
    if (pParts.length) lines.push("Patient: " + pParts.join(", ") + ".");
  }
  if (results && markers && markers.length) {
    lines.push("\nLatest report (" + (results.reportDate || "recent") + ", " + markers.length + " markers):");
    markers.forEach(function(m) {
      var status = getStatus(m.value, m.low, m.high);
      var flag = status === "ok" ? "normal" : status === "high" ? "HIGH" : "LOW";
      lines.push("  " + m.name + ": " + m.value + " " + (m.unit || "") + " (ref " + m.low + "\u2013" + m.high + " " + (m.unit || "") + ") \u2014 " + flag);
    });
  }
  if (history && history.length >= 2) {
    var trendMarkers = getTrendMarkers(history);
    if (trendMarkers.length) {
      lines.push("\nTrend data across " + history.length + " reports:");
      trendMarkers.slice(0, 20).forEach(function(name) {
        var pts = getTrendData(history, name, unitSystem);
        if (pts.length >= 2) {
          var trend = pts.map(function(p) { return p.date + ": " + p.value + " " + (p.unit || ""); }).join(" \u2192 ");
          lines.push("  " + name + ": " + trend);
        }
      });
    }
  }
  return lines.join("\n");
}

function TrendSparkline({ points }) {
  var containerRef = useRef(null);
  var [w, setW] = useState(0);
  useEffect(function() {
    if (!containerRef.current) return;
    var ro = new ResizeObserver(function(entries) {
      if (entries[0]) setW(entries[0].contentRect.width);
    });
    ro.observe(containerRef.current);
    return function() { ro.disconnect(); };
  }, []);

  var H = 28;
  if (!points || points.length < 2) return <div ref={containerRef} style={{ width: "100%", height: H }} />;

  var vals  = points.map(function(p) { return p.value; });
  var lows  = points.map(function(p) { return p.low;  }).filter(function(v) { return v !== undefined && v !== null; });
  var highs = points.map(function(p) { return p.high; }).filter(function(v) { return v !== undefined && v !== null; });
  var allV  = vals.concat(lows).concat(highs);
  var minV  = Math.min.apply(null, allV);
  var maxV  = Math.max.apply(null, allV);
  var pad   = (maxV - minV) * 0.25 || 1;
  minV -= pad; maxV += pad;
  var range    = maxV - minV || 1;
  var toY      = function(v) { return H - ((v - minV) / range) * H; };
  var toX      = function(i) { return w <= 0 ? 0 : (points.length === 1 ? w / 2 : (i / (points.length - 1)) * w); };
  var coords   = points.map(function(p, i) { return toX(i) + "," + toY(p.value); }).join(" ");
  var refLow   = lows.length  ? lows[lows.length - 1]   : null;
  var refHigh  = highs.length ? highs[highs.length - 1] : null;
  var cMap     = { ok: "#10B981", high: "#EF4444", low: "#F97316" };
  var lineColor = cMap[points[points.length - 1].status] || cMap.ok;

  return (
    <div ref={containerRef} style={{ width: "100%", height: H }}>
      {w > 0 && (
        <svg width={w} height={H}>
          {refLow !== null && refHigh !== null && (
            <rect x="0" y={toY(refHigh)} width={w} height={Math.max(0, toY(refLow) - toY(refHigh))} fill="rgba(16,185,129,0.08)" />
          )}
          <polyline points={coords} fill="none" stroke={lineColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
          {points.map(function(p, i) {
            var fill = cMap[p.status] || cMap.ok;
            return <circle key={i} cx={toX(i)} cy={toY(p.value)} r={i === points.length - 1 ? 3.5 : 2.5} fill={fill} stroke="var(--bg)" strokeWidth="1.5" />;
          })}
        </svg>
      )}
    </div>
  );
}

function ProgressCard({ scoreHistory, scoreDelta }) {
  var cFor = function(pct) { return pct >= 80 ? "var(--ok)" : pct >= 60 ? "var(--accent)" : "var(--warn)"; };
  var fmtDate = function(str) {
    var d = new Date(str);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en", { month: "short" });
    return (str || "").split(/[\s,\-/]+/)[0] || str;
  };
  var last = scoreHistory[scoreHistory.length - 1];
  var improving = scoreDelta >= 0;
  return (
    <div className="trends-progress-card">
      <div className="trends-progress-label">Your Progress</div>
      <div className="trends-progress-timeline">
        <div className="trends-progress-line" />
        {scoreHistory.map(function(s, i) {
          var isLast = i === scoreHistory.length - 1;
          var col = cFor(s.pct);
          var dotSize = isLast ? 14 : 10;
          return (
            <div key={i} className="trends-progress-point">
              <div className="trends-progress-pct" style={{ color: isLast ? col : "var(--muted)", fontWeight: isLast ? 700 : 400 }}>{s.pct}%</div>
              <div className="trends-progress-dot" style={{ width: dotSize, height: dotSize, background: col }} />
              <div className="trends-progress-date">{fmtDate(s.date)}</div>
            </div>
          );
        })}
      </div>
      <div className="trends-progress-footer">
        <div className="trends-progress-delta" style={{ color: improving ? "var(--ok)" : "var(--danger)" }}>
          <div className="trends-progress-delta-arrow" style={{ background: improving ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)" }}>
            {improving ? "↑" : "↓"}
          </div>
          {improving ? "+" : ""}{scoreDelta} pts across {scoreHistory.length} reports
        </div>
        <div className="trends-progress-sub">{last.pct >= 80 ? "Good" : last.pct >= 60 ? "Fair" : "Needs attention"}</div>
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
          sections[section.id] = { id: section.id, label: section.label, emoji: section.emoji, color: section.color, markers: [] };
        }
        sections[section.id].markers.push(marker);
        matched = true;
        break;
      }
    }

    // AI section fallback for unmatched markers
    if (!matched && marker.category && SECTION_LABELS.indexOf(marker.category) !== -1) {
      var fallbackSection = MARKER_SECTIONS.find(function(s) { return s.label === marker.category; });
      if (fallbackSection) {
        if (!sections[fallbackSection.id]) {
          sections[fallbackSection.id] = { id: fallbackSection.id, label: fallbackSection.label, emoji: fallbackSection.emoji, color: fallbackSection.color, markers: [] };
        }
        sections[fallbackSection.id].markers.push(marker);
        matched = true;
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

function evictFromCache(hash) {
  if (!hash) return;
  try {
    var store = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    delete store[hash];
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch (e) { /* ignore */ }
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

  // 3. Proxy API
  var { data: { session } } = await supabase.auth.getSession();
  var token = session ? session.access_token : "";
  var response = await fetch((process.env.REACT_APP_API_BASE || "") + "/api/marker-info", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({ name: name })
  });

  if (!response.ok) throw new Error("Failed");
  var info = await response.json();
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

async function analyzeReport(base64Data, mediaType, profileText, historySummary) {
  var { data: { session } } = await supabase.auth.getSession();
  var token = session ? session.access_token : "";

  var response = await fetch((process.env.REACT_APP_API_BASE || "") + "/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({
      base64Data: base64Data,
      mediaType: mediaType,
      profileText: profileText || null,
      sectionLabels: SECTION_LABELS,
      historySummary: historySummary || null
    })
  });

  var data = await response.json();

  if (!response.ok) {
    var msg = data.error || ("API error " + response.status);
    throw new Error(msg);
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
  const [historyLoading,   setHistoryLoading]   = useState(false);
  const [events,         setEvents]         = useState([]);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventForm,      setEventForm]      = useState({ date: "", label: "", type: "supplement" });
  const [eventSaving,    setEventSaving]    = useState(false);
  const [deletingReportId,         setDeletingReportId]         = useState(null);
  const [refreshingInterpretation, setRefreshingInterpretation] = useState(false);
  const [editingNoteId,    setEditingNoteId]    = useState(null);
  const [editingNoteText,  setEditingNoteText]  = useState("");
  const [normalizing,    setNormalizing]    = useState(false);

  // ── Profile state ──
  const [profile,       setProfile]       = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSaving,  setProfileSaving]  = useState(false);
  const [profileError,   setProfileError]   = useState(null);
  const [deleteConfirm,  setDeleteConfirm]  = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [profileForm,   setProfileForm]   = useState({
    full_name: "", age: "", biological_sex: "", conditions: [],
  });

  // ── Trends state ──
  const [expandedTrendMarker, setExpandedTrendMarker] = useState(null);
  const [trendingWellExpanded, setTrendingWellExpanded] = useState(false);
  const [allClearExpanded, setAllClearExpanded] = useState(false);

  // ── Chat state ──
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(function() {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // ── Sync toast ──
  const [syncToast, setSyncToast] = useState(null); // null | "saved" | "error"
  function showSyncToast(type) {
    setSyncToast(type);
    setTimeout(function() { setSyncToast(null); }, 3000);
  }

  // ── Unit system preference (persisted to localStorage) ──
  const [unitSystem, setUnitSystem] = useState(function() {
    return localStorage.getItem("vitascan_unit_system") || "us";
  });

  function handleUnitSystemChange(val) {
    setUnitSystem(val);
    localStorage.setItem("vitascan_unit_system", val);
  }

  // ── Optimal ranges display preference ──
  const [showOptimalRanges, setShowOptimalRanges] = useState(function() {
    return localStorage.getItem("vitascan_optimal_ranges") !== "false";
  });
  function handleOptimalRangesChange(val) {
    setShowOptimalRanges(val);
    localStorage.setItem("vitascan_optimal_ranges", val ? "true" : "false");
  }

  async function handleChatSend(textOverride) {
    var text = (textOverride !== undefined ? textOverride : chatInput).trim();
    if (!text || chatLoading) return;
    setChatInput("");
    var userMsg = { role: "user", text: text };
    var newMessages = chatMessages.concat([userMsg]);
    setChatMessages(newMessages);
    setChatLoading(true);
    try {
      var session = await supabase.auth.getSession();
      var token = session.data.session ? session.data.session.access_token : null;
      var ctx = buildChatContext(results, markers, history, profile, unitSystem);
      var res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({ messages: newMessages, context: ctx }),
      });
      var data = await res.json();
      setChatMessages(newMessages.concat([{ role: "model", text: data.reply || t("chat_error") }]));
    } catch (e) {
      setChatMessages(newMessages.concat([{ role: "model", text: t("chat_error") }]));
    } finally {
      setChatLoading(false);
    }
  }

  // ── Language preference ──
  const [lang, setLang] = useState(function() {
    return localStorage.getItem("vitascan_language") || "en";
  });
  function handleLangChange(val) {
    setLang(val);
    localStorage.setItem("vitascan_language", val);
  }

  // ── Session bootstrap ──
  useEffect(function() {
    supabase.auth.getSession().then(function({ data: { session } }) {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    var { data: { subscription } } = supabase.auth.onAuthStateChange(function(_event, session) {
      var u = session?.user ?? null;
      setUser(u);
      Sentry.setUser(u ? { id: u.id, email: u.email } : null);
    });
    return function() { subscription.unsubscribe(); };
  }, []);

  // ── Deep link + foreground handler (Capacitor native only) ──
  useEffect(function() {
    if (!isNative) return;

    async function syncSession() {
      var { data: { session }, error } = await supabase.auth.getSession();
      console.log("[VitaScan] syncSession — session:", session?.user?.email ?? "none", "error:", error?.message ?? "none");
      if (session?.user) {
        setUser(session.user);
        setAuthLoading(false);
      }
    }

    // Called when app is opened via custom URL scheme (magic link / OAuth redirect).
    // Implicit flow: Supabase puts tokens in the URL hash fragment — no code exchange needed.
    var urlListenerPromise = CapApp.addListener("appUrlOpen", async function({ url }) {
      console.log("[VitaScan] appUrlOpen:", url);
      if (url.includes("login-callback")) {
        var hash = url.split("#")[1] || "";
        var params = new URLSearchParams(hash);
        var accessToken = params.get("access_token");
        var refreshToken = params.get("refresh_token");
        console.log("[VitaScan] accessToken:", accessToken ? "found" : "not found");
        if (accessToken) {
          var { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken || "" });
          console.log("[VitaScan] setSession error:", error?.message ?? "none");
        }
        await syncSession();
        Browser.close();
      }
    });

    // Backup: whenever app returns to foreground, re-check session.
    var stateListenerPromise = CapApp.addListener("appStateChange", async function({ isActive }) {
      console.log("[VitaScan] appStateChange isActive:", isActive);
      if (isActive) { await syncSession(); }
    });

    return function() {
      urlListenerPromise.then(function(l) { l.remove(); });
      stateListenerPromise.then(function(l) { l.remove(); });
    };
  }, []);

  // ── Load history + events when user signs in ──
  useEffect(function() {
    if (user) {
      loadHistory();
      loadEvents();
    } else {
      setHistory([]);
      setEvents([]);
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

  // ── Account deletion ──
  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      var { data: { session } } = await supabase.auth.getSession();
      var token = session ? session.access_token : "";
      var res = await fetch((process.env.REACT_APP_API_BASE || "") + "/api/delete-account", {
        method: "POST",
        headers: { "Authorization": "Bearer " + token }
      });
      if (!res.ok) {
        var body = await res.json();
        throw new Error(body.error || "Failed to delete account");
      }
      // Clear all local caches
      localStorage.removeItem("vitascan_cache");
      localStorage.removeItem("vitascan_marker_info");
      localStorage.removeItem("vitascan_unit_system");
      localStorage.removeItem("vitascan_optimal_ranges");
      localStorage.removeItem("vitascan_language");
      await supabase.auth.signOut();
      // Auth listener will reset stage to auth screen
    } catch (e) {
      Sentry.captureException(e);
      setProfileError(e.message || "Failed to delete account. Please try again.");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  // ── History loader ──
  async function loadHistory() {
    setHistoryLoading(true);
    try {
      var { data } = await supabase
        .from('reports')
        .select('id, created_at, file_hash, patient_name, lab_name, report_date, markers, lifestyle, interpretation, interpretation_stale, notes')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setHistory(data || []);
    } catch (e) {
      // fail silently — history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  }

  // ── Events CRUD ──
  async function loadEvents() {
    if (!user) return;
    try {
      var { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      setEvents(data || []);
    } catch (e) { /* fail silently */ }
  }

  async function saveEvent(e) {
    e.preventDefault();
    if (!eventForm.label.trim() || !eventForm.date) return;
    setEventSaving(true);
    try {
      await supabase.from('events').insert({
        user_id: user.id,
        date:    eventForm.date,
        label:   eventForm.label.trim(),
        type:    eventForm.type,
      });
      await loadEvents();
      setEventModalOpen(false);
      setEventForm({ date: "", label: "", type: "supplement" });
    } catch (e2) { /* fail silently */ }
    setEventSaving(false);
  }

  async function deleteEvent(id) {
    await supabase.from('events').delete().eq('id', id);
    setEvents(function(ev) { return ev.filter(function(x) { return x.id !== id; }); });
  }

  // ── Export debug table to Excel ──
  function exportDebugTable() {
    var cols = history.slice().sort(function(a, b) {
      var da = a.report_date ? new Date(a.report_date) : new Date(a.created_at);
      var db = b.report_date ? new Date(b.report_date) : new Date(b.created_at);
      return da - db;
    });
    var markerSet = {};
    cols.forEach(function(report) {
      (report.markers || []).forEach(function(m) { markerSet[normalizeMarkerName(m.name)] = true; });
    });
    var allMarkerNames = Object.keys(markerSet).sort();
    var sectionLabels = MARKER_SECTIONS.map(function(s) { return s.label; }).concat(["Other"]);
    var sectionMap = {};
    sectionLabels.forEach(function(label) { sectionMap[label] = []; });
    allMarkerNames.forEach(function(name) {
      var cat = getMarkerCategory(name) || "Other";
      if (!sectionMap[cat]) sectionMap[cat] = [];
      sectionMap[cat].push(name);
    });

    var colHeaders = cols.map(function(r) {
      var date = r.report_date || new Date(r.created_at).toLocaleDateString();
      var name = r.patient_name && r.patient_name !== "Unknown" ? " (" + r.patient_name + ")" : "";
      return date + name;
    });

    var rows = [["Marker"].concat(colHeaders)];
    sectionLabels.filter(function(label) { return sectionMap[label] && sectionMap[label].length > 0; }).forEach(function(label) {
      rows.push(["── " + label + " ──"].concat(cols.map(function() { return ""; })));
      sectionMap[label].forEach(function(name) {
        var row = [name];
        cols.forEach(function(r) {
          var m = (r.markers || []).find(function(x) { return normalizeMarkerName(x.name) === name; });
          row.push(m ? m.value + " " + m.unit : "");
        });
        rows.push(row);
      });
    });

    var ws = XLSX.utils.aoa_to_sheet(rows);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Markers");
    XLSX.writeFile(wb, "vitascan_markers.xlsx");
  }

  // ── Re-normalize all stored reports ──
  async function renormalizeAll() {
    setNormalizing(true);
    try {
      for (var i = 0; i < history.length; i++) {
        var report = history[i];
        var normalizedMarkers = normalizeMarkers(report.markers || []);
        var normalizedDate    = normalizeDate(report.report_date);
        await supabase
          .from('reports')
          .update({ markers: normalizedMarkers, report_date: normalizedDate })
          .eq('id', report.id);
      }
      await loadHistory();
    } catch (e) {
      Sentry.captureException(e);
    } finally {
      setNormalizing(false);
    }
  }

  // ── Auth handlers ──
  async function handleGoogleSignIn() {
    setAuthBusy(true);
    setAuthError(null);
    if (isNative) {
      var { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: NATIVE_REDIRECT, skipBrowserRedirect: true },
      });
      if (err) { setAuthError(err.message); setAuthBusy(false); return; }
      if (data?.url) { await Browser.open({ url: data.url, windowName: '_self' }); }
    } else {
      var { error: err2 } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
      if (err2) { setAuthError(err2.message); setAuthBusy(false); }
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault();
    if (!authEmail.trim()) return;
    setAuthBusy(true);
    setAuthError(null);
    var { error: err } = await supabase.auth.signInWithOtp({
      email: authEmail.trim(),
      options: { emailRedirectTo: isNative ? NATIVE_REDIRECT : window.location.origin },
    });
    setAuthBusy(false);
    if (err) { setAuthError(err.message); }
    else     { setAuthMode("magic_sent"); }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setStage("upload");
    setResults(null);
    setHistory([]);
    setEvents([]);
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
      // For logged-in users, only serve the cache if this report is still in history.
      // If it was deleted (or file_hash was never stored for old reports), bypass the
      // cache so the file is re-analyzed and re-saved to Supabase.
      var cacheValid = cached && (!user || history.some(function(r) { return r.file_hash === hash; }));
      if (cacheValid) {
        setResults(cached);
        setFromCache(true);
        setAllClearExpanded(false);
        setStage("results");
        return;
      }
      var profileText = getProfileText(profile);
      var historySummary = buildHistorySummary(history);
      var data = await analyzeReport(base64, mediaType, profileText, historySummary);
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
          lab_name: data.labName || null,
          report_date: data.reportDate,
          markers: data.markers,
          lifestyle: data.lifestyle,
          interpretation: data.interpretation,
        }, { onConflict: 'user_id,file_hash' }).then(function() {
          // Mark later reports stale if this report has an earlier date
          var newDate = new Date(data.reportDate || Date.now());
          var staleIds = history
            .filter(function(r) { return parseReportDate(r) > newDate; })
            .map(function(r) { return r.id; });
          if (staleIds.length > 0) {
            supabase.from('reports').update({ interpretation_stale: true }).in('id', staleIds);
          }
          loadHistory();
          showSyncToast("saved");
        }).catch(function() {
          showSyncToast("error");
        });
      }

      setResults(data);
      setFromCache(false);
      setAllClearExpanded(false);
      setStage("results");
    } catch (e) {
      Sentry.captureException(e);
      setError(e.message || "Could not analyze the report. Please try again.");
      setStage("upload");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, history]);

  const onDrop = useCallback(function(e) {
    e.preventDefault();
    setDragOver(false);
    var file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── History card click ──
  function handleHistoryItem(item) {
    setAllClearExpanded(false);
    setResults({
      reportId:            item.id,
      patientName:         item.patient_name,
      reportDate:          item.report_date,
      markers:             normalizeMarkers(item.markers || []),
      lifestyle:           item.lifestyle || [],
      interpretation:      item.interpretation || "",
      interpretationStale: item.interpretation_stale || false,
    });
    setFromCache(false);
    setStage("results");
  }

  // ── Interpretation refresh ──
  async function handleRefreshInterpretation() {
    if (!results || !results.reportId) return;
    setRefreshingInterpretation(true);
    try {
      var { data: { session } } = await supabase.auth.getSession();
      var token = session ? session.access_token : "";
      var otherReports = history.filter(function(r) { return r.id !== results.reportId; });
      var markersSummary = (results.markers || []).map(function(m) {
        var st = getStatus(m.value, m.low, m.high);
        return m.name + ": " + m.value + " " + (m.unit || "") + (st !== "ok" ? " [" + st + "]" : "");
      }).join(", ");
      var res = await fetch((process.env.REACT_APP_API_BASE || "") + "/api/interpretation", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
        body: JSON.stringify({
          reportId:       results.reportId,
          markersSummary: markersSummary,
          historySummary: buildHistorySummary(otherReports),
          profileText:    getProfileText(profile),
        })
      });
      if (!res.ok) throw new Error("Failed to refresh");
      var body = await res.json();
      setResults(function(r) { return Object.assign({}, r, { interpretation: body.interpretation, interpretationStale: false }); });
      setHistory(function(h) {
        return h.map(function(r) {
          return r.id === results.reportId
            ? Object.assign({}, r, { interpretation: body.interpretation, interpretation_stale: false })
            : r;
        });
      });
    } catch (e) {
      Sentry.captureException(e);
    } finally {
      setRefreshingInterpretation(false);
    }
  }

  // ── Report notes ──
  function startEditingNote(e, item) {
    e.stopPropagation();
    setEditingNoteId(item.id);
    setEditingNoteText(item.notes || "");
  }

  function saveNote(id) {
    var text = editingNoteText.trim();
    setEditingNoteId(null);
    setHistory(function(h) {
      return h.map(function(r) { return r.id === id ? Object.assign({}, r, { notes: text || null }) : r; });
    });
    supabase.from('reports').update({ notes: text || null }).eq('id', id);
  }

  // ── Report deletion ──
  async function handleDeleteReport(id) {
    var item = history.find(function(r) { return r.id === id; });
    await supabase.from('reports').delete().eq('id', id);
    evictFromCache(item && item.file_hash);
    setHistory(function(h) { return h.filter(function(r) { return r.id !== id; }); });
    setDeletingReportId(null);
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

  // Apply current language before any render
  _lang = lang;

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
            <div className="auth-tagline">{t("auth_tagline")}</div>

            {authMode === "magic_sent" ? (
              <>
                <div className="auth-success">
                  ✉️ {t("auth_check_inbox")}<br />
                  {t("auth_sent_to")} <strong>{authEmail}</strong>.<br />
                  {t("auth_click_link")}
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ marginTop: 20, width: "100%", justifyContent: "center" }}
                  onClick={function() { setAuthMode("login"); setAuthEmail(""); setAuthError(null); }}
                >
                  {t("auth_use_different")}
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
                  {t("auth_google")}
                </button>

                <div className="auth-divider">{t("auth_or")}</div>

                <form onSubmit={handleMagicLink}>
                  <input
                    className="auth-input"
                    type="email"
                    placeholder={t("auth_email_ph")}
                    value={authEmail}
                    onChange={function(e) { setAuthEmail(e.target.value); }}
                    required
                  />
                  <button className="btn-primary" type="submit" disabled={authBusy || !authEmail.trim()}>
                    {authBusy ? t("auth_sending") : t("auth_magic_link")}
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
            <div
              className="header-avatar"
              title={user.email}
              onClick={function() {
                setProfileForm({
                  full_name:      profile ? (profile.full_name      || "") : "",
                  age:            profile ? (profile.age            ? String(profile.age) : "") : "",
                  biological_sex: profile ? (profile.biological_sex || "") : "",
                  conditions:     profile ? (profile.conditions     || []) : [],
                });
                setProfileError(null);
                setStage("profile");
              }}
            >
              {avatarLetter}
            </div>
          </div>
        </header>

        <nav className="bottom-nav">
          {[
            { id: "upload",  icon: "🏠", label: t("nav_home")    },
            { id: "history", icon: "📋", label: t("nav_history") },
            { id: "trends",  icon: "📈", label: t("nav_trends")  },
            { id: "profile", icon: "👤", label: t("nav_profile") },
          ].map(function(tab) {
            var isActive = tab.id === stage || (tab.id === "upload" && (stage === "results" || stage === "loading"));
            return (
              <button
                key={tab.id}
                className={"bottom-nav-tab" + (isActive ? " active" : "")}
                onClick={function() {
                  if (tab.id === "upload") {
                    setStage("upload");
                    setResults(null);
                  } else if (tab.id === "profile") {
                    setProfileForm({
                      full_name:      profile ? (profile.full_name      || "") : "",
                      age:            profile ? (profile.age            ? String(profile.age) : "") : "",
                      biological_sex: profile ? (profile.biological_sex || "") : "",
                      conditions:     profile ? (profile.conditions     || []) : [],
                    });
                    setProfileError(null);
                    setStage("profile");
                  } else {
                    setStage(tab.id);
                  }
                }}
              >
                <span className="bottom-nav-icon">{tab.icon}</span>
                <span className="bottom-nav-label">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <main className="main">

          {stage === "profile" && (
            <div className="profile-screen">
              {!profile && (
                <div className="onboarding-card">
                  <div className="onboarding-icon">👋</div>
                  <div>
                    <div className="onboarding-title">{t("onboarding_title")}</div>
                    <div className="onboarding-text">{t("onboarding_text")}</div>
                  </div>
                </div>
              )}
              <div style={{ marginBottom: 32 }}>
                <div className="results-title">{profile ? t("profile_edit_title") : t("profile_new_title")}</div>
                <div className="results-meta">{t("profile_meta")}</div>
              </div>

              {history.length > 0 && <BioAgeCard history={history} chronologicalAge={profile && profile.age} />}

              <form onSubmit={saveProfile}>
                <div className="form-group">
                  <label className="form-label">{t("lbl_full_name")}</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Alex Johnson"
                    value={profileForm.full_name}
                    onChange={function(e) { setProfileForm(function(f) { return Object.assign({}, f, { full_name: e.target.value }); }); }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t("lbl_age")}</label>
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
                  <label className="form-label">{t("lbl_bio_sex")}</label>
                  <div className="radio-group">
                    {["Male", "Female", "Other"].map(function(opt) {
                      var sexKey = "sex_" + opt.toLowerCase();
                      return (
                        <label key={opt} className={"radio-option" + (profileForm.biological_sex === opt ? " selected" : "")}>
                          <input
                            type="radio"
                            name="biological_sex"
                            value={opt}
                            checked={profileForm.biological_sex === opt}
                            onChange={function() { setProfileForm(function(f) { return Object.assign({}, f, { biological_sex: opt }); }); }}
                          />
                          {t(sexKey)}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("lbl_conditions")}</label>
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
                          {t(CONDITION_KEYS[opt] || opt)}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("lbl_unit_system")}</label>
                  <div className="radio-group">
                    {[
                      { val: "us", label: t("unit_us"), desc: "mg/dL · ng/dL" },
                      { val: "si", label: t("unit_si"), desc: "mmol/L · nmol/L" },
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
                <div className="form-group">
                  <label className="form-label">{t("lbl_display_prefs")}</label>
                  <label className="toggle-row" style={{ marginBottom: 16 }}>
                    <div className="toggle-switch">
                      <input type="checkbox" checked={showOptimalRanges} onChange={function(e) { handleOptimalRangesChange(e.target.checked); }} />
                      <div className="toggle-slider" />
                    </div>
                    <div>
                      <div className="toggle-label">{t("optimal_toggle_label")}</div>
                      <div className="toggle-desc">{t("optimal_toggle_desc")}</div>
                    </div>
                  </label>
                  <div className="settings-info-box">
                    <strong>{t("ref_ranges_title")}</strong>{t("ref_ranges_body")}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t("lbl_language")}</label>
                  <div className="radio-group">
                    {[{ val: "en", label: "English" }, { val: "tr", label: "Türkçe" }].map(function(opt) {
                      return (
                        <label key={opt.val} className={"radio-option" + (lang === opt.val ? " selected" : "")}>
                          <input type="radio" name="language" value={opt.val}
                            checked={lang === opt.val}
                            onChange={function() { handleLangChange(opt.val); }}
                          />
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
                {profileError && <div className="profile-error">{profileError}</div>}
                <div className="profile-actions">
                  <button className="btn-primary" type="submit" disabled={profileSaving} style={{ width: "auto", padding: "12px 32px" }}>
                    {profileSaving ? t("btn_saving") : t("btn_save_profile")}
                  </button>
                  {profile !== null && (
                    <button type="button" className="btn btn-ghost" onClick={function() { setStage("upload"); }}>
                      {t("btn_cancel")}
                    </button>
                  )}
                </div>
              </form>

              <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
                <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={handleSignOut}>
                  {t("hdr_sign_out")}
                </button>
              </div>

              {profile !== null && (
                <div className="danger-zone">
                  <div className="danger-zone-label">{t("danger_zone")}</div>
                  {!deleteConfirm ? (
                    <button className="btn-delete" onClick={function() { setDeleteConfirm(true); }}>
                      {t("btn_delete_account")}
                    </button>
                  ) : (
                    <div>
                      <div className="delete-confirm-text">{t("delete_confirm_text")}</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                        <button className="btn-delete-confirm" onClick={handleDeleteAccount} disabled={deleting}>
                          {deleting ? t("btn_deleting") : t("btn_delete_all")}
                        </button>
                        <button className="btn btn-ghost" onClick={function() { setDeleteConfirm(false); }} disabled={deleting}>
                          {t("btn_cancel")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {stage === "upload" && (
            <div className="upload-section">
              <h1 className="upload-title">{t("upload_title1")}<br /><span>{t("upload_title2")}</span></h1>
              <p className="upload-sub">{t("upload_sub")}</p>
              <div
                className={"drop-zone" + (dragOver ? " drag-over" : "")}
                onDragOver={function(e) { e.preventDefault(); setDragOver(true); }}
                onDragLeave={function() { setDragOver(false); }}
                onDrop={onDrop}
                onClick={function() { document.getElementById("file-input").click(); }}
              >
                <div className="drop-icon">🧬</div>
                <div className="drop-label">{t("upload_drop_label")}</div>
                <div className="drop-hint">{t("upload_drop_hint")}</div>
                <input
                  id="file-input"
                  type="file"
                  className="file-input"
                  accept="image/*,application/pdf"
                  onChange={function(e) { handleFile(e.target.files[0]); }}
                />
              </div>
              {error && <p style={{ color: "var(--danger)", marginTop: 20, fontSize: 14 }}>{error}</p>}
              <p style={{ marginTop: 20, fontSize: 12, color: "var(--muted)" }}>{t("upload_privacy")}</p>
              {history.length > 0 && (function() {
                var recent = history.slice().sort(function(a, b) {
                  var da = a.report_date ? new Date(a.report_date) : new Date(a.created_at);
                  var db = b.report_date ? new Date(b.report_date) : new Date(b.created_at);
                  return db - da;
                }).slice(0, 5);
                return (
                  <div className="recent-strip">
                    <div className="recent-strip-title">Recent Reports</div>
                    {recent.map(function(item) {
                      var itemMarkers = item.markers || [];
                      var score = computeHealthScore(itemMarkers);
                      var dateLabel = item.report_date && item.report_date !== "Unknown"
                        ? item.report_date
                        : new Date(item.created_at).toLocaleDateString();
                      var pillCls = score ? "score-pill-" + score.cls.replace("score-", "") : "";
                      return (
                        <div key={item.id} className="recent-strip-item" onClick={function() { handleHistoryItem(item); }}>
                          <span className="recent-strip-icon">🧬</span>
                          <div className="recent-strip-info">
                            <div className="recent-strip-name">
                              {item.patient_name && item.patient_name !== "Unknown" ? item.patient_name : t("history_fallback_name")}
                            </div>
                            <div className="recent-strip-date">{dateLabel}</div>
                          </div>
                          {score && (
                            <span className={"report-score-pill " + pillCls}>{score.pct}%</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {stage === "loading" && (
            <div className="loading-state">
              <div className="pulse-ring" />
              <div className="loading-text">{t("loading_analyzing")}</div>
              <div className="loading-sub">{t("loading_sub")}</div>
            </div>
          )}

          {stage === "history" && (
            <div className="history-view">
              <div className="history-header">
                <div>
                  <div className="results-title">{t("history_title")}</div>
                  <div className="results-meta">{tp("history_saved", { n: history.length, s: history.length !== 1 ? "s" : "" })}</div>
                </div>
                <button className="btn btn-ghost" onClick={function() { setStage("upload"); }}>
                  {t("btn_new_report")}
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
                  <div className="history-empty-text">{t("history_empty_text")}</div>
                  <div className="history-empty-sub">{t("history_empty_sub")}</div>
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
                      <div className="history-list">
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
                          var isConfirming = deletingReportId === item.id;
                          return (
                            <div key={item.id} className="report-card" onClick={function() { if (!isConfirming) handleHistoryItem(item); }}>
                              <button className="report-card-delete" title="Delete report" onClick={function(e) { e.stopPropagation(); setDeletingReportId(item.id); }}>✕</button>
                              <div className="report-card-date-badge">📅 {dateLabel}</div>
                              {item.lab_name && <div className="report-card-lab">{item.lab_name}</div>}
                              <div className="report-card-name" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <span>{item.patient_name && item.patient_name !== "Unknown" ? item.patient_name : t("history_fallback_name")}</span>
                                {(function() {
                                  var sc = computeHealthScore(itemMarkers);
                                  if (!sc) return null;
                                  var pc = "score-pill-" + sc.cls.replace("score-", "");
                                  return <span className={"report-score-pill " + pc}>{sc.pct}%</span>;
                                })()}
                              </div>
                              <div className="report-card-stats">
                                <div className="report-stat s-total">
                                  <div className="report-stat-num">{itemCounts.total}</div>
                                  <div className="report-stat-label">{t("stat_total")}</div>
                                </div>
                                <div className="report-stat s-ok">
                                  <div className="report-stat-num">{itemCounts.ok}</div>
                                  <div className="report-stat-label">{t("stat_normal")}</div>
                                </div>
                                <div className="report-stat s-high">
                                  <div className="report-stat-num">{itemCounts.high}</div>
                                  <div className="report-stat-label">{t("stat_high")}</div>
                                </div>
                                <div className="report-stat s-low">
                                  <div className="report-stat-num">{itemCounts.low}</div>
                                  <div className="report-stat-label">{t("stat_low")}</div>
                                </div>
                              </div>
                              {itemCounts.total > 0 && (
                                <div className="report-ratio-bar">
                                  <div style={{ width: (itemCounts.ok   / itemCounts.total * 100) + "%", background: "var(--ok)"     }}></div>
                                  <div style={{ width: (itemCounts.high / itemCounts.total * 100) + "%", background: "var(--danger)" }}></div>
                                  <div style={{ width: (itemCounts.low  / itemCounts.total * 100) + "%", background: "var(--warn)"   }}></div>
                                </div>
                              )}
                              <div className="report-card-note" onClick={function(e) { e.stopPropagation(); }}>
                                {editingNoteId === item.id ? (
                                  <textarea
                                    className="report-card-note-input"
                                    rows={2}
                                    autoFocus
                                    value={editingNoteText}
                                    onChange={function(e) { setEditingNoteText(e.target.value); }}
                                    onBlur={function() { saveNote(item.id); }}
                                    onKeyDown={function(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNote(item.id); } }}
                                    placeholder={t("note_ph")}
                                  />
                                ) : item.notes ? (
                                  <div className="report-card-note-text" onClick={function(e) { startEditingNote(e, item); }}>{item.notes}</div>
                                ) : (
                                  <div className="report-card-note-empty" onClick={function(e) { startEditingNote(e, item); }}>{t("note_ph")}</div>
                                )}
                              </div>

                              {isConfirming && (
                                <div className="report-delete-confirm" onClick={function(e) { e.stopPropagation(); }}>
                                  <div className="report-delete-confirm-text">{t("delete_report_q")}</div>
                                  <div className="report-delete-confirm-btns">
                                    <button className="report-delete-yes" onClick={function() { handleDeleteReport(item.id); }}>{t("btn_delete")}</button>
                                    <button className="report-delete-no"  onClick={function() { setDeletingReportId(null); }}>{t("btn_cancel")}</button>
                                  </div>
                                </div>
                              )}
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
                  <div className="results-title">{t("debug_title")}</div>
                  <div className="results-meta">{tp("history_saved", { n: history.length, s: history.length !== 1 ? "s" : "" })} · all canonical values in stored unit</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-ghost" disabled={normalizing} onClick={renormalizeAll}>
                    {normalizing ? t("debug_renormalizing") : t("debug_renormalize")}
                  </button>
                  <button className="btn btn-ghost" disabled={history.length === 0} onClick={exportDebugTable}>{t("debug_export_excel")}</button>
                  <button className="btn btn-ghost" onClick={function() { setStage("history"); }}>{t("debug_back")}</button>
                </div>
              </div>
              {history.length === 0 ? (
                <div className="history-empty">
                  <div className="history-empty-icon">🧪</div>
                  <div className="history-empty-text">{t("history_empty_text")}</div>
                </div>
              ) : (function() {
                // Columns: reports sorted oldest → newest
                var cols = history.slice().sort(function(a, b) {
                  var da = a.report_date ? new Date(a.report_date) : new Date(a.created_at);
                  var db = b.report_date ? new Date(b.report_date) : new Date(b.created_at);
                  return da - db;
                });
                // Rows: all unique canonical marker names grouped by section
                var markerSet = {};
                cols.forEach(function(report) {
                  (report.markers || []).forEach(function(m) { markerSet[normalizeMarkerName(m.name)] = true; });
                });
                var allMarkerNames = Object.keys(markerSet).sort();
                // Group by section
                var sectionLabels = MARKER_SECTIONS.map(function(s) { return s.label; }).concat(["Other"]);
                var sectionMap = {};
                sectionLabels.forEach(function(label) { sectionMap[label] = []; });
                allMarkerNames.forEach(function(name) {
                  var cat = getMarkerCategory(name) || "Other";
                  if (!sectionMap[cat]) sectionMap[cat] = [];
                  sectionMap[cat].push(name);
                });
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
                        {sectionLabels.filter(function(label) { return sectionMap[label] && sectionMap[label].length > 0; }).map(function(label) {
                          return (
                            <React.Fragment key={label}>
                              <tr className="debug-section-row">
                                <td className="debug-section-header" colSpan={cols.length + 1}>{label}</td>
                              </tr>
                              {sectionMap[label].map(function(name) {
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
                            </React.Fragment>
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
                  <div className="results-title">{t("trends_title")}</div>
                  <div className="results-meta">{t("trends_meta")}</div>
                </div>
                <button className="btn btn-ghost" onClick={function() { setStage("upload"); }}>
                  {t("btn_new_report")}
                </button>
              </div>

              {history.length < 2 ? (
                <div className="trends-empty">
                  <div className="trends-empty-icon">📈</div>
                  <div className="trends-empty-text">{t("trends_empty_text")}</div>
                  <div className="trends-empty-sub">{t("trends_empty_sub")}</div>
                </div>
              ) : (function() {
                var trendMarkers = getTrendMarkers(history);
                if (trendMarkers.length === 0) {
                  return (
                    <div className="trends-empty">
                      <div className="trends-empty-icon">📊</div>
                      <div className="trends-empty-text">{t("trends_no_shared_text")}</div>
                      <div className="trends-empty-sub">{t("trends_no_shared_sub")}</div>
                    </div>
                  );
                }

                // Pre-compute data for every trending marker
                var markerData = {};
                trendMarkers.forEach(function(name) {
                  var pts = getTrendData(history, name, unitSystem);
                  var latest = pts[pts.length - 1] || {};
                  var delta = pts.length >= 2
                    ? parseFloat((pts[pts.length - 1].value - pts[pts.length - 2].value).toFixed(2))
                    : null;
                  markerData[name] = {
                    pts: pts,
                    sparkPts: pts.slice(-5),
                    latestStatus: latest.status || "ok",
                    latest: latest,
                    delta: delta,
                  };
                });

                // Health score for each report (chronological)
                var scoreHistory = history.slice().reverse().map(function(report) {
                  var rm = report.markers || [];
                  if (!rm.length) return null;
                  var inRange = rm.filter(function(m) { return getStatus(m.value, m.low, m.high) === "ok"; }).length;
                  var pct = Math.round((inRange / rm.length) * 100);
                  var dateStr = report.report_date && report.report_date !== "Unknown"
                    ? report.report_date
                    : new Date(report.created_at).toLocaleDateString();
                  return { pct: pct, date: dateStr };
                }).filter(Boolean);
                var scoreDelta = scoreHistory.length >= 2
                  ? scoreHistory[scoreHistory.length - 1].pct - scoreHistory[0].pct
                  : null;

                // Split markers
                var watchList    = trendMarkers.filter(function(n) { return markerData[n].latestStatus !== "ok"; });
                var trendingWell = trendMarkers.filter(function(n) { return markerData[n].latestStatus === "ok"; });

                // Render the inline accordion chart for an expanded marker
                var renderAccordion = function(name) {
                  var d = markerData[name];
                  if (!d || !d.pts.length) return null;
                  var trendData = d.pts;
                  var sp = trendData[trendData.length - 1] || {};
                  var yVals   = trendData.map(function(x) { return x.value; });
                  var allLow  = trendData.map(function(x) { return x.low; });
                  var allHigh = trendData.map(function(x) { return x.high; });
                  var optRange = showOptimalRanges ? getOptimalRange(name) : null;
                  var optLow   = optRange ? displayConvert(optRange.low,  name, unitSystem) : null;
                  var optHigh  = optRange ? displayConvert(optRange.high, name, unitSystem) : null;
                  var allY = yVals.concat(allLow).concat(allHigh);
                  if (optLow  !== null) allY.push(optLow);
                  if (optHigh !== null) allY.push(optHigh);
                  var yMin    = parseFloat((Math.min.apply(null, allY) * 0.85).toFixed(2));
                  var yMax    = parseFloat((Math.max.apply(null, allY) * 1.15).toFixed(2));
                  var refLow  = allLow[0]  !== undefined ? allLow[0]  : sp.low;
                  var refHigh = allHigh[0] !== undefined ? allHigh[0] : sp.high;
                  var minVal  = parseFloat(Math.min.apply(null, yVals).toFixed(2));
                  var maxVal  = parseFloat(Math.max.apply(null, yVals).toFixed(2));
                  var avgVal  = parseFloat((yVals.reduce(function(a, b) { return a + b; }, 0) / yVals.length).toFixed(2));
                  var many    = trendData.length >= 5;
                  var tickFmt = function(v) { var n = parseFloat(v); return isNaN(n) ? v : (n % 1 === 0 ? n : parseFloat(n.toFixed(2))); };
                  return (
                    <div className="trend-accordion">
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: many ? 28 : 4 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted)", fontFamily: "Inter" }} angle={many ? -35 : 0} textAnchor={many ? "end" : "middle"} interval={0} />
                          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: "var(--muted)", fontFamily: "Inter" }} tickFormatter={tickFmt} width={46} />
                          <Tooltip content={<TrendTooltip />} />
                          {refLow !== undefined && refHigh !== undefined && (
                            <ReferenceArea y1={refLow} y2={refHigh} fill="rgba(16,185,129,0.10)" strokeOpacity={0} />
                          )}
                          {optLow !== null && optHigh !== null && (
                            <ReferenceArea y1={optLow} y2={optHigh} fill="rgba(14,165,233,0.15)" strokeOpacity={0} />
                          )}
                          {getChartEventLines(events, trendData).map(function(ev) {
                            return (
                              <ReferenceLine key={ev.id} x={ev.date} stroke="rgba(249,115,22,0.55)" strokeDasharray="4 3"
                                label={{ value: ev.icon, position: "insideTopRight", fontSize: 13, offset: 4 }} />
                            );
                          })}
                          <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={<TrendDot />} activeDot={{ r: 6 }} animationDuration={500} animationEasing="ease-out" />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="trend-stats">
                        <div className={"trend-stat s-" + (sp.status || "ok")}>
                          <div className="trend-stat-label">{t("trends_latest")}</div>
                          <div className="trend-stat-value">{sp.value}<span className="trend-stat-unit">{sp.unit || ""}</span></div>
                        </div>
                        <div className="trend-stat s-neutral">
                          <div className="trend-stat-label">{t("trends_min")}</div>
                          <div className="trend-stat-value">{minVal}<span className="trend-stat-unit">{sp.unit || ""}</span></div>
                        </div>
                        <div className="trend-stat s-neutral">
                          <div className="trend-stat-label">{t("trends_max")}</div>
                          <div className="trend-stat-value">{maxVal}<span className="trend-stat-unit">{sp.unit || ""}</span></div>
                        </div>
                        <div className="trend-stat s-neutral">
                          <div className="trend-stat-label">{t("trends_avg")}</div>
                          <div className="trend-stat-value">{avgVal}<span className="trend-stat-unit">{sp.unit || ""}</span></div>
                        </div>
                      </div>
                      <div className="trend-legend">
                        <div className="trend-legend-item"><svg width="10" height="10"><circle cx="5" cy="5" r="5" fill="#10B981" /></svg>{t("legend_normal")}</div>
                        <div className="trend-legend-item"><svg width="10" height="10"><circle cx="5" cy="5" r="5" fill="#EF4444" /></svg>{t("legend_high")}</div>
                        <div className="trend-legend-item"><svg width="10" height="10"><circle cx="5" cy="5" r="5" fill="#F97316" /></svg>{t("legend_low")}</div>
                        <div className="trend-legend-item"><div style={{ width: 16, height: 10, background: "rgba(16,185,129,0.15)", borderRadius: 2 }} />{t("legend_lab_range")}</div>
                        {optLow !== null && (
                          <div className="trend-legend-item"><div style={{ width: 16, height: 10, background: "rgba(14,165,233,0.2)", border: "1px solid rgba(14,165,233,0.5)", borderRadius: 2 }} />{t("legend_optimal")}</div>
                        )}
                      </div>
                    </div>
                  );
                };

                // Render a single marker row
                var renderRow = function(name, isLast) {
                  var d = markerData[name];
                  var isExpanded = expandedTrendMarker === name;
                  var st = d.latestStatus;
                  var dotColor = st === "ok" ? "var(--ok)" : st === "high" ? "var(--danger)" : "var(--warn)";
                  var arrow = d.delta === null ? "→" : d.delta > 0 ? "↑" : d.delta < 0 ? "↓" : "→";
                  var arrowColor = st === "ok" ? "var(--ok)" : st === "high"
                    ? (d.delta !== null && d.delta < 0 ? "var(--ok)" : "var(--danger)")
                    : (d.delta !== null && d.delta > 0 ? "var(--ok)" : "var(--warn)");
                  var deltaClass = st === "ok" ? "trend-delta-neu"
                    : st === "high" ? (d.delta !== null && d.delta < 0 ? "trend-delta-ok" : "trend-delta-bad")
                    : (d.delta !== null && d.delta > 0 ? "trend-delta-ok" : "trend-delta-bad");
                  var deltaSign = d.delta !== null && d.delta > 0 ? "+" : "";
                  return (
                    <div
                      key={name}
                      className={"trend-marker-row" + (isExpanded ? " tmr-expanded" : "") + (isLast ? " tmr-last" : "")}
                      onClick={function() { setExpandedTrendMarker(isExpanded ? null : name); }}
                    >
                      <div className="trend-marker-top">
                        <div className="trend-marker-dot" style={{ background: dotColor }} />
                        <div className="trend-marker-name">{name}</div>
                        {d.delta !== null && (
                          <span className={"trend-delta " + deltaClass}>{deltaSign}{d.delta} {d.latest.unit || ""}</span>
                        )}
                        <div className="trend-marker-value">
                          {d.latest.value}<span className="trend-marker-unit"> {d.latest.unit || ""}</span>
                        </div>
                        <div className="trend-marker-arrow" style={{ color: arrowColor }}>{arrow}</div>
                      </div>
                      <div className="trend-sparkline-wrap">
                        <TrendSparkline points={d.sparkPts} />
                      </div>
                      {isExpanded && renderAccordion(name)}
                    </div>
                  );
                };

                return (
                  <>
                    {/* Progress card */}
                    {scoreHistory.length >= 2 && scoreDelta !== null && (
                      <ProgressCard scoreHistory={scoreHistory} scoreDelta={scoreDelta} />
                    )}

                    {/* Life Events */}
                    <div className="events-section">
                      <div className="events-section-header">
                        <span className="events-section-title">📅 Life Events</span>
                        <button className="events-add-btn" onClick={function() {
                          setEventForm({ date: new Date().toISOString().slice(0, 10), label: "", type: "supplement" });
                          setEventModalOpen(true);
                        }}>+ Add</button>
                      </div>
                      {events.length === 0 ? (
                        <div className="events-empty">Pin supplements, diet changes, illnesses, or other events to see how they affect your markers over time.</div>
                      ) : (
                        <div className="events-list">
                          {events.map(function(ev) {
                            var typeObj = EVENT_TYPES.find(function(t) { return t.id === ev.type; }) || EVENT_TYPES[5];
                            return (
                              <div key={ev.id} className="event-item">
                                <span className="event-icon">{typeObj.icon}</span>
                                <div className="event-body">
                                  <div className="event-label">{ev.label}</div>
                                  <div className="event-date">{ev.date}</div>
                                </div>
                                <button className="event-delete" onClick={function() { deleteEvent(ev.id); }}>×</button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Watch List */}
                    {watchList.length > 0 && (
                      <>
                        <div className="trends-section-header">
                          <div className="trends-section-title danger">
                            Watch List <span className="trends-section-badge">{watchList.length}</span>
                          </div>
                        </div>
                        <div className="trend-marker-list">
                          {watchList.map(function(name, i) { return renderRow(name, i === watchList.length - 1); })}
                        </div>
                      </>
                    )}

                    {/* Trending Well */}
                    {trendingWell.length > 0 && (
                      <>
                        <div className="trends-section-header">
                          <div className="trends-section-title ok">
                            Trending Well <span className="trends-section-badge">{trendingWell.length}</span>
                          </div>
                          <button className="trends-section-toggle" onClick={function(e) { e.stopPropagation(); setTrendingWellExpanded(function(v) { return !v; }); }}>
                            {trendingWellExpanded ? "Collapse ▲" : "Show all ▾"}
                          </button>
                        </div>
                        {trendingWellExpanded && (
                          <div className="trend-marker-list">
                            {trendingWell.map(function(name, i) { return renderRow(name, i === trendingWell.length - 1); })}
                          </div>
                        )}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {stage === "results" && results && (
            <>
              <div className="results-header">
                <div>
                  <div className="results-title">{t("results_title")}</div>
                  <div className="results-meta">
                    {results.patientName && results.patientName !== "Unknown" ? results.patientName + " · " : ""}
                    {results.reportDate  && results.reportDate  !== "Unknown" ? results.reportDate  + " · " : ""}
                    {tp("results_n_markers", { n: counts.total })}
                    {fromCache && <span className="cached-badge">{t("badge_cached")}</span>}
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={function() { setStage("upload"); setResults(null); }}>
                  {t("btn_new_report")}
                </button>
              </div>

              <HealthScoreCard markers={markers} />

              <BioAgeCard history={history} chronologicalAge={profile && profile.age} />

              {(function() {
                var priorities = computePriorities(markers, history, unitSystem);
                if (!priorities.length) return null;
                var statusColor = function(s) { return s === "high" ? "var(--danger)" : "var(--warn)"; };
                var trendArrow  = function(d) { return d === 1 ? " ↑" : d === -1 ? " ↓" : ""; };
                return (
                  <div className="priorities-card">
                    <div className="priorities-card-header">
                      <span className="priorities-card-icon">🎯</span>
                      <span className="priorities-card-title">Focus This Quarter</span>
                    </div>
                    {priorities.map(function(p, i) {
                      return (
                        <div key={i} className="priority-item">
                          <div className="priority-rank">{i + 1}</div>
                          <div className="priority-body">
                            <div className="priority-top">
                              <span className="priority-name">{p.name}</span>
                              <span className="priority-value" style={{ color: statusColor(p.status) }}>
                                {p.value} {p.unit}{trendArrow(p.trendDir)}
                              </span>
                            </div>
                            <div className="priority-action">{p.action}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {(function() {
                var oorMarkers = markers.filter(function(m) { return getStatus(m.value, m.low, m.high) !== "ok"; });
                var okMarkers  = markers.filter(function(m) { return getStatus(m.value, m.low, m.high) === "ok";  });
                return (
                  <>
                    {oorMarkers.length > 0 && (
                      <>
                        <div className="attention-header">
                          <span className="attention-header-label">{t("section_attention")}</span>
                        </div>
                        {(function() {
                          var patterns = detectPatterns(markers);
                          if (!patterns.length) return null;
                          return (
                            <div className="patterns-list">
                              {patterns.map(function(p) {
                                return (
                                  <div key={p.id} className="pattern-banner">
                                    <div className="pattern-banner-icon">{p.icon}</div>
                                    <div className="pattern-banner-body">
                                      <div className="pattern-banner-title">{p.title}</div>
                                      <div className="pattern-banner-desc">{p.desc}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                        {categorizeMarkers(oorMarkers).map(function(section) {
                          var abnormal = section.markers.filter(function(m) { return getStatus(m.value, m.low, m.high) !== "ok"; }).length;
                          return (
                            <div key={section.id} className="health-section">
                              <div className="health-section-header" style={{ borderBottomColor: section.color || "var(--border)" }}>
                                <span className="health-section-emoji" style={{ background: section.color ? section.color + "18" : "transparent", borderRadius: 8, padding: "4px 6px" }}>{section.emoji}</span>
                                <span className="health-section-label" style={{ color: section.color || "var(--text)" }}>{localizeSection(section.label)}</span>
                                {abnormal > 0 && <span className="health-section-alert">{tp("section_oor", { n: abnormal })}</span>}
                              </div>
                              <div className="markers-grid">
                                {section.markers.map(function(m, i) { return <MarkerCard key={i} marker={m} unitSystem={unitSystem} showOptimalRanges={showOptimalRanges} />; })}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    <div className="insights-panel">
                      <h3><div className="insight-icon blue">🔬</div>{t("insights_title")}</h3>
                      {results.interpretationStale && (
                        <div className="stale-notice">
                          <div className="stale-notice-text">{t("stale_notice")}</div>
                          <button className="btn-refresh" onClick={handleRefreshInterpretation} disabled={refreshingInterpretation}>
                            {refreshingInterpretation ? t("btn_refreshing") : t("btn_refresh")}
                          </button>
                        </div>
                      )}
                      {results.interpretation && results.interpretation.trim() ? (
                        results.interpretation.split("\n").filter(Boolean).map(function(p, i) {
                          return <p key={i} className="insight-text" style={{ marginBottom: 14 }}>{p}</p>;
                        })
                      ) : (
                        <div className="tab-empty">
                          <div className="tab-empty-icon">🔬</div>
                          <div className="tab-empty-text">{t("no_interpretation")}</div>
                          <div className="tab-empty-sub">{t("no_interpretation_sub")}</div>
                        </div>
                      )}
                    </div>

                    <div className="insights-panel">
                      <h3><div className="insight-icon teal">🌿</div>{t("lifestyle_title")}</h3>
                      {lifestyle.length > 0 ? (
                        <>
                          <p className="insight-text" style={{ marginBottom: 16 }}>{t("lifestyle_intro")}</p>
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
                        </>
                      ) : (
                        <div className="tab-empty">
                          <div className="tab-empty-icon">🌿</div>
                          <div className="tab-empty-text">{t("no_lifestyle")}</div>
                          <div className="tab-empty-sub">{t("no_lifestyle_sub")}</div>
                        </div>
                      )}
                    </div>

                    {okMarkers.length > 0 && (
                      <>
                        <div
                          className="allclear-toggle"
                          onClick={function() { setAllClearExpanded(function(v) { return !v; }); }}
                        >
                          <span className="allclear-toggle-icon">✅</span>
                          <span className="allclear-toggle-label">{t("section_allclear")}</span>
                          <span className="allclear-count-pill">{okMarkers.length}</span>
                          <span className={"allclear-chevron" + (allClearExpanded ? " open" : "")}>▼</span>
                        </div>
                        {allClearExpanded && categorizeMarkers(okMarkers).map(function(section) {
                          return (
                            <div key={section.id} className="health-section">
                              <div className="health-section-header" style={{ borderBottomColor: section.color || "var(--border)" }}>
                                <span className="health-section-emoji" style={{ background: section.color ? section.color + "18" : "transparent", borderRadius: 8, padding: "4px 6px" }}>{section.emoji}</span>
                                <span className="health-section-label" style={{ color: section.color || "var(--text)" }}>{localizeSection(section.label)}</span>
                              </div>
                              <div className="markers-grid">
                                {section.markers.map(function(m, i) { return <MarkerCard key={i} marker={m} unitSystem={unitSystem} showOptimalRanges={showOptimalRanges} />; })}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    <div className="disclaimer">
                      <span className="disclaimer-icon">⚠</span>
                      <span>{t("disclaimer")}</span>
                    </div>
                  </>
                );
              })()}
            </>
          )}

        </main>
      </div>
      {/* Event modal */}
      {eventModalOpen && (
        <div className="event-modal-overlay" onClick={function(e) { if (e.target === e.currentTarget) setEventModalOpen(false); }}>
          <div className="event-modal">
            <div className="event-modal-title">Log a Life Event</div>
            <form onSubmit={saveEvent}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={eventForm.date}
                  onChange={function(e) { setEventForm(function(f) { return Object.assign({}, f, { date: e.target.value }); }); }}
                  style={{ maxWidth: 200 }} required />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <div className="event-type-row">
                  {EVENT_TYPES.map(function(type) {
                    return (
                      <button key={type.id} type="button"
                        className={"event-type-pill" + (eventForm.type === type.id ? " selected" : "")}
                        onClick={function() { setEventForm(function(f) { return Object.assign({}, f, { type: type.id }); }); }}>
                        {type.icon} {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" type="text" placeholder='e.g. "Started Vitamin D 5000 IU"'
                  value={eventForm.label}
                  onChange={function(e) { setEventForm(function(f) { return Object.assign({}, f, { label: e.target.value }); }); }}
                  required />
              </div>
              <div className="event-modal-actions">
                <button className="btn-primary" type="submit" disabled={eventSaving} style={{ padding: "12px 28px" }}>
                  {eventSaving ? "Saving…" : "Save Event"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={function() { setEventModalOpen(false); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat FAB */}
      <button className="chat-fab" onClick={function() { setChatOpen(true); }} title={t("chat_title")}>
        💬
      </button>

      {/* Chat overlay */}
      {chatOpen && (
        <div className="chat-overlay">
          <div className="chat-overlay-header">
            <div className="chat-overlay-title">✨ {t("chat_title")}</div>
            <button className="chat-overlay-close" onClick={function() { setChatOpen(false); }}>✕</button>
          </div>

          {chatMessages.length === 0 ? (
            <>
              <div className="chat-empty-state">
                <div className="chat-empty-icon">🔬</div>
                <div className="chat-empty-text">{t("chat_empty")}</div>
              </div>
              <div className="chat-starters">
                {[t("chat_starter_1"), t("chat_starter_2"), t("chat_starter_3")].map(function(s) {
                  return (
                    <button key={s} className="chat-starter" onClick={function() { handleChatSend(s); }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="chat-messages" ref={chatScrollRef}>
              {chatMessages.map(function(msg, i) {
                return (
                  <div key={i} className={"chat-msg chat-msg-" + msg.role}>
                    <div className="chat-bubble">{msg.text}</div>
                  </div>
                );
              })}
              {chatLoading && <div className="chat-typing">···</div>}
              <div style={{ height: 16 }} />
            </div>
          )}

          <div className="chat-input-row">
            <input
              className="chat-input"
              type="text"
              placeholder={t("chat_placeholder")}
              value={chatInput}
              onChange={function(e) { setChatInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
              disabled={chatLoading}
            />
            <button className="chat-send" onClick={function() { handleChatSend(); }} disabled={!chatInput.trim() || chatLoading}>
              ↑
            </button>
          </div>
        </div>
      )}

      {syncToast && (
        <div className={"sync-toast sync-toast-" + syncToast}>
          {syncToast === "saved" ? t("toast_saved") : t("toast_error")}
        </div>
      )}
    </>
  );
}
