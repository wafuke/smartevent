import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X, ChevronUp, ChevronDown, Search, Loader2, Inbox } from 'lucide-react';

/* ------------------------------------------------------------------ Toasts */
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (type, message, ms = 4500) => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-3), { id, type, message }]);
      setTimeout(() => remove(id), ms);
    },
    [remove]
  );

  useEffect(() => {
    const onToast = (e) => push(e.detail.type || 'info', e.detail.message);
    window.addEventListener('smartevent:toast', onToast);
    return () => window.removeEventListener('smartevent:toast', onToast);
  }, [push]);

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m, 7000),
      info: (m) => push('info', m)
    }),
    [push]
  );

  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-[min(92vw,380px)]" aria-live="polite">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div key={t.id} className={`flex items-start gap-2.5 p-3.5 rounded-xl border shadow-lg text-xs font-semibold ${colors[t.type]}`}>
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1 leading-relaxed">{t.message}</span>
              <button onClick={() => remove(t.id)} aria-label="Dismiss"><X className="w-3.5 h-3.5 opacity-60" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

/* ----------------------------------------------------------------- Confirm */
const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const confirm = useCallback(
    (opts) => new Promise((resolve) => setState({ ...opts, resolve })),
    []
  );
  const close = (result) => {
    state.resolve(result);
    setState(null);
  };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <Modal title={state.title || 'Are you sure?'} onClose={() => close(false)} size="sm">
          <p className="text-sm text-slate-600 leading-relaxed">{state.message}</p>
          <div className="flex justify-end gap-2 pt-5">
            <button onClick={() => close(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button
              onClick={() => close(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white ${state.danger === false ? 'bg-[#003366] hover:bg-[#002244]' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {state.confirmLabel || 'Confirm'}
            </button>
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}
export const useConfirm = () => useContext(ConfirmContext);

/* ------------------------------------------------------------------- Modal */
export function Modal({ title, subtitle, onClose, children, size = 'md', icon: Icon }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose && onClose()}>
      <div role="dialog" aria-modal="true" className={`relative w-full ${widths[size]} bg-white rounded-2xl shadow-2xl border border-slate-200 my-6`}>
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-[#003366] text-white shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-black text-slate-900 truncate">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="px-5 sm:px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Badges */
const BADGE = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  organizer: 'bg-amber-100 text-amber-800 border-amber-200',
  student: 'bg-sky-100 text-sky-700 border-sky-200',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  upcoming: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  sent: 'bg-sky-100 text-sky-700 border-sky-200',
  processed: 'bg-sky-100 text-sky-700 border-sky-200',
  queued: 'bg-sky-100 text-sky-700 border-sky-200',
  simulated: 'bg-slate-100 text-slate-600 border-slate-300',
  suspended: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-sky-100 text-sky-700 border-sky-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-300',
  ongoing: 'bg-blue-100 text-blue-700 border-blue-200'
};

export function Badge({ children, kind }) {
  const key = String(kind || children || '').toLowerCase().split(' ')[0];
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${BADGE[key] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {children}
    </span>
  );
}

/* -------------------------------------------------------------- Stat cards */
export function StatCard({ label, value, hint, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'text-[#003366] bg-blue-50',
    green: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50'
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && (
          <span className={`p-1.5 rounded-lg ${tones[tone]}`}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">{value}</div>
      {hint && <div className="text-[11px] text-slate-500 font-medium mt-1.5">{hint}</div>}
    </div>
  );
}

/* ------------------------------------------------------------- Empty / load */
export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        <Inbox className="w-6 h-6" />
      </div>
      <p className="text-sm font-extrabold text-slate-700">{title}</p>
      {message && <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading...' }) {
  return (
    <div className="py-16 flex flex-col items-center text-slate-400 gap-2">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}

/* --------------------------------------------------------------- Form bits */
export const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] disabled:opacity-60';

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 font-medium">{hint}</span>}
    </label>
  );
}

export function PrimaryButton({ children, loading, className = '', ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#003366] hover:bg-[#002244] disabled:opacity-60 text-white text-xs font-bold shadow-sm transition-colors ${className}`}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}

/* --------------------------------------------------------------- DataTable */
/**
 * columns: [{ key, label, render?(row), sortValue?(row), sortable?, className? }]
 */
export function DataTable({ columns, rows, searchPlaceholder = 'Search...', searchText, pageSize = 10, empty, toolbar, rowKey = 'id' }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [query, rows.length]);

  const filtered = useMemo(() => {
    if (!searchText || !query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => String(searchText(r)).toLowerCase().includes(q));
  }, [rows, query, searchText]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    const val = (r) => (col.sortValue ? col.sortValue(r) : r[col.key]);
    return [...filtered].sort((a, b) => {
      const A = val(a);
      const B = val(b);
      const res = typeof A === 'number' && typeof B === 'number' ? A - B : String(A ?? '').localeCompare(String(B ?? ''), undefined, { numeric: true });
      return sort.dir === 'asc' ? res : -res;
    });
  }, [filtered, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages);
  const visible = sorted.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  return (
    <div className="space-y-3">
      {(searchText || toolbar) && (
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          {searchText ? (
            <div className="relative sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} className={`${inputCls} pl-9`} />
            </div>
          ) : (
            <span />
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((c) => {
                const sortable = c.sortable !== false && c.key !== 'actions';
                return (
                  <th key={c.key} className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 whitespace-nowrap ${c.className || ''}`}>
                    {sortable ? (
                      <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-[#003366]">
                        {c.label}
                        {sort.key === c.key && (sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={row[rowKey] ?? i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 align-middle text-slate-700 ${c.className || ''}`}>
                    {c.render ? c.render(row) : row[c.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (empty || <EmptyState title="No matching records" message="Try changing your search or filters." />)}
      </div>

      {sorted.length > pageSize && (
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>
            Showing {(current - 1) * pageSize + 1}-{Math.min(current * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button disabled={current === 1} onClick={() => setPage(current - 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              Prev
            </button>
            <span>
              {current} / {pages}
            </span>
            <button disabled={current === pages} onClick={() => setPage(current + 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- formatting */
export const fmtDate = (d) => {
  if (!d) return '-';
  const date = new Date(d.length === 10 ? `${d}T00:00:00` : d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const fmtDateTime = (d) => {
  if (!d) return '-';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};
export const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  if (Number.isNaN(diff)) return '';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
