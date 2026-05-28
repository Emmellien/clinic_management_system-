import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const PaymentManager = () => {
  const role = localStorage.getItem('role') || 'Guest';

  // State Stores
  const [ledgerLogs, setLedgerLogs] = useState([]);
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Invoice Fields Management
  const [editingId, setEditingId] = useState(null);
  const [patId, setPatId] = useState('');
  const [amount, setAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');

  const getHeader = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  // Fetch complete audit ledger lists
  const fetchLedger = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/payments', getHeader());
      setLedgerLogs(res.data);
    } catch (err) {
      console.error('Failed loading payment sheets:', err);
    }
  }, [getHeader]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const resetForm = () => {
    setEditingId(null);
    setPatId('');
    setAmount('');
    setPayMethod('Cash');
  };

  // Submit Logic: Commit payment logs or modify records
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', isError: false });

    const payload = {
      amount: parseFloat(amount),
      payment_method: payMethod
    };

    try {
      if (editingId) {
        // Run PUT Update request
        const res = await axios.put(`http://localhost:5000/api/payments/${editingId}`, payload, getHeader());
        setMsg({ text: `✨ ${res.data.message}`, isError: false });
      } else {
        // Run POST Create new ledger receipt item
        const res = await axios.post('http://localhost:5000/api/payments', { ...payload, patient_id: parseInt(patId) }, getHeader());
        setMsg({ text: `🎉 ${res.data.message}`, isError: false });
      }
      resetForm();
      fetchLedger();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Unauthorized action level.', isError: true });
    }
  };

  // Set selected item context targets into the modify input window fields
  const startEdit = (item) => {
    setEditingId(item.payment_id);
    setPatId(item.patient_id);
    setAmount(item.amount);
    setPayMethod(item.payment_method);
  };

  // Purge incorrect entry line (Locked to Master Admin role only)
  const handleDelete = async (id) => {
    if (!window.confirm('Are you authorized to drop this payment receipt log from standard audit registries?')) return;
    setMsg({ text: '', isError: false });

    try {
      const res = await axios.delete(`http://localhost:5000/api/payments/${id}`, getHeader());
      setMsg({ text: `🗑️ ${res.data.message}`, isError: false });
      fetchLedger();
      if (editingId === id) resetForm();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Deletions error access check.', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Response Action Message Banner */}
      {msg.text && (
        <div className={`p-4 rounded-xl border text-sm font-semibold shadow-sm transition-all ${msg.isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* VIEW COLUMN 1: INTERACTIVE BILLING INPUT MODULE FORM */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-base font-bold text-slate-800">
              {editingId ? '📝 Adjust Remittance Link' : '💰 Post Payment Record'}
            </h3>
            {editingId && (
              <button onClick={resetForm} className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline">
                Cancel Edit
              </button>
            )}
          </div>

          {!['Receptionist', 'Admin'].includes(role) ? (
            <div className="bg-slate-50 border border-dashed rounded-xl p-4 text-center text-xs text-slate-500">
              🔒 Clinical doctor and nurse accounts do not possess standard accounting ledger access permissions.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Target Patient Database ID</label>
                <input type="number" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50 text-slate-500 font-mono" value={patId} onChange={e => setPatId(e.target.value)} required disabled={!!editingId} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Remittance Amount Value (RWF)</label>
                <input type="number" placeholder="0.00" step="0.01" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 font-bold" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Remittance Payment Method Channel (Enum)</label>
                <select className="w-full border rounded-xl p-2.5 text-sm focus:outline-none bg-white" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Card">Card</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-50 cursor-pointer">
                {editingId ? 'Modify Remittance Variables' : 'Commit Remittance Line'}
              </button>
            </form>
          )}
        </div>

        {/* VIEW COLUMN 2 & 3: CONTINUOUS STREAMING AUDIT LEDGER DIRECTORY TABLE */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 border-b pb-3">Financial Transaction Audit Streams</h3>

          <div className="overflow-x-auto">
            {ledgerLogs.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400 font-medium">No ledger sheets matches recorded in system cache slots.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-3">Receipt code</th>
                    <th className="p-3">Account Holder Name</th>
                    <th className="p-3">Remittance Method</th>
                    <th className="p-3">Amount Value</th>
                    <th className="p-3 text-right">Ledger Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {ledgerLogs.map((log) => (
                    <tr key={log.payment_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-emerald-700 font-bold">#PAY-0{log.payment_id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{log.patient_name}</div>
                        <div className="text-[10px] text-slate-400 font-normal font-mono">ID ref: #{log.patient_id} • {new Date(log.payment_date).toLocaleDateString()}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border tracking-wide uppercase ${
                          log.payment_method === 'Cash' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          log.payment_method === 'Mobile Money' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          log.payment_method === 'Card' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          'bg-purple-50 text-purple-700 border-purple-100'
                        }`}>
                          {log.payment_method}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-900 font-bold text-sm">
                        {parseFloat(log.amount).toLocaleString()} RWF
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {['Receptionist', 'Admin'].includes(role) && (
                          <button onClick={() => startEdit(log)} className="px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-100 transition-colors cursor-pointer">
                            Adjust
                          </button>
                        )}
                        {role === 'Admin' ? (
                          <button onClick={() => handleDelete(log.payment_id)} className="px-2.5 py-1 text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-100 transition-colors cursor-pointer">
                            Drop row
                          </button>
                        ) : (
                          role === 'Receptionist' && <span className="text-slate-300 text-[10px] italic">No deletion tier</span>
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

export default PaymentManager;