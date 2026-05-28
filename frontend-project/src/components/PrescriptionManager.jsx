import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const PrescriptionManager = () => {
  const role = localStorage.getItem('role') || 'Guest';

  // Component Core States
  const [prescriptions, setPrescriptions] = useState([]);
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Form Fields State
  const [editingId, setEditingId] = useState(null);
  const [treatmentId, setTreatmentId] = useState('');
  const [medicineId, setMedicineId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [dosage, setDosage] = useState('');

  const getHeader = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  // Fetch running lists of issued medication scripts
  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/medical/prescribe', getHeader());
      setPrescriptions(res.data);
    } catch (err) {
      console.error('Failed loading scripts catalog index entries:', err);
    }
  }, [getHeader]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const resetForm = () => {
    setEditingId(null);
    setTreatmentId('');
    setMedicineId('');
    setQuantity('');
    setDosage('');
  };

  // Submit Handler: Process order write/updates
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', isError: false });

    const payload = {
      quantity: parseInt(quantity),
      dosage: dosage
    };

    try {
      if (editingId) {
        // Run PUT Update request
        const res = await axios.put(`http://localhost:5000/api/medical/prescribe/${editingId}`, payload, getHeader());
        setMsg({ text: `✨ ${res.data.message}`, isError: false });
      } else {
        // Run POST Create request
        const createPayload = { 
          ...payload, 
          treatment_id: parseInt(treatmentId), 
          medicine_id: parseInt(medicineId) 
        };
        const res = await axios.post('http://localhost:5000/api/medical/prescribe', createPayload, getHeader());
        setMsg({ text: `🎉 ${res.data.message}`, isError: false });
      }
      resetForm();
      fetchPrescriptions();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Action execution block constraint matched.', isError: true });
    }
  };

  // Load prescription entry properties inside standard form fields for edits
  const startEdit = (script) => {
    setEditingId(script.prescription_id);
    setTreatmentId(script.treatment_id);
    setMedicineId(script.medicine_id);
    setQuantity(script.quantity);
    setDosage(script.dosage);
  };

  // Void out order line row (Admin Clearance verification security pass check)
  const handleDelete = async (id) => {
    if (!window.confirm('Void out this active medicine prescription order line row? This will return stock levels back to catalog balances.')) return;
    setMsg({ text: '', isError: false });

    try {
      const res = await axios.delete(`http://localhost:5000/api/medical/prescribe/${id}`, getHeader());
      setMsg({ text: `🗑️ ${res.data.message}`, isError: false });
      fetchPrescriptions();
      if (editingId === id) resetForm();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Access Policy Denied.', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Response Display Strip Banner */}
      {msg.text && (
        <div className={`p-4 rounded-xl border text-sm font-semibold shadow-sm transition-all ${msg.isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* VIEW BOX PANEL 1: INTERACTIVE PRESCRIPTION DISBURSEMENT FORM TERMINAL */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-base font-bold text-slate-800">
              {editingId ? '📝 Edit script instructions' : '💊 Issue Medicine Prescription'}
            </h3>
            {editingId && (
              <button onClick={resetForm} className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline">
                Cancel Edit
              </button>
            )}
          </div>

          {['Receptionist'].includes(role) ? (
            <div className="bg-slate-50 border border-dashed rounded-xl p-4 text-center text-xs text-slate-500">
              🔒 Front desk routing staff profiles do not possess pharmacy script authorization clearances.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Encounter Treatment ID Link</label>
                <input type="number" placeholder="Refer to clinical view codes" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 text-slate-500 font-mono" value={treatmentId} onChange={e => setTreatmentId(e.target.value)} required disabled={!!editingId} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Catalog Medicine Item ID</label>
                <input type="number" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 text-slate-500 font-mono" value={medicineId} onChange={e => setMedicineId(e.target.value)} required disabled={!!editingId} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Disbursement Quantity Count Units</label>
                <input type="number" placeholder="e.g. 15" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-semibold" value={quantity} onChange={e => setQuantity(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Dosage Delivery Instructions</label>
                <input type="text" placeholder="e.g. 1x3 daily for 5 days" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={dosage} onChange={e => setDosage(e.target.value)} required />
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer">
                {editingId ? 'Modify Script Line Parameters' : 'Commit Script to Patient Chart'}
              </button>
            </form>
          )}
        </div>

        {/* VIEW BOX PANEL 2 & 3: COMPREHENSIVE OUTPATIENTS SCRIPTS DIRECTORY RECORDS */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 border-b pb-3">Active Outpatient Medical Orders Registry</h3>

          <div className="overflow-x-auto">
            {prescriptions.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400 font-medium">No scripts orders matched in database registers.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-3">Script Ref Code</th>
                    <th className="p-3">Patient Profile & Case Diagnosis</th>
                    <th className="p-3">Allocated Medication</th>
                    <th className="p-3">Dosage Instructions</th>
                    <th className="p-3 text-right">System Configuration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {prescriptions.map((script) => (
                    <tr key={script.prescription_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-blue-600 font-bold">#SCRIP-0{script.prescription_id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{script.patient_name}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate max-w-[160px]">
                          Diag: <span className="italic">{script.associated_diagnosis}</span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {script.medicine_name}
                        <span className="block text-[10px] text-slate-400 font-normal font-mono">Deducted: x{script.quantity} Units</span>
                      </td>
                      <td className="p-3 bg-slate-50/50 text-slate-600 font-mono font-bold border-x border-slate-100/60">{script.dosage}</td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {['Doctor', 'Nurse'].includes(role) && (
                          <button onClick={() => startEdit(script)} className="px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-100 transition-colors cursor-pointer">
                            Modify
                          </button>
                        )}
                        {role === 'Admin' ? (
                          <button onClick={() => handleDelete(script.prescription_id)} className="px-2.5 py-1 text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-100 transition-colors cursor-pointer">
                            Void order
                          </button>
                        ) : (
                          role === 'Receptionist' && <span className="text-slate-300 text-[10px] italic">No Access</span>
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

export default PrescriptionManager;