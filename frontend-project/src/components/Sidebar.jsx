import React from 'react';

function Sidebar({ activeTab, setActiveTab, currentRole, onLogout, onCloseMobile }) {
  // Styles for the navigation buttons
  const itemClass = (tab) =>
    `w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
      activeTab === tab
        ? tab === 'staff'
          ? 'bg-purple-600 text-white shadow-md shadow-purple-100'
          : 'bg-blue-600 text-white shadow-md shadow-blue-100'
        : tab === 'staff'
          ? 'text-purple-700 bg-purple-50/50 hover:bg-purple-50 border border-purple-100/40'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  // Only Admins can view the Staff Management tab
  const showStaff = currentRole === 'Admin';

  const nav = (
    <>
      {/* 1. PATIENTS */}
      <button type="button" onClick={() => setActiveTab('patients')} className={itemClass('patients')}>
        👥 Patient Records
      </button>

      {/* 2. APPOINTMENTS (New Tab Added Here) */}
      <button type="button" onClick={() => setActiveTab('appointments')} className={itemClass('appointments')}>
        📅 Book Appointments
      </button>

      {/* 3. TREATMENTS */}
      <button type="button" onClick={() => setActiveTab('treatments')} className={itemClass('treatments')}>
        🩺 Doctor's Checkups & Diagnoses
      </button>

      {/* 4. PRESCRIPTIONS */}
      <button type="button" onClick={() => setActiveTab('prescriptions')} className={itemClass('prescriptions')}>
        💊 Pharmacy & Medicines
      </button>

      {/* 5. PAYMENTS */}
      <button type="button" onClick={() => setActiveTab('payments')} className={itemClass('payments')}>
        💰 Bills & Invoices
      </button>

      {/* ADMIN CONTROL PANEL */}
      {showStaff && (
        <div className="pt-4 mt-4 border-t border-slate-100">
          <p className="px-3 text-[10px] font-black tracking-wider uppercase text-slate-400 mb-2">
            Admin Settings
          </p>
          <button type="button" onClick={() => setActiveTab('staff')} className={itemClass('staff')}>
            🛠️ Manage Staff Accounts
          </button>
        </div>
      )}

      {/* LOGOUT BUTTON */}
      <div className="pt-4 mt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => {
            onLogout?.();
            onCloseMobile?.();
          }}
          className="w-full px-3 py-2.5 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 border border-red-200/50 text-red-700 transition-all cursor-pointer"
        >
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (Visible on regular screens) */}
      <aside
        className="hidden md:block bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1"
        style={{ minHeight: 'calc(100vh - 120px)' }}
      >
        <p className="px-3 text-[10px] font-black tracking-wider uppercase text-slate-400 mb-2">
          Menu
        </p>
        {nav}
      </aside>

      {/* Mobile Sidebar (Visible on smaller mobile phone screens) */}
      <aside className="md:hidden bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1 w-[85vw] max-w-[320px]">
        <p className="px-3 text-[10px] font-black tracking-wider uppercase text-slate-400 mb-2">
          Menu
        </p>
        {nav}
      </aside>
    </>
  );
}

export default Sidebar;