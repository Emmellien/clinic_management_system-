import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const PrescriptionManager = () => {
  const role = localStorage.getItem('role') || 'Guest';

  // System Core Records States
  const [prescriptions, setPrescriptions] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Interactive Form Inputs States
  const [editingId, setEditingId] = useState(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [quantity, setQuantity] = useState('');

  // Second medication line (bundle support)
  const [selectedMedicineId2, setSelectedMedicineId2] = useState('');
  const [quantity2, setQuantity2] = useState('');

  const [dosage, setDosage] = useState('');


  const getHeader = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  // Fetch running lists of issued medication scripts
  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/medical/prescribe', getHeader());
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed loading scripts catalog index entries:', err);
      setPrescriptions([]); // 404/500 safe-fallback protection block
    }
  }, [getHeader]);

  // Fetch Treatment Records to map out Foreign Key fields elegantly
  const fetchTreatments = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/treatments', getHeader());
      setTreatments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load clinical encounters list:', err);
      setTreatments([]); // 404/500 safe-fallback protection block
    }
  }, [getHeader]);

  // Fetch Medicine Stocks Catalogue to manage prescriptions logic
  const fetchMedicines = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/medicines', getHeader());
      setMedicines(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load hospital pharmacy inventory:', err);
      setMedicines([]); // 404/500 safe-fallback protection block
    }
  }, [getHeader]);

  useEffect(() => {
    fetchPrescriptions();
    fetchTreatments();
    fetchMedicines();
  }, [fetchPrescriptions, fetchTreatments, fetchMedicines]);

  // Read stock level metadata from the selected drug item line
  const activeMedicineDetails = medicines.find(m => m.medicine_id === parseInt(selectedMedicineId));
  const availableStockCount = activeMedicineDetails ? activeMedicineDetails.stock_quantity : 0;

  const activeMedicineDetails2 = medicines.find(m => m.medicine_id === parseInt(selectedMedicineId2));
  const availableStockCount2 = activeMedicineDetails2 ? activeMedicineDetails2.stock_quantity : 0;


  const resetForm = () => {
    setEditingId(null);
    setSelectedTreatmentId('');
    setSelectedMedicineId('');
    setQuantity('');

    setSelectedMedicineId2('');
    setQuantity2('');

    setDosage('');
  };


  // Submit Handler: Process script validation write parameters
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', isError: false });

    // Client-side verification fallback check
    if (!editingId) {
      if (parseInt(quantity) > availableStockCount) {
        setMsg({ text: `Cannot issue prescription. Medicine 1 requested amount exceeds available stock (${availableStockCount} items remaining).`, isError: true });
        return;
      }
      if (parseInt(quantity2) > availableStockCount2) {
        setMsg({ text: `Cannot issue prescription. Medicine 2 requested amount exceeds available stock (${availableStockCount2} items remaining).`, isError: true });
        return;
      }
    }

    const payload = {
      quantity: parseInt(quantity),
      dosage: dosage
    };


    try {
      if (editingId) {
        const res = await axios.put(`http://localhost:5000/api/medical/prescribe/${editingId}`, payload, getHeader());
        setMsg({ text: res.data.message, isError: false });
      } else {
        const createPayload = {
          treatment_id: parseInt(selectedTreatmentId),
          medicine_id_1: parseInt(selectedMedicineId),
          quantity_1: parseInt(quantity),
          medicine_id_2: parseInt(selectedMedicineId2),
          quantity_2: parseInt(quantity2),
          dosage: dosage
        };
        const res = await axios.post('http://localhost:5000/api/medical/prescribe-bundle', createPayload, getHeader());
        setMsg({ text: res.data.message, isError: false });
      }

      resetForm();
      fetchPrescriptions();
      fetchMedicines(); // Refresh stock metrics totals
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to complete this action.', isError: true });
    }
  };

  const startEdit = (script) => {
    setEditingId(script.prescription_id);
    setSelectedTreatmentId(script.treatment_id);
    setSelectedMedicineId(script.medicine_id);
    setQuantity(script.quantity);

    // bundle edit is not supported; keep second fields empty
    setSelectedMedicineId2('');
    setQuantity2('');

    setDosage(script.dosage);
  };


  const handleDelete = async (id) => {
    if (!window.confirm('Void out this prescription? This action will reverse allocated medication counts back into stock inventory balances.')) return;
    setMsg({ text: '', isError: false });

    try {
      const res = await axios.delete(`http://localhost:5000/api/medical/prescribe/${id}`, getHeader());
      setMsg({ text: res.data.message, isError: false });
      fetchPrescriptions();
      fetchMedicines();
      if (editingId === id) resetForm();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Access policy block constraint.', isError: true });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* COMPONENT HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pharmacy Prescription Console</h2>
          <p className="text-xs text-slate-500">Authorize medication scripts, adjust drug dispensation plans, and review history files.</p>
        </div>
        <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
          Security Group: {role}
        </span>
      </header>

      {/* CORE CONTROL SHEET WORKSPACE CONTAINER */}
      <div className="flex flex-1 p-6 gap-6">
        
        {/* INTERACTIVE FORM TERMINAL PANEL */}
        <aside className="w-full lg:w-96 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              {editingId ? '📝 Update Script Instructions' : '💊 New Medication Prescription'}
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
              🔒 Front desk administration credentials do not possess authorized clinical pharmacy dispensation rights.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* FOREIGN KEY SELECTOR 1: CLINICAL TREATMENT SUMMARY CASES LOOKUP */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Encounter Case Record</label>
                <select 
                  className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800 disabled:bg-slate-50"
                  value={selectedTreatmentId} 
                  onChange={e => setSelectedTreatmentId(e.target.value)} 
                  required 
                  disabled={!!editingId}
                >
                  <option value="">-- Select Patient Case Encounter --</option>
                  {treatments.map(t => (
                    <option key={t.treatment_id} value={t.treatment_id}>
                      {t.patient_name} — Diagnosed: {t.diagnosis} (Log #{t.treatment_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* FOREIGN KEY SELECTOR 2: INVENTORY MEDICINE ITEM CATALOG LOOKUP */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Required Medication Item</label>
                <select 
                  className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800 disabled:bg-slate-50"
                  value={selectedMedicineId} 
                  onChange={e => setSelectedMedicineId(e.target.value)} 
                  required 
                  disabled={!!editingId}
                >
                  <option value="">-- Select Drug Item from Stocks --</option>
                  {medicines.map(m => (
                    <option key={m.medicine_id} value={m.medicine_id}>
                      {m.name} ({m.stock_quantity} remaining on shelf)
                    </option>
                  ))}
                </select>
              </div>

              {/* QUANTITY CONSTRAINED NUMERIC INPUT */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Disbursement Unit Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  placeholder="Enter total units count number" 
                  className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 font-semibold" 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)} 
                  required 
                />
                {selectedMedicineId && !editingId && (
                  <div className={`text-[10px] mt-1 font-semibold flex justify-between ${parseInt(quantity) > availableStockCount ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
                    <span>Available Stock: {availableStockCount} units</span>
                    {parseInt(quantity) > availableStockCount && <span>⚠️ Deficit of {parseInt(quantity) - availableStockCount} units!</span>}
                  </div>
                )}
              </div>

              {/* DOSAGE STRINGS DELIVERY EXPLANATION FIELD */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Dosage Delivery Instructions</label>
                <input 
                  type="text" 
                  placeholder="e.g., Take 1 tablet three times daily after meals" 
                  className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900" 
                  value={dosage} 
                  onChange={e => setDosage(e.target.value)} 
                  required 
                />
              </div>

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-100 cursor-pointer">
                {editingId ? 'Modify Script Allocation' : 'Commit Script Authorization'}
              </button>
            </form>
          )}
        </aside>

        {/* COMPREHENSIVE OUTPATIENT HISTORICAL AUDIT DIRECTORY TABLE */}
        <main className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Active Outpatient Medical Orders Registry</h3>

          <div className="overflow-x-auto">
            {prescriptions.length === 0 ? (
              <p className="text-center py-12 text-sm text-slate-400 font-medium">No active prescription script files match the record registry lists.</p>
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
                    <tr key={script.prescription_id} className="hover:bg-slate-50/80 transition-colors duration-150">
                      <td className="p-3 font-mono text-blue-600 font-bold">#SCRIP-0{script.prescription_id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{script.patient_name}</div>
                        <div className="text-[10px] text-slate-400 font-normal truncate max-w-[160px]">
                          Case Assessment: <span className="italic font-medium text-slate-500">{script.associated_diagnosis}</span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {script.medicine_name}
                        <span className="block text-[10px] text-slate-400 font-normal font-mono">Deducted Amount: x{script.quantity} Units</span>
                      </td>
                      <td className="p-3 bg-slate-50/50 text-slate-700 font-mono font-bold border-x border-slate-100/60 max-w-[180px] truncate">{script.dosage}</td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {['Doctor', 'Nurse'].includes(role) && (
                          <button onClick={() => startEdit(script)} className="px-2.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-100 transition-colors cursor-pointer">
                            Modify
                          </button>
                        )}
                        {role === 'Admin' ? (
                          <button onClick={() => handleDelete(script.prescription_id)} className="px-2.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors cursor-pointer">
                            Void Order
                          </button>
                        ) : (
                          role === 'Receptionist' && <span className="text-slate-300 text-[10px] italic font-normal px-2">Restricted</span>
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

export default PrescriptionManager;