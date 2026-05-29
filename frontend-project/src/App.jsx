import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Home from './components/Home';


// Secure Route Guard
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      {/* Cleaned layout wrapper utilizing standard, highly readable styling keywords */}
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        <Routes>
          {/* Public Authentication Screens */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          {/* Main Application Workstation (Protected Access) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;