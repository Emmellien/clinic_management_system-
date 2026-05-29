import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const MedicineManager = () => {
  const role = localStorage.getItem('role') || 'Guest';

  // State Lists
  const [medicines, setMedicines] = useState([]);
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Form Inputs
  const [name, setName] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const getHeader = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  // Fetch items in database stock
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

  // Handle adding new drugs to empty table cupboard inventory
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
      await axios.post('http://localhost:5000/api/medicines', payload, getHeader());
      setMsg({ text: '📦 Medicine added to stock catalog successfully!', isError: false });
      
      setName('');
      setStockQuantity('');
      setUnitPrice('');
      setExpiryDate('');
      
      fetchMedicines();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to save inventory item.', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {msg.text && (
        <div className={`p-4 rounded-xl border text-sm font-semibold shadow-sm ${msg.isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* ADD MEDICINE FORM */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 border-b pb-2">📦 Stock New Medication</h3>

          {!['Admin', 'Receptionist'].includes(role) ? (
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

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer">
                Save to Inventory Catalog
              </button>
            </form>
          )}
        </div>

        {/* PHARMACY SHELVES VIEW */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 border-b pb-3">Clinic Pharmacy Cupboard Inventory</h3>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {medicines.map((m) => (
                    <tr key={m.medicine_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-blue-600 font-bold">#MED-0{m.medicine_id}</td>
                      <td className="p-3 font-semibold text-slate-900">{m.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${m.stock_quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>
                          {m.stock_quantity} units
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-900">${parseFloat(m.unit_price).toFixed(2)}</td>
                      <td className="p-3 text-slate-400 font-mono">{m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : 'N/A'}</td>
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