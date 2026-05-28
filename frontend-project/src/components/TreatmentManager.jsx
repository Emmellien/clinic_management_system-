import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const TreatmentManager = () => {
  const role = localStorage.getItem('role') || 'Guest';

  // System Lists States
  const [historyLogs, setHistoryLogs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Form Management States
  const [editingId, setEditingId] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  const getHeader = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  // Fetch Treatment History Logs
  const fetchHistory = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/treatments', getHeader());
      setHistoryLogs(res.data);
    } catch (err) {
      console.error('Failed to load clinical histories:', err);
    }
  }, [getHeader]);

  // Fetch Patients List for Foreign Key Selection Dropdown
  const fetchPatients = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/patients', getHeader());
      setPatients(res.data);
    } catch (err) {
      console.error('Failed to load patient records:', err);
    }
  }, [getHeader]);

  // Fetch Appointments List for Foreign Key Selection Dropdown
  const fetchAppointments = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/appointments', getHeader());
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    }
  }, [getHeader]);

  useEffect(() => {
    fetchHistory();
    fetchPatients();
    fetchAppointments();
  }, [fetchHistory, fetchPatients, fetchAppointments]);

  // Filter appointments specifically matching the selected patient
  const filteredAppointments = appointments.filter(
    app => app.patient_id === parseInt(selectedPatientId) && app.status !== 'Completed'
  );

  const resetForm = () => {
    setEditingId(null);
    setSelectedPatientId('');
    setSelectedAppointmentId('');
    setDiagnosis('');
    setNotes('');
  };

  // Submit Handler: Process Create or Update requests
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', isError: false });

    try {
      if (editingId) {
        const res = await axios.put(`http://localhost:5000/api/treatments/${editingId}`, { diagnosis, notes }, getHeader());
        setMsg({ text: res.data.message, isError: false });
      } else {
        const payload = {
          patient_id: parseInt(selectedPatientId),
          appointment_id: selectedAppointmentId ? parseInt(selectedAppointmentId) : null,
          diagnosis,
          notes
        };
        const res = await axios.post('http://localhost:5000/api/treatments', payload, getHeader());
        setMsg({ text: `Treatment entry created successfully. Log ID: ${res.data.treatment_id}`, isError: false });
      }
      resetForm();
      fetchHistory();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to authorize this operation.', isError: true });
    }
  };

  const startEdit = (log) => {
    setEditingId(log.treatment_id);
    setSelectedPatientId(log.patient_id);
    setSelectedAppointmentId(log.appointment_id || '');
    setDiagnosis(log.diagnosis);
    setNotes(log.notes || '');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medical entry permanently?')) return;
    setMsg({ text: '', isError: false });

    try {
      const res = await axios.delete(`http://localhost:5000/api/treatments/${id}`, getHeader());
      setMsg({ text: res.data.message, isError: false });
      fetchHistory();
      if (editingId === id) resetForm();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Access restricted.', isError: true });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* COMPONENT HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clinical Encounter Log Terminal</h2>
          <p className="text-xs text-slate-500">Manage patient diagnosis information, symptoms data, and medical progress tracking histories.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
            Active Role: {role}
          </span>
        </div>
      </header>

      {/* CORE LAYOUT WRAPPER */}
      <div className="flex flex-1 p-6 gap-6">
        
        {/* SIDEBAR CONSOLE: TREATMENT SUBMISSION OR MODIFICATION ENTRY PANEL */}
        <aside className="w-full lg:w-96 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              {editingId ? '📝 Edit Encounter Details' : '🩺 New Clinical Entry'}
            </h3>
            {editingId && (
              <button onClick={resetForm} className="text-xs font-semibold text-slate-500 hover:text-slate-900 underline">
                Cancel Edit
              </button>
            )}
          </div>

          {msg.text && (
            <div className={`p-3 rounded-xl border text-xs font-semibold transition-all ${msg.isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
              {msg.text}
            </div>
          )}

          {['Receptionist'].includes(role) ? (
            <div className="bg-slate-50 border border-dashed rounded-xl p-4 text-center text-xs text-slate-400 font-medium">
              🔒 Your access level restricts entering medical diagnoses or clinical records.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* FOREIGN KEY 1: SEARCHABLE PATIENT DROPDOWN */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Target Patient Name</label>
                <select 
                  className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800 disabled:bg-slate-50"
                  value={selectedPatientId} 
                  onChange={e => { setSelectedPatientId(e.target.value); setSelectedAppointmentId(''); }} 
                  required 
                  disabled={!!editingId}
                >
                  <option value="">-- Choose Patient Profile --</option>
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.full_name} (ID: #{p.patient_id}) - {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* FOREIGN KEY 2: APPOINTMENT LINK REFERENCE CONTEXT DROPDOWN */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Appointment Reference (Optional)</label>
                <select 
                  className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800 disabled:bg-slate-50"
                  value={selectedAppointmentId} 
                  onChange={e => setSelectedAppointmentId(e.target.value)}
                  disabled={!!editingId || !selectedPatientId}
                >
                  <option value="">-- None (Walk-in Entry) --</option>
                  {filteredAppointments.map(app => (
                    <option key={app.appointment_id} value={app.appointment_id}>
                      Appt #{app.appointment_id} on {new Date(app.appointment_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                {selectedPatientId && filteredAppointments.length === 0 && !editingId && (
                  <span className="text-[10px] text-slate-400 mt-1 block italic font-medium">No active appointments found for this patient.</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Primary Diagnosis Verdict</label>
                <input 
                  type="text" 
                  placeholder="e.g., Acute Hypertension" 
                  className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900" 
                  value={diagnosis} 
                  onChange={e => setDiagnosis(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Clinical Assessment & Progress Notes</label>
                <textarea 
                  placeholder="Describe patient symptoms, evaluation summaries, physical assessment checks, or clinical observations..." 
                  className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-32 resize-none text-slate-900" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer">
                {editingId ? 'Save Assessment Changes' : 'Commit Medical Record'}
              </button>
            </form>
          )}
        </aside>

        {/* DATA CONTAINER WORKSPACE: CLINICAL HISTORY DATA GRID DISPLAY */}
        <main className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Historic Clinical Encounter Register</h3>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {historyLogs.length === 0 ? (
              <p className="text-center py-12 text-sm text-slate-400 font-medium">No clinical diagnostic records match this parameters index.</p>
            ) : (
              historyLogs.map((log) => (
                <div key={log.treatment_id} className="p-4 border rounded-xl bg-slate-50/50 border-slate-200/60 flex flex-col sm:flex-row justify-between items-start gap-4 hover:bg-white hover:shadow-md transition-all duration-200">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] bg-blue-50 text-blue-700 border border-blue-100 font-bold px-2 py-0.5 rounded-md">
                        LOG #{log.treatment_id}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 capitalize">{log.diagnosis}</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      <p>👤 Patient: <span className="text-slate-800 font-semibold">{log.patient_name}</span></p>
                      <p>🩺 Attending Clinician: <span className="text-slate-800 font-semibold">{log.doctor_name}</span></p>
                      {log.appointment_id && (
                        <p className="sm:col-span-2">📅 Linked Appointment ID: <span className="font-mono text-slate-700 font-bold">#{log.appointment_id}</span></p>
                      )}
                    </div>

                    {log.notes && (
                      <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100 italic font-normal text-justify">
                        "{log.notes}"
                      </div>
                    )}
                    
                    <span className="block text-[10px] font-mono text-slate-400">
                      Encounter Registered On: {new Date(log.treatment_date).toLocaleString()}
                    </span>
                  </div>

                  {/* Actions Context Control Row */}
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto justify-end">
                    {['Doctor', 'Nurse'].includes(role) && (
                      <button onClick={() => startEdit(log)} className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-100 transition-colors cursor-pointer text-center min-w-[70px]">
                        Edit
                      </button>
                    )}
                    {role === 'Admin' && (
                      <button onClick={() => handleDelete(log.treatment_id)} className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors cursor-pointer text-center min-w-[70px]">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

      </div>
    </div>
  );
};

export default TreatmentManager;