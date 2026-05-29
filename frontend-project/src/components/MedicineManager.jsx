import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const MedicineManager = () => {
  const role = localStorage.getItem('role') || 'Guest';
  const isEditor = ['Admin', 'Receptionist'].includes(role);

  // State Lists
  const [medicines, setMedicines] = useState([]);
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Form Inputs
  const [name, setName] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Edit mode
  const [editingId, setEditingId] = useState(null);

  const getHeader = useCallback(
    () => ({
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }),
    []
  );

  const fetchMedicines = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/medicines', getHeader());
      setMedicines(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load pharmacy stock:', err);
      setMedicines([]);
    }
  }, [getHeader]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setStockQuantity('');
    setUnitPrice('');
    setExpiryDate('');
  };

  // Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', isError: false });

    const payload = {
      name: name,
      stock_quantity: parseInt(stockQuantity),
      unit_price: parseFloat(unitPrice),
      expiry_date: expiryDate || null
    };

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/medicines/${editingId}`, payload, getHeader());
        setMsg({ text: '✅ Medicine updated successfully!', isError: false });
      } else {
        await axios.post('http://localhost:5000/api/medicines', payload, getHeader());
        setMsg({ text: '📦 Medicine added to stock catalog successfully!', isError: false });
      }

      resetForm();
      fetchMedicines();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to save inventory item.', isError: true });
    }
  };

  const handleEdit = (m) => {
    setEditingId(m.medicine_id);
    setName(m.name || '');
    setStockQuantity(m.stock_quantity ?? '');
    setUnitPrice(m.unit_price ?? '');
    setExpiryDate(m.expiry_date ? String(m.expiry_date) : '');
    setMsg({ text: '', isError: false });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine?')) return;
    setMsg({ text: '', isError: false });
    try {
      await axios.delete(`http://localhost:5000/api/medicines/${id}`, getHeader());
      setMsg({ text: '🗑️ Medicine deleted.', isError: false });
      fetchMedicines();
      resetForm();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to delete medicine.', isError: true });
    }
  };

  const downloadDailyReport = () => {
    // Browser download: endpoint is protected by JWT, so we attach token as Authorization header via query is not possible.
    // Use current token in URL via query param is not secure, so instead we trigger download through fetch + blob.
    const token = localStorage.getItem('token');
    if (!token) {
      setMsg({ text: 'Session expired. Please login again.', isError: true });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    axios
      .get(`http://localhost:5000/api/medicine-reports/daily?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-medicines-report-${today}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        setMsg({ text: err.response?.data?.message || 'Failed to download daily report.', isError: true });
      });
  };

  return (
    <div className="space-y-6">
      {msg.text && (
        <div className={`p-4 rounded-xl border text-sm font-semibold shadow-sm ${msg.isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* ADD / EDIT MEDICINE FORM */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 border-b pb-2">
            {editingId ? '✏️ Edit Medicine' : '📦 Stock New Medication'}
          </h3>

          {!isEditor ? (
            <div className="bg-slate-50 border border-dashed rounded-xl p-4 text-center text-xs text-slate-500">
              🔒 Editing medicine inventory database stock records is restricted to system managers.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Medicine Name</label>
                <input type="text" placeholder="e.g. Paracetamol, Amoxicillin" className="w-full border rounded-xl p-2.5 text-sm text-slate-900" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Boxes</label>
                  <input type="number" min="0" placeholder="Quantity" className="w-full border rounded-xl p-2.5 text-sm text-slate-900" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unit Price ($)</label>
                  <input type="number" min="0" step="0.01" placeholder="Price per unit" className="w-full border rounded-xl p-2.5 text-sm text-slate-900" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiry Date</label>
                <input type="date" className="w-full border rounded-xl p-2.5 text-sm text-slate-900" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer">
                  {editingId ? 'Update Medicine' : 'Save to Inventory Catalog'}
                </button>

                {editingId && (
                  <button type="button" onClick={resetForm} className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition-all border border-slate-200 cursor-pointer">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* PHARMACY SHELVES VIEW */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3 border-b pb-3">
            <h3 className="text-base font-bold text-slate-800">Clinic Pharmacy Cupboard Inventory</h3>

            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={downloadDailyReport}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer"
              >
                ⬇️ Download Daily Report
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {medicines.length === 0 ? (
              <p className="text-center py-12 text-sm text-slate-400 font-medium">The medicines table ledger is completely empty. Register stock on the left panel.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-3">Drug ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Quantity Left</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3">Expiry Date</th>
                    {isEditor && <th className="p-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {medicines.map((m) => (
                    <tr key={m.medicine_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-blue-600 font-bold">#{m.medicine_id}</td>
                      <td className="p-3 font-semibold text-slate-900">{m.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${m.stock_quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>
                          {m.stock_quantity} units
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">${parseFloat(m.unit_price).toFixed(2)}</td>
                      <td className="p-3 text-slate-400 font-mono">{m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : 'N/A'}</td>
                      {isEditor && (
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleEdit(m)} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-bold cursor-pointer">
                              Edit
                            </button>
                            <button type="button" onClick={() => handleDelete(m.medicine_id)} className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-700 text-xs font-bold cursor-pointer">
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
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

export default MedicineManager;

