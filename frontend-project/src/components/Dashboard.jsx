import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientManager from './PatientManager';
import StaffManager from './StaffManager';
import TreatmentManager from './TreatmentManager';
import PaymentManager from './PaymentManager';
import PrescriptionManager from './PrescriptionManager';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Destructure staff credentials out of system local storage clusters
  const [currentRole, setCurrentRole] = useState('Guest');
  const [userName, setUserName] = useState('Staff Member');
  const [activeTab, setActiveTab] = useState('patients');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');

    // Route guard safety check: Kick back to login if unauthenticated
    if (!token) {
      navigate('/login');
      return;
    }

    if (role) setCurrentRole(role);
    if (name) setUserName(name);

    // Contextual starting tab assignment based on job roles
    if (role === 'Doctor' || role === 'Nurse') {
      setActiveTab('treatments');
    } else if (role === 'Receptionist') {
      setActiveTab('patients');
    } else if (role === 'Admin') {
      setActiveTab('staff');
    }
  }, [navigate]);

  // Flush credentials and push back to auth terminal
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Central Router Module Renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'patients':
        return <PatientManager />;
      case 'staff':
        return currentRole === 'Admin' ? <StaffManager /> : (
          <div className="p-8 text-center text-sm font-medium text-slate-500 bg-white border rounded-2xl">
            🔒 Access Denied: You do not possess structural Admin directory permissions.
          </div>
        );
      case 'treatments':
        return <TreatmentManager />;
      case 'payments':
        return <PaymentManager />;
      case 'prescriptions':
        return <PrescriptionManager />;
      default:
        return <PatientManager />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800 font-sans">
      
      {/* GLOBAL MANAGEMENT NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-200">
              H
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">Hope Clinic</h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase font-mono">ERP Terminal v2.0</p>
            </div>
          </div>

          {/* Current Staff Context Profile Summary card */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">{userName}</div>
              <div className="inline-block mt-0.5 px-2 py-0.5 font-mono text-[9px] font-black tracking-wide uppercase bg-slate-100 text-slate-600 rounded-md border border-slate-200/60">
                ✨ {currentRole} Level
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/50 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE SPLIT CONTAINER LAYOUT */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        
        {/* SIDEBAR NAVIGATION CONTROLLER */}
        <aside className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <p className="px-3 text-[10px] font-black tracking-wider uppercase text-slate-400 mb-2">Workspace Navigation</p>
          
          {/* Patients Module Tab (Accessible to All Roles) */}
          <button
            onClick={() => setActiveTab('patients')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'patients' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            👥 Clinic Patients Registry
          </button>

          {/* Clinical Records Module Tab (Accessible to All Roles) */}
          <button
            onClick={() => setActiveTab('treatments')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'treatments' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            🩺 Medical Encounters (Diagnoses)
          </button>

          {/* Prescriptions Order Tracking Module Tab */}
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'prescriptions' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            💊 Pharmacy Prescriptions
          </button>

          {/* Ledger Accounting Billing Module Tab */}
          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'payments' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            💰 Payments & Billing Ledger
          </button>

          {/* Staff Privilege Provisioning Module Tab (Strictly Enforced Visibility for Admin Role Only) */}
          {currentRole === 'Admin' && (
            <div className="pt-4 mt-4 border-t border-slate-100">
              <p className="px-3 text-[10px] font-black tracking-wider uppercase text-slate-400 mb-2">Security Console</p>
              <button
                onClick={() => setActiveTab('staff')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                  activeTab === 'staff' 
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-100' 
                    : 'text-purple-700 bg-purple-50/50 hover:bg-purple-50 border border-purple-100/40'
                }`}
              >
                🛠️ Staff Accounts Management
              </button>
            </div>
          )}
        </aside>

        {/* ACTIVE RUNTIME CONTEXT MODULE DISPLAY VIEWPORTS */}
        <main className="md:col-span-3">
          {renderTabContent()}
        </main>

      </div>
    </div>
  );
};

export default Dashboard;