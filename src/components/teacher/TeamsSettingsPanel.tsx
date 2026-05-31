'use client';

import React, { useState, useEffect } from 'react';

interface WebhookStatus {
  configured: boolean;
  preview: string | null;
}

export default function TeamsSettingsPanel() {
  const [status, setStatus] = useState<WebhookStatus | null>(null);
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/teacher/teams/webhook')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/teacher/teams/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: url.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unknown error');
      setMsg({ type: 'success', text: data.message });
      setStatus({ configured: !!url.trim(), preview: url.trim() ? `${url.trim().slice(0, 40)}…` : null });
      setUrl('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/teacher/teams/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: '' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Unknown error');
      setMsg({ type: 'success', text: 'Webhook cleared.' });
      setStatus({ configured: false, preview: null });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="4" fill="#5059C9"/>
            <path d="M13.5 6h3.75a.75.75 0 0 1 .75.75v3.75a3 3 0 0 1-3 3H13.5V6Z" fill="white" opacity="0.8"/>
            <path d="M6 10.5a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0Z" fill="white"/>
            <rect x="5" y="17" width="10" height="1.5" rx="0.75" fill="white" opacity="0.7"/>
          </svg>
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-100 m-0">MS Teams Notifications</h3>
          <p className="text-xs text-slate-500 m-0">Get student struggle alerts and weekly reports in Teams</p>
        </div>
      </div>

      {/* Connection status badge */}
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium w-fit border ${
          status?.configured
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
            : 'bg-slate-800/60 text-slate-500 border-slate-700/40'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            status?.configured ? 'bg-emerald-400' : 'bg-slate-500'
          }`}
        />
        {status === null
          ? 'Checking…'
          : status.configured
          ? `Connected — ${status.preview}`
          : 'Not connected'}
      </span>

      {/* Setup instructions */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-slate-300 mb-2">How to get your webhook URL:</p>
        <ol className="text-xs text-slate-400 space-y-1 pl-4 list-decimal marker:text-slate-600">
          <li>Open the Teams channel where you want alerts</li>
          <li>Click <strong className="text-slate-300">⋯ More options → Connectors</strong></li>
          <li>Search for <strong className="text-slate-300">Incoming Webhook</strong> and click Configure</li>
          <li>Name it <em className="text-slate-300">LingoPeak</em>, click Create, then copy the URL</li>
        </ol>
      </div>

      {/* Input row */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="url"
          className="flex-1 min-w-0 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-medium outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
          placeholder="https://your-org.webhook.office.com/webhookb2/…"
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={saving}
        />
        <button
          className="px-4 py-2.5 bg-[#5059C9] hover:bg-[#4048b8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-opacity whitespace-nowrap cursor-pointer"
          onClick={save}
          disabled={saving || !url.trim()}
        >
          {saving ? 'Saving…' : 'Save & Test'}
        </button>
        {status?.configured && (
          <button
            className="px-3 py-2.5 bg-red-950/30 hover:bg-red-950/50 text-red-400 border border-red-500/25 text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            onClick={clear}
            disabled={saving}
          >
            Clear
          </button>
        )}
      </div>

      {/* Result message */}
      {msg && (
        <p
          className={`text-xs px-3 py-2.5 rounded-xl border ${
            msg.type === 'success'
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/25'
              : 'bg-red-950/30 text-red-400 border-red-500/25'
          }`}
        >
          {msg.type === 'success' ? '✅' : '❌'} {msg.text}
        </p>
      )}
    </div>
  );
}
