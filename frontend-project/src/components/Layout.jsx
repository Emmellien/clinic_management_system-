import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout({
  title,
  activeTab,
  setActiveTab,
  currentRole,
  userName,
  onLogout,
  isSidebarOpen,
  onToggleSidebar,
  onCloseMobile,
  children,
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800 font-sans">
      <Header
        title={title}
        onToggleSidebar={onToggleSidebar}
        userName={userName}
        role={currentRole}
        onLogout={onLogout}
      />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          <div className="hidden md:block md:col-span-1">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentRole={currentRole}
              onLogout={onLogout}
            />
          </div>

          {isSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-50">
              <button
                type="button"
                className="absolute inset-0 bg-black/30"
                onClick={onCloseMobile}
                aria-label="Close sidebar"
              />
              <div className="absolute left-3 top-20">
                <Sidebar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  currentRole={currentRole}
                  onLogout={onLogout}
                  onCloseMobile={onCloseMobile}
                />
              </div>
            </div>
          )}

          <main className="md:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default Layout;

