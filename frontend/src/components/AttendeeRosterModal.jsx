import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Users,
  Mail,
  Phone,
  Download,
  Search,
  CheckCircle,
  UserCheck,
  Trash2
} from 'lucide-react';
import { eventsApi, registrationsApi } from '../services/api';
import { useToast, useConfirm, Badge } from './ui';

export default function AttendeeRosterModal({ isOpen, onClose, event, onRosterChanged }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadRoster = useCallback(async () => {
    if (!isOpen || !event) return;
    setLoading(true);
    try {
      const res = await eventsApi.attendees(event.id);
      setAttendees(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Could not load event attendee roster');
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  }, [isOpen, event, toast]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  if (!isOpen || !event) return null;

  const handleToggleCheckIn = async (att) => {
    const nextChecked = att.status !== 'Checked In';
    try {
      await registrationsApi.checkIn(att.id, nextChecked);
      toast.success(
        nextChecked
          ? `Checked in ${att.studentName} (${att.studentId})`
          : `Reverted check-in for ${att.studentName}`
      );
      await loadRoster();
      onRosterChanged?.();
    } catch (err) {
      toast.error(err.message || 'Check-in update failed');
    }
  };

  const handleRemoveAttendee = async (att) => {
    const ok = await confirm({
      title: 'Remove Registration',
      message: `Remove ${att.studentName} (${att.studentId}) from "${event.title}"?`,
      confirmText: 'Remove Attendee',
      danger: true
    });
    if (!ok) return;
    try {
      await registrationsApi.cancel(att.id);
      toast.info(`Removed ${att.studentName} from roster.`);
      await loadRoster();
      onRosterChanged?.();
    } catch (err) {
      toast.error(err.message || 'Could not remove attendee');
    }
  };

  const handleExportCsv = () => {
    const headers = ['Registration ID', 'Student Name', 'Admission No', 'Email', 'Phone', 'Status', 'Registered At', 'Checked In At'];
    const rows = attendees.map((a) => [
      a.id,
      a.studentName,
      a.studentId,
      a.email,
      a.phone,
      a.status,
      a.registeredAt || '',
      a.checkedInAt || ''
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.id}_roster.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${attendees.length} attendees to CSV.`);
  };

  const q = searchTerm.toLowerCase();
  const filteredAttendees = attendees.filter(
    (a) =>
      (a.studentName || '').toLowerCase().includes(q) ||
      String(a.studentId || '').includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.phone || '').includes(q)
  );

  const checkedInCount = attendees.filter((a) => a.status === 'Checked In').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#003366] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0f172a] leading-tight">
                Live Attendee Roster & Venue Check-In
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {event.title} • <strong>{attendees.length}</strong> RSVPs •{' '}
                <strong className="text-emerald-700">{checkedInCount} Checked In</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Export Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student name, admission no, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#003366] focus:bg-white outline-none"
            />
          </div>

          <button
            onClick={handleExportCsv}
            disabled={attendees.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster CSV ({attendees.length})</span>
          </button>
        </div>

        {/* Roster Table */}
        <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading attendee roster...</div>
          ) : filteredAttendees.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No registered attendees match this search.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="p-3">Student</th>
                  <th className="p-3">Admission No</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Check-In / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendees.map((att) => {
                  const isChecked = att.status === 'Checked In';
                  return (
                    <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-extrabold text-slate-900">{att.studentName}</div>
                        <div className="text-[10px] font-mono text-slate-400">#{att.id}</div>
                      </td>
                      <td className="p-3 font-bold text-[#003366]">{att.studentId}</td>
                      <td className="p-3 text-slate-600 space-y-0.5">
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{att.email}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{att.phone}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge tone={isChecked ? 'blue' : 'green'}>
                          {isChecked ? '✓ Checked In' : 'Confirmed'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={() => handleToggleCheckIn(att)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 ${
                            isChecked
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{isChecked ? 'Undo' : 'Check In'}</span>
                        </button>
                        <button
                          onClick={() => handleRemoveAttendee(att)}
                          title="Remove registration"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 inline-flex items-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <span>
            Check-in rate:{' '}
            <strong>
              {attendees.length > 0 ? Math.round((checkedInCount / attendees.length) * 100) : 0}%
            </strong>
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
