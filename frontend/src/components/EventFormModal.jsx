import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Brain, AlertCircle, Loader2 } from 'lucide-react';
import { categoriesApi, venuesApi, predictApi } from '../services/api';
import { Modal, Field, inputCls, PrimaryButton, useToast } from './ui';

const todayStr = () => new Date().toISOString().slice(0, 10);

const blank = () => ({
  title: '',
  category: '',
  description: '',
  date: todayStr(),
  startTime: '14:00',
  endTime: '16:00',
  venue: '',
  venueCapacity: 150,
  smsPriority: 2,
  expectedRegistrations: 100,
  organizerId: '',
  featured: false,
  status: 'Upcoming'
});

function splitTime(t) {
  const m = String(t || '').match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  return m ? { startTime: m[1].padStart(5, '0'), endTime: m[2].padStart(5, '0') } : {};
}
const slotOf = (start) => {
  const h = parseInt(String(start).split(':')[0], 10);
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
};

/**
 * Create / edit an event.
 *  event=null -> create mode;  isAdmin enables owner, featured & status controls.
 */
export default function EventFormModal({
  isOpen,
  open,
  onClose,
  event = null,
  initialEvent = null,
  onSubmit,
  isAdmin = false,
  organizers = []
}) {
  const modalOpen = isOpen !== undefined ? Boolean(isOpen) : Boolean(open);
  const activeEvent = event || initialEvent;
  const toast = useToast();
  const [form, setForm] = useState(blank());
  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [forecasting, setForecasting] = useState(false);
  const [saving, setSaving] = useState(false);
  const editing = Boolean(activeEvent);

  useEffect(() => {
    if (!modalOpen) return;
    Promise.all([categoriesApi.getAll(), venuesApi.getAll()])
      .then(([c, v]) => {
        setCategories(c.data || []);
        setVenues(v.data || []);
        setForm((f) => (f.category || !(c.data || []).length ? f : { ...f, category: c.data[0].name }));
      })
      .catch(() => toast.error('Could not load categories and venues.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    if (activeEvent) {
      setForm({
        ...blank(),
        title: activeEvent.title || '',
        category: activeEvent.category || '',
        description: activeEvent.description || '',
        date: activeEvent.date || todayStr(),
        ...splitTime(activeEvent.time),
        venue: activeEvent.venue || '',
        venueCapacity: activeEvent.venueCapacity || 100,
        expectedRegistrations: activeEvent.registrationCount || 0,
        organizerId: activeEvent.organizerId || '',
        featured: Boolean(activeEvent.featured),
        status: activeEvent.status || 'Upcoming'
      });
    } else {
      setForm(blank());
    }
    setForecast(null);
  }, [modalOpen, activeEvent]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // Debounced forecast from the trained model (via the backend)
  useEffect(() => {
    if (!modalOpen || !form.date || !form.venueCapacity) return undefined;
    const timer = setTimeout(async () => {
      setForecasting(true);
      try {
        const d = new Date(`${form.date}T00:00:00`);
        const lead = Math.max(0, Math.round((d - new Date()) / 86400000));
        const res = await predictApi.forecast({
          eventType: form.category || 'Academic',
          dayOfWeek: d.getDay(),
          timeSlot: slotOf(form.startTime),
          venueCapacity: Number(form.venueCapacity),
          registrationCount: editing ? Number(activeEvent.registrationCount || 0) : Number(form.expectedRegistrations || 0),
          pastAttendanceRate: Number(activeEvent?.pastAttendanceRate ?? 0.75),
          // SMS priority is chosen by each student when they RSVP. Use the real split once students
          // have registered; before that assume the default (medium).
          smsPriority: Number(activeEvent?.smsPriority ?? 2),
          ...(editing && activeEvent?.smsMix ? { smsMix: activeEvent.smsMix } : {}),
          leadDays: Math.min(lead, 60)
        });
        setForecast(res);
      } catch (e) {
        setForecast(null);
      } finally {
        setForecasting(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [modalOpen, form.category, form.date, form.startTime, form.venueCapacity, form.expectedRegistrations, editing, activeEvent]);

  const venueNames = useMemo(() => venues.map((v) => v.name), [venues]);

  if (!modalOpen) return null;

  const pickVenue = (name) => {
    const v = venues.find((x) => x.name === name);
    set({ venue: name, ...(v ? { venueCapacity: v.capacity } : {}) });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.endTime <= form.startTime) return toast.error('End time must be after the start time.');
    if (!editing && form.date < todayStr() && !isAdmin) return toast.error('The event date cannot be in the past.');

    const payload = {
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      date: form.date,
      time: `${form.startTime} - ${form.endTime}`,
      venue: form.venue.trim(),
      venueCapacity: Number(form.venueCapacity)
    };
    if (isAdmin) {
      payload.featured = form.featured;
      if (editing) payload.status = form.status;
      if (!editing && form.organizerId) payload.organizerId = form.organizerId;
    } else if (editing) {
      payload.status = form.status;
    }

    setSaving(true);
    try {
      await onSubmit(payload, activeEvent);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not save the event.');
    } finally {
      setSaving(false);
    }
  };

  const riskStyles = {
    HIGH_OVERCROWDING_RISK: 'bg-red-50 border-red-200 text-red-900',
    LOW_TURNOUT_RISK: 'bg-amber-50 border-amber-200 text-amber-900',
    OPTIMAL_ATTENDANCE: 'bg-emerald-50 border-emerald-200 text-emerald-900'
  };

  return (
    <Modal
      title={editing ? 'Edit event' : 'Create university event'}
      subtitle="The attendance forecast updates live from the trained SmartEvent model"
      icon={Calendar}
      size="lg"
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Event title" className="md:col-span-2">
            <input required minLength={3} maxLength={140} className={inputCls} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Strathmore FinTech Symposium 2026" />
          </Field>
          <Field label="Category">
            <select required className={inputCls} value={form.category} onChange={(e) => set({ category: e.target.value })}>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea rows="3" maxLength={2000} className={inputCls} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="What is the event about? Who should attend?" />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Venue" className="md:col-span-2" hint="Pick a campus venue to auto-fill its capacity, or type your own.">
            <input required list="se-venues" className={inputCls} value={form.venue} onChange={(e) => pickVenue(e.target.value)} placeholder="Choose or type a venue" />
            <datalist id="se-venues">
              {venueNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </Field>
          <Field label="Venue capacity">
            <input required type="number" min="1" max="100000" className={inputCls} value={form.venueCapacity} onChange={(e) => set({ venueCapacity: e.target.value })} />
          </Field>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Date">
            <input required type="date" min={isAdmin || editing ? undefined : todayStr()} className={inputCls} value={form.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="Starts">
            <input required type="time" className={inputCls} value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} />
          </Field>
          <Field label="Ends">
            <input required type="time" className={inputCls} value={form.endTime} onChange={(e) => set({ endTime: e.target.value })} />
          </Field>
        </div>
        <p className="text-[11px] text-slate-500 -mt-2">
          SMS priority is chosen by each student when they RSVP, not by the organizer. When you send a message you only
          choose its type (urgent change, reminder or announcement) and each student receives it according to their own priority.
        </p>

        {!editing && (
          <Field label="Expected registrations" hint="Used only for the forecast below - real registrations start at 0.">
            <input type="number" min="0" className={inputCls} value={form.expectedRegistrations} onChange={(e) => set({ expectedRegistrations: e.target.value })} />
          </Field>
        )}

        {(editing || isAdmin) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {editing && (
              <Field label="Status">
                <select className={inputCls} value={form.status} onChange={(e) => set({ status: e.target.value })}>
                  {['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            )}
            {isAdmin && !editing && organizers.length > 0 && (
              <Field label="Organizer (owner)">
                <select className={inputCls} value={form.organizerId} onChange={(e) => set({ organizerId: e.target.value })}>
                  <option value="">Me (administrator)</option>
                  {organizers.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </Field>
            )}
            {isAdmin && (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 sm:self-end pb-2.5">
                <input type="checkbox" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} />
                Feature on homepage
              </label>
            )}
          </div>
        )}

        {/* Live forecast */}
        <div className={`p-4 rounded-xl border space-y-2 ${forecast ? riskStyles[forecast.riskLevel] || 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="flex items-center gap-1.5">
              <Brain className="w-4 h-4" /> Attendance forecast
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold opacity-80">
              {forecasting && <Loader2 className="w-3 h-3 animate-spin" />}
              {forecast ? (forecast.isModelBased ? `${forecast.algorithm} (trained model)` : forecast.algorithm || 'Rule-based estimate') : 'calculating...'}
            </span>
          </div>
          {forecast && (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/70 rounded-lg p-2">
                  <div className="text-[10px] uppercase font-bold opacity-70">Expected turnout</div>
                  <div className="text-lg font-black">{forecast.predictedAttendance}</div>
                </div>
                <div className="bg-white/70 rounded-lg p-2">
                  <div className="text-[10px] uppercase font-bold opacity-70">Show-up rate</div>
                  <div className="text-lg font-black">{Math.round((forecast.predictedTurnoutRate || 0) * 100)}%</div>
                </div>
                <div className="bg-white/70 rounded-lg p-2">
                  <div className="text-[10px] uppercase font-bold opacity-70">Room fill</div>
                  <div className="text-lg font-black">{forecast.capacityUtilization}%</div>
                </div>
              </div>
              <p className="text-xs flex items-start gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{forecast.recommendation}</span>
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <PrimaryButton type="submit" loading={saving}>
            {editing ? 'Save changes' : 'Create & publish event'}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}
