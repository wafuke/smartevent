import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, AlertTriangle, CheckCircle2, Info, Settings } from 'lucide-react';
import { smsApi } from '../services/api';
import { Field, inputCls, PrimaryButton, useToast, Badge } from './ui';

const TEMPLATES = [
  { label: 'Arrive early', text: 'Please arrive 15 minutes early and carry your Strathmore student ID.' },
  { label: 'Venue change', text: 'IMPORTANT: the venue has changed. Please check the SmartEvent app for the new location.' },
  { label: 'Reminder', text: 'Friendly reminder - this event starts soon. We look forward to seeing you!' },
  { label: 'Cancelled', text: 'Unfortunately this event has been cancelled. We apologise for the inconvenience.' }
];

const MAX = 480;
const segmentsOf = (text) => {
  // eslint-disable-next-line no-control-regex
  const unicode = /[^\u0000-\u00ff]/.test(text);
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  return text.length <= single ? 1 : Math.ceil(text.length / multi);
};

/**
 * Shared Africa's Talking SMS composer for organizers and admins.
 */
export default function SmsComposer({ events = [], role, user, defaultEventId, onSent }) {
  const toast = useToast();
  const isAdmin = role === 'admin' || String(user?.role || '').toLowerCase() === 'admin';
  const [audience, setAudience] = useState('EVENT');
  const [eventId, setEventId] = useState(defaultEventId || '');
  // The organizer chooses WHAT is being sent; each STUDENT's own SMS priority decides if they get it by SMS.
  const [kind, setKind] = useState('REMINDER');
  const [numbers, setNumbers] = useState('');
  const [testPhone, setTestPhone] = useState(user?.phone || '+254712345678');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);

  // Option B Live SMS Configuration state
  const [showConfig, setShowConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [cfgForm, setCfgForm] = useState({
    mode: 'LIVE',
    username: 'smartevent',
    apiKey: '',
    senderId: ''
  });

  const loadGatewayStatus = () => {
    smsApi
      .getStatus()
      .then((s) => {
        const st = s.data || s;
        setStatus(st);
        setCfgForm((prev) => ({
          ...prev,
          mode: st.mode || 'LIVE',
          username: st.username || 'smartevent',
          senderId: st.senderId || ''
        }));
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadGatewayStatus();
  }, []);

  useEffect(() => {
    if (!eventId && events.length) setEventId(defaultEventId || events[0].id);
  }, [events, eventId, defaultEventId]);

  const payload = useMemo(() => {
    const base = { kind, message, audience };
    if (audience === 'TEST') return { ...base, testToMe: true, testPhone };
    if (audience === 'ALL_STUDENTS') return { ...base, audience: 'ALL_STUDENTS' };
    if (audience === 'NUMBERS') return { ...base, eventId: eventId || (events[0] && events[0].id), broadcastToEventRoster: false, phoneNumbers: numbers };
    return { ...base, eventId };
  }, [audience, eventId, events, kind, message, numbers, testPhone]);

  // Live recipient count / cost preview
  useEffect(() => {
    if (audience === 'EVENT' && !eventId) return undefined;
    if (audience === 'NUMBERS' && !numbers.trim()) {
      setPreview(null);
      return undefined;
    }
    const t = setTimeout(() => {
      smsApi.preview(payload).then(setPreview).catch((e) => setPreview({ error: e.message }));
    }, 450);
    return () => clearTimeout(t);
  }, [payload, audience, eventId, numbers]);

  const segs = segmentsOf(message);
  const selectedEvent = events.find((e) => e.id === eventId);

  const handleSaveGatewayConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await smsApi.updateConfig(cfgForm);
      toast.success(res.message || "Africa's Talking gateway settings saved.");
      loadGatewayStatus();
      setShowConfig(false);
    } catch (err) {
      toast.error(err.message || 'Could not update gateway settings.');
    } finally {
      setSavingConfig(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error('Write a message first.');
    setSending(true);
    setResult(null);
    try {
      const res = await smsApi.send(payload);
      setResult(res);
      res.mode === 'SIMULATION' ? toast.info(res.message) : toast.success(res.message);
      onSent && onSent(res);
    } catch (err) {
      if (err.payload && err.payload.failures) setResult(err.payload);
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const modeBanner = status && (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border text-xs font-semibold ${
        status.mode === 'LIVE'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : status.mode === 'SANDBOX'
          ? 'bg-sky-50 border-sky-200 text-sky-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {status.mode === 'LIVE' ? (
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        ) : (
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
        )}
        <div>
          <div>
            <b>Gateway mode: {status.mode}</b> — {status.modeDescription}
          </div>
          <div className="text-[11px] opacity-85 mt-0.5">
            API Key: <b>{status.maskedApiKey || 'Configured'}</b> • Username: <b>{status.username || 'sandbox'}</b>
            {status.balance ? ` • Balance: ${status.balance}` : ''}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowConfig(!showConfig)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white border border-slate-300 text-slate-800 font-bold text-xs shrink-0 self-start sm:self-center shadow-2xs"
      >
        <Settings className="w-3.5 h-3.5 text-[#003366]" />
        <span>{showConfig ? 'Hide Gateway Config' : 'Configure Option B (Live SMS)'}</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {modeBanner}

      {showConfig && (
        <form
          onSubmit={handleSaveGatewayConfig}
          className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 border border-slate-700 shadow-lg text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div>
              <h4 className="text-sm font-black text-amber-400">
                Africa&apos;s Talking Gateway Configuration (Sandbox vs Option B Live SMS)
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Your API key ({status?.maskedApiKey || 'atsk_6d94...c370'}) is saved in backend/.env. To send real-life SMS to actual phones (Option B), switch Mode to LIVE and enter your Live App Username from account.africastalking.com.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-300 mb-1">
                Gateway Mode
              </label>
              <select
                value={cfgForm.mode}
                onChange={(e) => {
                  const nextMode = e.target.value;
                  setCfgForm((f) => ({
                    ...f,
                    mode: nextMode,
                    username: nextMode === 'SANDBOX' ? 'sandbox' : f.username === 'sandbox' ? '' : f.username
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 text-white font-bold text-xs"
              >
                <option value="SANDBOX">Option A: Sandbox (AT Simulator)</option>
                <option value="LIVE">Option B: LIVE (Real Phone SMS)</option>
                <option value="SIMULATION">Local Simulation (Offline Safe)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-300 mb-1">
                AT App Username
              </label>
              <input
                type="text"
                required
                value={cfgForm.username}
                onChange={(e) => setCfgForm({ ...cfgForm, username: e.target.value })}
                placeholder={cfgForm.mode === 'LIVE' ? 'Your Live App Username' : 'sandbox'}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 text-white font-semibold text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-300 mb-1">
                API Key ({status?.maskedApiKey || 'Saved'})
              </label>
              <input
                type="password"
                value={cfgForm.apiKey}
                onChange={(e) => setCfgForm({ ...cfgForm, apiKey: e.target.value })}
                placeholder="Leave blank to keep saved atsk_... key"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 text-white font-semibold text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-300 mb-1">
                Sender ID (Optional)
              </label>
              <input
                type="text"
                value={cfgForm.senderId}
                onChange={(e) => setCfgForm({ ...cfgForm, senderId: e.target.value })}
                placeholder="Blank = default AFRICASTKNG"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-600 text-white font-semibold text-xs"
              />
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-[11px] text-slate-300 space-y-1">
            <div className="font-bold text-amber-300">How to activate Option B (Real-Life SMS to Kenyan Handsets):</div>
            <div>1. Log into <b>https://account.africastalking.com</b> and switch from Sandbox to your <b>Live Team / App</b>.</div>
            <div>2. Note your <b>App Username</b> (e.g. <code>smartevent</code>) and top up KES 20–50 via M-Pesa Paybill <b>525900</b>.</div>
            <div>3. Select <b>Option B: LIVE (Real Phone SMS)</b> above, enter your Live App Username, leave Sender ID blank (uses default <code>AFRICASTKNG</code>), and click <b>Save Gateway Settings</b>.</div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingConfig}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold"
            >
              {savingConfig ? 'Saving...' : 'Save Gateway Settings'}
            </button>
          </div>
        </form>
      )}

      <form onSubmit={send} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <MessageSquare className="w-4 h-4 text-[#003366]" /> Compose SMS
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Send to">
            <select className={inputCls} value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="EVENT">Registered students of an event</option>
              <option value="TEST">Test - send to my phone / custom test number</option>
              <option value="NUMBERS">Specific phone numbers (+2547... / 07...)</option>
              {isAdmin && <option value="ALL_STUDENTS">All active students</option>}
            </select>
          </Field>

          {audience === 'EVENT' && (
            <Field label="Event">
              <select className={inputCls} value={eventId} onChange={(e) => setEventId(e.target.value)}>
                {events.length === 0 && <option value="">No events available</option>}
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.registrationCount || 0} registered)
                  </option>
                ))}
              </select>
            </Field>
          )}

          {audience === 'TEST' && (
            <Field label="Test recipient phone number" hint="Accepts 07XXXXXXXX or +2547XXXXXXXX">
              <input
                type="text"
                required
                className={inputCls}
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+254712345678"
              />
            </Field>
          )}
        </div>

        {audience === 'NUMBERS' && (
          <Field label="Phone numbers" hint="Separate with commas. Accepts 07XXXXXXXX or +2547XXXXXXXX.">
            <textarea rows="2" className={inputCls} value={numbers} onChange={(e) => setNumbers(e.target.value)} placeholder="0712345678, +254722112233" />
          </Field>
        )}

        <Field label="Message type" hint="SMS priority is set by each student. They receive this by SMS only if their own priority covers this type.">
          <div className="grid grid-cols-3 gap-2">
            {[
              ['URGENT', 'Urgent change', 'Reaches students on Low, Medium and High'],
              ['REMINDER', 'Reminder', 'Reaches students on Medium and High'],
              ['ANNOUNCEMENT', 'Announcement', 'Reaches students on High only']
            ].map(([k, label, tip]) => (
              <button
                type="button"
                key={k}
                title={tip}
                onClick={() => setKind(k)}
                className={`py-2 rounded-xl border text-[11px] font-extrabold transition-colors ${kind === k ? 'bg-[#003366] border-[#003366] text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Message">
          <textarea required rows="4" maxLength={MAX} className={inputCls} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." />
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-1">
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button type="button" key={t.label} onClick={() => setMessage(t.text)} className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600">
                  {t.label}
                </button>
              ))}
            </div>
            <span className={message.length > MAX - 30 ? 'text-red-600' : ''}>
              {message.length}/{MAX} - {segs} SMS segment{segs > 1 ? 's' : ''}
            </span>
          </div>
        </Field>

        {message && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700">
            <div className="text-[10px] uppercase font-extrabold text-slate-500 mb-1">Preview as received</div>
            [SmartEvent {kind}] {selectedEvent && audience === 'EVENT' ? selectedEvent.title : 'SmartEvent Campus Alert'}: {message}
          </div>
        )}

        {preview && !preview.error && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-bold text-slate-700 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2.5">
            <span>{preview.recipientCount} recipient{preview.recipientCount === 1 ? '' : 's'}</span>
            <span>~KES {preview.estimatedCostKES}</span>
            {preview.byTier && audience === 'EVENT' && (
              <span className="text-slate-600 font-semibold">
                by student priority: {preview.byTier.HIGH} high, {preview.byTier.MEDIUM} medium, {preview.byTier.LOW} low
              </span>
            )}
            {preview.skippedByPreference > 0 && (
              <span className="text-slate-500">{preview.skippedByPreference} get this in-app only (their SMS priority is lower)</span>
            )}
            {preview.skippedOptOut > 0 && <span className="text-slate-500">{preview.skippedOptOut} opted out</span>}
            {preview.invalidNumbers?.length > 0 && <span className="text-red-600">{preview.invalidNumbers.length} invalid number(s)</span>}
          </div>
        )}
        {preview?.error && <p className="text-xs font-semibold text-red-600">{preview.error}</p>}

        <PrimaryButton type="submit" loading={sending} className="w-full sm:w-auto">
          <Send className="w-3.5 h-3.5" /> {audience === 'TEST' ? 'Send test SMS' : `Send to ${preview?.recipientCount ?? '...'} recipient(s)`}
        </PrimaryButton>
      </form>

      {result && (
        <div className={`rounded-2xl border p-4 text-xs space-y-2 ${result.failedCount ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-center gap-2 font-extrabold text-slate-900">
            {result.failedCount ? <AlertTriangle className="w-4 h-4 text-amber-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {result.message}
          </div>
          <div className="flex flex-wrap gap-3 font-bold text-slate-700">
            <span>Accepted: {result.dispatchedCount ?? 0}</span>
            <span>Failed: {result.failedCount ?? 0}</span>
            <Badge kind={result.mode?.toLowerCase() === 'simulation' ? 'simulated' : 'sent'}>{result.mode}</Badge>
          </div>
          {result.failures?.length > 0 && (
            <ul className="list-disc pl-5 text-red-700 font-semibold">
              {result.failures.map((f, i) => (
                <li key={i}>
                  {f.recipient}: {f.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
