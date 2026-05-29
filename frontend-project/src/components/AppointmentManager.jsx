import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AppointmentManager = () => {
  const role = localStorage.getItem('role') || 'Guest';

  // System Lists States
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]); 
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Form Inputs
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');

  const getHeader = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/appointments', getHeader());
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch appointments registry:', err);
      setAppointments([]);
    }
  }, [getHeader]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/patients', getHeader());
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch patients lookup list:', err);
    }
  }, [getHeader]);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users?role=Doctor', getHeader());
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load doctors catalog:', err);
    }
  }, [getHeader]);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
  }, [fetchAppointments, fetchPatients, fetchDoctors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', isError: false });

    const payload = {
      patient_id: parseInt(selectedPatientId),
      doctor_id: parseInt(selectedDoctorId),
      appointment_date: appointmentDate
    };

    try {
      await axios.post('http://localhost:5000/api/appointments', payload, getHeader());
      setMsg({ text: 'Appointment booked successfully!', isError: false });
      setSelectedPatientId('');
      setSelectedDoctorId('');
      setAppointmentDate('');
      fetchAppointments();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to complete booking entry.', isError: true });
    }
  };

  // NEW ACTION: Update dynamic status changes (Scheduled -> Completed / Cancelled)
  const handleUpdateStatus = async (appointmentId, nextStatus) => {
    setMsg({ text: '', isError: false });
    try {
      await axios.put(`http://localhost:5000/api/appointments/${appointmentId}`, { status: nextStatus }, getHeader());
      setMsg({ text: `Status updated to ${nextStatus}!`, isError: false });
      fetchAppointments();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to update appointment parameters.', isError: true });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Clinic Appointment Desk</h2>
          <p className="text-xs text-slate-500">Manage appointment rows, update states, and balance staff calendar pipelines.</p>
        </div>
      </header>

      <div className="flex flex-1 p-6 gap-6 flex-col lg:flex-row">
        
        {/* BOOKING INTERFACE */}
        <aside className="w-full lg:w-96 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b pb-3">📅 Add Calendar Event</h3>

          {msg.text && (
            <div className={`p-3 rounded-xl border text-xs font-semibold ${msg.isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
              {msg.text}
            </div>
          )}

          {!['Receptionist', 'Admin'].includes(role) ? (
            <div className="bg-slate-50 border border-dashed rounded-xl p-4 text-center text-xs text-slate-400 font-medium">
              🔒 Scheduling fields are locked to front office personnel.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Patient</label>
                <select className="w-full border rounded-xl p-2.5 text-sm bg-white" value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)} required>
                  <option value="">-- Select Profile --</option>
                  {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.full_name} (ID: #{p.patient_id})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Clinician</label>
                <select className="w-full border rounded-xl p-2.5 text-sm bg-white" value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)} required>
                  <option value="">-- Select Staff Doctor --</option>
                  {doctors.map(d => <option key={d.user_id} value={d.user_id}>Dr. {d.full_name || d.username}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Calendar Date</label>
                <input type="datetime-local" className="w-full border rounded-xl p-2.5 text-sm bg-white" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} required />
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-sm">
                Book Visit Entry
              </button>
            </form>
          )}
        </aside>

        {/* REGISTRY MONITOR VIEW */}
        <main className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b pb-3">Active Waiting Queues</h3>
          <div className="overflow-x-auto">
            {appointments.length === 0 ? (
              <p className="text-center py-12 text-sm text-slate-400 font-medium">No open appointment rows found inside database tables.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                    <th className="p-3">Reference Code</th>
                    <th className="p-3">Patient Row Link</th>
                    <th className="p-3">Target Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Status Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {appointments.map((app) => (
                    <tr key={app.appointment_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-mono text-blue-600 font-bold">#APPT-0{app.appointment_id}</td>
                      <td className="p-3 text-slate-900">Patient Identifier: #{app.patient_id}</td>
                      <td className="p-3 font-mono text-slate-600">{new Date(app.appointment_date).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          app.status === 'Completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          app.status === 'Cancelled' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {app.status || 'Scheduled'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {app.status === 'Scheduled' && ['Receptionist', 'Admin', 'Doctor'].includes(role) && (
                          <>
                            <button onClick={() => handleUpdateStatus(app.appointment_id, 'Completed')} className="px-2 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded font-bold cursor-pointer">
                              Complete
                            </button>
                            <button onClick={() => handleUpdateStatus(app.appointment_id, 'Cancelled')} className="px-2 py-1 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded font-bold cursor-pointer">
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>

      </div>
    </div>
  );
};

export default AppointmentManager;