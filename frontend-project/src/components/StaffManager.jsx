import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const StaffManager = () => {
  const [staffList, setStaffList] = useState([]);
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Form Management States
  const [editingId, setEditingId] = useState(null);
  const [stfName, setStfName] = useState('');
  const [stfEmail, setStfEmail] = useState('');
  const [stfPass, setStfPass] = useState(''); // Kept optional during profile updates
  const [stfPhone, setStfPhone] = useState('');
  const [stfRole, setStfRole] = useState('Receptionist');

  const getHeader = useCallback(() => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), []);

  // Fetch all staff accounts
  const fetchStaff = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/staff', getHeader());
      setStaffList(res.data);
    } catch (err) {
      console.error('Failed to collect staff matrix details:', err);
    }
  }, [getHeader]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const resetForm = () => {
    setEditingId(null);
    setStfName('');
    setStfEmail('');
    setStfPass('');
    setStfPhone('');
    setStfRole('Receptionist');
  };

  // Submit Logic: Create or Update Data Rows
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ text: '', isError: false });

    const payload = { 
      full_name: stfName, 
      email: stfEmail, 
      role: stfRole, 
      phone: stfPhone,
      password: stfPass 
    };

    try {
      if (editingId) {
        // Run PUT Update request
        const res = await axios.put(`http://localhost:5000/api/staff/${editingId}`, payload, getHeader());
        setMsg({ text: `⚙️ ${res.data.message}`, isError: false });
      } else {
        // Run POST Create registration request
        if (!stfPass) {
            setMsg({ text: 'Password field is mandatory for new staff registration.', isError: true });
            return;
        }
        const res = await axios.post('http://localhost:5000/api/staff/register', payload, getHeader());
        setMsg({ text: `🎉 ${res.data.message}!`, isError: false });
      }
      resetForm();
      fetchStaff();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Failed to complete server operation.', isError: true });
    }
  };

  // Populate form fields for modification
  const startEdit = (member) => {
    setEditingId(member.user_id);
    setStfName(member.full_name);
    setStfEmail(member.email);
    setStfPhone(member.phone || '');
    setStfRole(member.role);
    setStfPass(''); // Left blank unless resetting their password explicitly
  };

  // Handle privilege revocation / Account purge
  const handleDelete = async (id) => {
    if (!window.confirm('Revoke all database permissions and delete this employee profile permanently?')) return;
    setMsg({ text: '', isError: false });

    try {
      const res = await axios.delete(`http://localhost:5000/api/staff/${id}`, getHeader());
      setMsg({ text: `🗑️ ${res.data.message}`, isError: false });
      fetchStaff();
      if (editingId === id) resetForm();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Deletions error.', isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {msg.text && (
        <div className={`p-4 rounded-xl border text-sm font-semibold shadow-sm transition-all ${msg.isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-indigo-50 border-indigo-200 text-indigo-800'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: STAFF MANAGEMENT CONSOLE FORM */}
        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h3 className="text-base font-bold text-slate-800">
              {editingId ? '📝 Edit Account Profile' : '🛠️ Provision Credentials'}
            </h3>
            {editingId && (
              <button onClick={resetForm} className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline">
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Employee Full Name</label>
              <input type="text" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={stfName} onChange={e => setStfName(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Email Endpoint (Login ID)</label>
              <input type="email" placeholder="name@hopeclinic.com" className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={stfEmail} onChange={e => setStfEmail(e.target.value)} required />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                {editingId ? 'New Password (Leave Blank to Keep Current)' : 'System Account Password'}
              </label>
              <input type="password" placeholder={editingId ? '••••••••' : 'Enter temporary password'} className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={stfPass} onChange={e => setStfPass(e.target.value)} required={!editingId} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Phone Line Extension</label>
              <input type="text" className="w-full border rounded-xl p-2.5 text-sm" value={stfPhone} onChange={e => setStfPhone(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Access Authorization Level (Enum)</label>
              <select className="w-full border rounded-xl p-2.5 text-sm focus:outline-none" value={stfRole} onChange={e => setStfRole(e.target.value)}>
                <option value="Receptionist">Receptionist</option>
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <button type="submit" className={`w-full py-2.5 text-white font-semibold rounded-xl text-sm transition-all shadow-md cursor-pointer ${editingId ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}>
              {editingId ? 'Update Access Configuration' : 'Authorize & Provision Staff'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: STAFF MEMBERS LISTING DIRECTORY */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 border-b pb-3">Active Clinic Accounts Registry</h3>

          <div className="overflow-x-auto">
            {staffList.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400 font-medium">No personnel database matches recorded.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-3">User ID</th>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Security Role</th>
                    <th className="p-3">Phone Line</th>
                    <th className="p-3 text-right">System Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {staffList.map((member) => (
                    <tr key={member.user_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono text-indigo-600 font-bold">#UID-{member.user_id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{member.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{member.email}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                          member.role === 'Admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          member.role === 'Doctor' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          member.role === 'Nurse' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{member.phone || '—'}</td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button onClick={() => startEdit(member)} className="px-2.5 py-1 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded border border-amber-100 transition-colors cursor-pointer">
                          Modify
                        </button>
                        <button onClick={() => handleDelete(member.user_id)} className="px-2.5 py-1 text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-100 transition-colors cursor-pointer">
                          Revoke
                        </button>
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

export default StaffManager;