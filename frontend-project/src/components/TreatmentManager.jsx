import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getRoleFromToken } from '../utils/auth';

const TreatmentManager = () => {
  const roleFromToken = getRoleFromToken();
  const role = roleFromToken || localStorage.getItem('role') || 'Guest';

  // State Lists
  const [treatments, setTreatments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Form Inputs
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  const getHeader = useCallback(
    () => ({
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
    []
  );

  // Fetch all saved checkups
  const fetchTreatments = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/treatments', getHeader());
      setTreatments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load checkups:', err);
      setTreatments([]);
    }
  }, [getHeader]);

  // Fetch Patients for dropdown menu selection
  const fetchPatients = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/patients', getHeader());
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load patients:', err);
    }
  }, [getHeader]);

  // Fetch Doctors for dropdown menu selection
  const fetchDoctors = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users?role=Doctor', getHeader());
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  }, [getHeader]);

  useEffect(() => {
    fetchTreatments();
    fetchPatients();
    fetchDoctors();
  }, [fetchTreatments, fetchPatients, fetchDoctors]);

  // Save a new medical checkup session
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', isError: false });

    const payload = {
      patient_id: parseInt(selectedPatientId),
      doctor_id: parseInt(selectedDoctorId),
      diagnosis: diagnosis,
      notes: notes
    };

    try {
      await axios.post('http://localhost:5000/api/treatments', payload, getHeader());
      setMsg({ text: '🎉 Checkup results saved successfully!', isError: false });

      // Clear input boxes
      setSelectedPatientId('');
      setSelectedDoctorId('');
      setDiagnosis('');
      setNotes('');

      // Refresh database table view
      fetchTreatments();
    } catch (err) {
      setMsg({
        text: err.response?.data?.message || 'Failed to save checkup data (check your account role).',
        isError: true
      });
    }
  };

  return (
    <div className="space-y-6">
      {msg.text && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold shadow-sm ${
            msg.isError
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 border-b pb-2">🩺 Log Doctor's Checkup</h3>

          {!['Doctor', 'Nurse', 'Admin'].includes(role) ? (
            <div className="bg-slate-50 border border-dashed rounded-xl p-4 text-center text-xs text-slate-500">
              🔒 Medical records writing permissions are limited to clinical Doctors and Nursing staff.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patient Name</label>
                <select
                  className="w-full border rounded-xl p-2.5 text-sm text-slate-900 bg-white"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  required
                >
                  <option value="">-- Select Patient Profile --</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.full_name} (ID: #{p.patient_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Attending Doctor</label>
                <select
                  className="w-full border rounded-xl p-2.5 text-sm text-slate-900 bg-white"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  required
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.user_id} value={d.user_id}>
                      Dr. {d.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Illness / Diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g. Malaria, Flu, Hypertension"
                  className="w-full border rounded-xl p-2.5 text-sm text-slate-900"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Clinical Notes & Findings</label>
                <textarea
                  rows="3"
                  placeholder="Type symptoms, temperature readings, or advice here..."
                  className="w-full border rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer"
              >
                Save Checkup Record
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 border-b pb-3">History Database Logs</h3>

          <div className="overflow-x-auto">
            {treatments.length === 0 ? (
              <p className="text-center py-12 text-sm text-slate-400 font-medium">
                No medical diagnostic charts found inside database history logs.
              </p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-3">Log ID</th>
                    <th className="p-3">Patient ID</th>
                    <th className="p-3">Diagnosis Summary</th>
                    <th className="p-3">Doctor Notes</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {treatments.map((t) => (
                    <tr key={t.treatment_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-blue-600 font-bold">#TRT-{t.treatment_id}</td>
                      <td className="p-3 font-semibold text-slate-900">Patient #{t.patient_id}</td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-semibold">
                          {t.diagnosis}
                        </span>
                      </td>
                      <td
                        className="p-3 max-w-[200px] truncate text-slate-500 italic"
                        title={t.notes}
                      >
                        {t.notes || 'No notes logged.'}
                      </td>
                      <td className="p-3 text-slate-400 font-mono">
                        {new Date(t.treatment_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentManager;

