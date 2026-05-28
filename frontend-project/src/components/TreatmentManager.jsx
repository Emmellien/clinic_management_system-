import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const TreatmentManager = () => {
  const role = localStorage.getItem('role') || 'Guest';

  // History & Display Lists States
  const [historyLogs, setHistoryLogs] = useState([]);
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Interactive Form States
  const [editingId, setEditingId] = useState(null);
  const [patientId, setPatientId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  const getHeader = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  // Fetch all clinical treatment history records
  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/treatments', getHeader());
      setHistoryLogs(res.data);
    } catch (err) {
      console.error('Failed to load clinical histories:', err);
    }
  }, [getHeader]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const resetForm = () => {
    setEditingId(null);
    setPatientId('');
    setAppointmentId('');
    setDiagnosis('');
    setNotes('');
  };

  // Submit Logic: Create new or update diagnosis files
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', isError: false });

    try {
      if (editingId) {
        // Run PUT update modifications request
        const res = await axios.put(`http://localhost:5000/api/treatments/${editingId}`, { diagnosis, notes }, getHeader());
        setMsg({ text: `✨ ${res.data.message}`, isError: false });
      } else {
        // Run POST clinical evaluation recording creation request
        const payload = {
          patient_id: parseInt(patientId),
          appointment_id: appointmentId ? parseInt(appointmentId) : null,
          diagnosis,
          notes
        };
        const res = await axios.post('http://localhost:5000/api/treatments', payload, getHeader());
        setMsg({ text: `🎉 ${res.data.message}! Form assigned record log ID: ${res.data.treatment_id}`, isError: false });
      }
      resetForm();
      fetchHistory();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Access policy block error.', isError: true });
    }
  };

  // Mount targeted record elements into active fields for updating text parameters
  const startEdit = (log) => {
    setEditingId(log.treatment_id);
    setPatientId(log.patient_id);
    setAppointmentId(log.appointment_id || '');
    setDiagnosis(log.diagnosis);
    setNotes(log.notes || '');
  };

  // Delete evaluation summary (Admin Lock check verification)
  const handleDelete = async (id) => {
    if (!window.confirm('Are you authorized to permanently remove this historic medical diagnosis card record entry?')) return;
    setMsg({ text: '', isError: false });

    try {
      const res = await axios.delete(`http://localhost:5000/api/treatments/${id}`, getHeader());
      setMsg({ text: `🗑️ ${res.data.message}`, isError: false });
      fetchHistory();
      if (editingId === id) resetForm();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Action restricted.', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Informational Response Feed Ribbon */}
      {msg.text && (
        <div className={`p-4 rounded-xl border text-sm font-semibold shadow-sm transition-all ${msg.isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* PANEL CONSOLE 1: MEDICAL INTAKE INPUT MODIFIER */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-base font-bold text-slate-800">
              {editingId ? '📝 Update Encounter Notes' : '🩺 Log Medical Encounter'}
            </h3>
            {editingId && (
              <button onClick={resetForm} className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline">
                Cancel Edit
              </button>
            )}
          </div>

          {['Receptionist'].includes(role) ? (
            <div className="bg-slate-50 border border-dashed rounded-xl p-4 text-center text-xs text-slate-500">
              🔒 Front desk receptionist roles do not possess medical clearance levels to inject diagnosis matrices.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Target Patient Database ID</label>
                <input type="number" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 text-slate-700 font-mono" value={patientId} onChange={e => setPatientId(e.target.value)} required disabled={!!editingId} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Appointment Reference ID (Optional)</label>
                <input type="number" placeholder="Leave empty for walk-ins" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 text-slate-700 font-mono" value={appointmentId} onChange={e => setAppointmentId(e.target.value)} disabled={!!editingId} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Primary Diagnosis Verdict</label>
                <input type="text" placeholder="e.g., Acute Hypertension flareup" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Clinical Assessment & Progress Notes</label>
                <textarea placeholder="Input symptoms tracker, structural evaluations, or physical checks..." className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-28 resize-none" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer">
                {editingId ? 'Save Assessment Changes' : 'Commit Medical Log'}
              </button>
            </form>
          )}
        </div>

        {/* PANEL CONSOLE 2 & 3: COMPREHENSIVE CASE HISTORIES DIRECTORY TIMELINE */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 border-b pb-3">Historic Clinical Encounter Register</h3>

          <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
            {historyLogs.length === 0 ? (
              <p className="text-center py-12 text-sm text-slate-400 font-medium">No diagnostic history profiles are currently committed to database sheets.</p>
            ) : (
              historyLogs.map((log) => (
                <div key={log.treatment_id} className="p-4 border rounded-xl bg-slate-50/50 border-slate-200/60 flex flex-col sm:flex-row justify-between items-start gap-4 hover:bg-white hover:shadow-sm transition-all">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] bg-blue-50 text-blue-700 border border-blue-100 font-bold px-1.5 py-0.5 rounded">
                        TREAT-{log.treatment_id}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 capitalize">{log.diagnosis}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 text-[11px] text-slate-500 font-medium">
                      <p>👤 Patient: <span className="text-slate-800 font-semibold">{log.patient_name} (#{log.patient_id})</span></p>
                      <p>🩺 Consultant: <span className="text-slate-800 font-semibold">{log.doctor_name}</span></p>
                      {log.appointment_id && <p className="col-span-2">📅 Linked Appointment ID: <span className="font-mono text-slate-700">#{log.appointment_id}</span></p>}
                    </div>

                    {log.notes && (
                      <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 mt-2 italic font-normal line-clamp-2">
                        "{log.notes}"
                      </p>
                    )}
                    
                    <span className="block text-[10px] font-mono text-slate-400 pt-1">
                      Encounter Date: {new Date(log.treatment_date).toLocaleString()}
                    </span>
                  </div>

                  {/* Operational Controls Context Buttons */}
                  <div className="flex sm:flex-col gap-1.5 w-full sm:w-auto justify-end">
                    {['Doctor', 'Nurse'].includes(role) && (
                      <button onClick={() => startEdit(log)} className="px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-100 transition-colors cursor-pointer text-center">
                        Edit
                      </button>
                    )}
                    {role === 'Admin' && (
                      <button onClick={() => handleDelete(log.treatment_id)} className="px-3 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-100 transition-colors cursor-pointer text-center">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TreatmentManager;