import React from 'react';

function Header({ title, onToggleSidebar, userName, role, onLogout }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden inline-flex items-center justify-center rounded-xl p-2 hover:bg-slate-50 border border-slate-200"
            aria-label="Open navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">Hope Clinic</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase font-mono">
              ERP Terminal v2.0{title ? ` · ${title}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900">{userName || 'Staff Member'}</div>
            <div className="inline-block mt-0.5 px-2 py-0.5 font-mono text-[9px] font-black tracking-wide uppercase bg-slate-100 text-slate-600 rounded-md border border-slate-200/60">
              ✨ {role || 'Guest'} Level
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/50 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;

