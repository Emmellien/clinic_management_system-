import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import All Managers
import PatientManager from './PatientManager';
import StaffManager from './StaffManager';
import TreatmentManager from './TreatmentManager';
import PaymentManager from './PaymentManager';
import PrescriptionManager from './PrescriptionManager';
import AppointmentManager from './AppointmentManager'; // New Import
import MedicineManager from './MedicineManager';         // New Import
import Layout from './Layout';

const Dashboard = () => {
  const navigate = useNavigate();

  // Destructure staff credentials out of system local storage clusters
  const [currentRole, setCurrentRole] = useState('Guest');
  const [userName, setUserName] = useState('Staff Member');
  const [activeTab, setActiveTab] = useState('patients');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      setActiveTab('appointments'); // Receptionists start at appointments
    } else if (role === 'Admin') {
      setActiveTab('staff');
    }
  }, [navigate]);

  // Flush credentials and push back to auth terminal
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleToggleSidebar = () => setIsSidebarOpen((v) => !v);
  const handleCloseMobile = () => setIsSidebarOpen(false);

  // Central Router Module Renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'appointments':
        return <AppointmentManager />;
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
      case 'medicines':
        return <MedicineManager />;
      case 'prescriptions':
        return <PrescriptionManager />;
      case 'payments':
        return <PaymentManager />;
      default:
        return <PatientManager />;
    }
  };

  return (
    <Layout
      title=""
      activeTab={activeTab}
      setActiveTab={(tab) => {
        setActiveTab(tab);
        handleCloseMobile();
      }}
      currentRole={currentRole}
      userName={userName}
      onLogout={handleLogout}
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={handleToggleSidebar}
      onCloseMobile={handleCloseMobile}
    >
      {renderTabContent()}
    </Layout>
  );
};

export default Dashboard;