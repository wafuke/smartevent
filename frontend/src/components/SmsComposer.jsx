import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
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
 * Organizers can only message the roster of their own events (or send a test to themselves).
 * Admins can also target all students or an explicit list of numbers.
 */
export default function SmsComposer({ events, role, defaultEventId, onSent }) {
  const toast = useToast();
  const isAdmin = role === 'admin';
  const [audience, setAudience] = useState('EVENT');
  const [eventId, setEventId] = useState(defaultEventId || '');
  const [priority, setPriority] = useState('MEDIUM');
  const [numbers, setNumbers] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    smsApi.getStatus().then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (!eventId && events.length) setEventId(defaultEventId || events[0].id);
  }, [events, eventId, defaultEventId]);

  const payload = useMemo(() => {
    const base = { priority, message };
    if (audience === 'TEST') return { ...base, testToMe: true };
    if (audience === 'ALL_STUDENTS') return { ...base, audience: 'ALL_STUDENTS' };
    if (audience === 'NUMBERS') return { ...base, phoneNumbers: numbers };
    return { ...base, eventId };
  }, [audience, eventId, priority, message, numbers]);

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
      className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs font-semibold ${
        status.mode === 'LIVE' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : status.mode === 'SANDBOX' ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}
    >
      {status.mode === 'LIVE' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <Info className="w-4 h-4 shrink-0 mt-0.5" />}
      <div>
        <b>Gateway mode: {status.mode}</b> - {status.modeDescription}
        {isAdmin && status.balance && <span className="block mt-0.5">Africa's Talking balance: {status.balance}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {modeBanner}

      <form onSubmit={send} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <MessageSquare className="w-4 h-4 text-[#003366]" /> Compose priority SMS
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Send to">
            <select className={inputCls} value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="EVENT">Registered students of an event</option>
              <option value="TEST">Test - send only to my own phone</option>
              {isAdmin && <option value="ALL_STUDENTS">All active students</option>}
              {isAdmin && <option value="NUMBERS">Specific phone numbers</option>}
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
        </div>

        {audience === 'NUMBERS' && (
          <Field label="Phone numbers" hint="Separate with commas. Accepts 07XXXXXXXX or +2547XXXXXXXX.">
            <textarea rows="2" className={inputCls} value={numbers} onChange={(e) => setNumbers(e.target.value)} placeholder="0712345678, +254722112233" />
          </Field>
        )}

        <Field label="Priority">
          <div className="grid grid-cols-3 gap-2">
            {[
              ['HIGH', 'High - urgent'],
              ['MEDIUM', 'Medium - standard'],
              ['LOW', 'Low - info']
            ].map(([p, label]) => (
              <button
                type="button"
                key={p}
                onClick={() => setPriority(p)}
                className={`py-2 rounded-xl border text-[11px] font-extrabold transition-colors ${priority === p ? 'bg-[#003366] border-[#003366] text-white' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
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
            [SmartEvent {priority}] {selectedEvent && audience === 'EVENT' ? selectedEvent.title : 'SmartEvent Campus Alert'}: {message}
          </div>
        )}

        {preview && !preview.error && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-bold text-slate-700 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2.5">
            <span>{preview.recipientCount} recipient{preview.recipientCount === 1 ? '' : 's'}</span>
            <span>~KES {preview.estimatedCostKES}</span>
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
