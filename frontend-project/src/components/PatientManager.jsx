import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const PatientManager = () => {
  const role = localStorage.getItem('role') || 'Guest';
  
  // List & Search Data States
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Form Field States
  const [editingId, setEditingId] = useState(null); // Keeps track if we are Updating vs Creating
  const [pName, setPName] = useState('');
  const [pGender, setPGender] = useState('Male');
  const [pAge, setPAge] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pAddress, setPAddress] = useState('');

  const getHeader = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  // Fetch Patients List
  const fetchPatients = useCallback(async () => {
    try {
      const url = searchTerm 
        ? `http://localhost:5000/api/patients?term=${encodeURIComponent(searchTerm)}`
        : 'http://localhost:5000/api/patients';
      const res = await axios.get(url, getHeader());
      setPatients(res.data);
    } catch (err) {
      console.error('Failed fetching data rows:', err);
    }
  }, [searchTerm, getHeader]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Handle Form Clear
  const resetForm = () => {
    setEditingId(null);
    setPName('');
    setPGender('Male');
    setPAge('');
    setPPhone('');
    setPAddress('');
  };

  // Create OR Update Submit Execution Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', isError: false });
    
    const payload = { full_name: pName, gender: pGender, age: parseInt(pAge), phone: pPhone, address: pAddress };

    try {
      if (editingId) {
        // Run PUT Update request
        const res = await axios.put(`http://localhost:5000/api/patients/${editingId}`, payload, getHeader());
        setMsg({ text: `✨ ${res.data.message}`, isError: false });
      } else {
        // Run POST Create request
        const res = await axios.post('http://localhost:5000/api/patients', payload, getHeader());
        setMsg({ text: `🎉 Patient registered successfully! Assigned ID: ${res.data.patient_id}`, isError: false });
      }
      resetForm();
      fetchPatients();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Transaction could not be authorized.', isError: true });
    }
  };

  // Populates data inputs automatically for modification
  const startEdit = (patient) => {
    setEditingId(patient.patient_id);
    setPName(patient.full_name);
    setPGender(patient.gender);
    setPAge(patient.age);
    setPPhone(patient.phone);
    setPAddress(patient.address || '');
  };

  // Handle Delete Action Requests
  const handleDelete = async (id) => {
    if (!window.confirm('Are you absolutely certain you want to purge this patient file?')) return;
    setMsg({ text: '', isError: false });

    try {
      const res = await axios.delete(`http://localhost:5000/api/patients/${id}`, getHeader());
      setMsg({ text: `🗑️ ${res.data.message}`, isError: false });
      fetchPatients();
      if (editingId === id) resetForm();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Access Denied.', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Feedback Notification Ribbon */}
      {msg.text && (
        <div className={`p-4 rounded-xl border text-sm font-semibold shadow-sm transition-all ${msg.isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* COLUMN 1: INTERACTIVE FORM CONSOLE (Locked for Doctors/Nurses) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-base font-bold text-slate-800">
              {editingId ? '📝 Edit Patient Profile' : '👥 Intake Registration'}
            </h3>
            {editingId && (
              <button onClick={resetForm} className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline">
                Cancel Edit
              </button>
            )}
          </div>

          {['Doctor', 'Nurse'].includes(role) ? (
            <div className="bg-slate-50 border border-dashed rounded-xl p-4 text-center text-xs text-slate-500">
              🔒 Your clinical account permissions grant read-only directory tracking rights. Demographics updating is restricted.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Patient Full Name</label>
                <input type="text" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={pName} onChange={e => setPName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Gender</label>
                  <select className="w-full border rounded-xl p-2.5 text-sm focus:outline-none" value={pGender} onChange={e => setPGender(e.target.value)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Age</label>
                  <input type="number" className="w-full border rounded-xl p-2.5 text-sm" value={pAge} onChange={e => setPAge(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Phone Number</label>
                <input type="text" className="w-full border rounded-xl p-2.5 text-sm" value={pPhone} onChange={e => setPPhone(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Residential Address</label>
                <input type="text" className="w-full border rounded-xl p-2.5 text-sm" value={pAddress} onChange={e => setPAddress(e.target.value)} />
              </div>
              <button type="submit" className={`w-full py-2.5 text-white font-semibold rounded-xl text-sm transition-all shadow-sm cursor-pointer ${editingId ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}>
                {editingId ? 'Commit Update Patch' : 'Save Intake File'}
              </button>
            </form>
          )}
        </div>

        {/* COLUMN 2 & 3: LIVE DATABASE PATIENTS DIRECTORY TABLE */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <h3 className="text-base font-bold text-slate-800">Clinic Registry Files Directory</h3>
            {/* Search Box */}
            <input 
              type="text" 
              placeholder="🔍 Search name or phone line..." 
              className="border rounded-xl px-3 py-1.5 text-xs w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            {patients.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400 font-medium">No registered patient metrics match query arguments.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-3">ID</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Demographics</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3 text-right">System Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {patients.map((p) => (
                    <tr key={p.patient_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-blue-600 font-bold">#{p.patient_id}</td>
                      <td className="p-3 font-semibold text-slate-900">{p.full_name}</td>
                      <td className="p-3">{p.gender} ({p.age} yrs)</td>
                      <td className="p-3">{p.phone}</td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {/* Edit Access (Receptionists & Admins Only) */}
                        {['Receptionist', 'Admin'].includes(role) && (
                          <button onClick={() => startEdit(p)} className="px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-100 transition-colors cursor-pointer">
                            Edit
                          </button>
                        )}
                        {/* Permanent Purge Access (Admin Only Role Protection Check) */}
                        {role === 'Admin' ? (
                          <button onClick={() => handleDelete(p.patient_id)} className="px-2.5 py-1 text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-100 transition-colors cursor-pointer">
                            Delete
                          </button>
                        ) : (
                          role === 'Receptionist' && <span className="text-slate-300 text-[10px] italic">Locked</span>
                        )}
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

export default PatientManager;