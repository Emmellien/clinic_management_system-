import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  // Patient Registration Form States
  const [patientName, setPatientName] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Payment Tracking Form States
  const [patientId, setPatientId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Notification Feedbacks
  const [msg, setMsg] = useState({ text: '', isError: false });

  // Axios Authorization setup helper
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const submitPatient = async (e) => {
    e.preventDefault();
    setMsg({ text: '', isError: false });
    try {
      const payload = { full_name: patientName, gender, age: parseInt(age), phone, address };
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/patients`, payload, getAuthHeader());
      setMsg({ text: `${res.data.message}! Registered Patient ID: ${res.data.patient_id}`, isError: false });
      // Reset Fields
      setPatientName(''); setAge(''); setPhone(''); setAddress('');
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Authorization failed or action forbidden.', isError: true });
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    setMsg({ text: '', isError: false });
    try {
      const payload = { patient_id: parseInt(patientId), amount: parseFloat(amount), payment_method: paymentMethod };
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/payments`, payload, getAuthHeader());
      setMsg({ text: res.data.message, isError: false });
      setPatientId(''); setAmount('');
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Could not log transaction values.', isError: true });
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <div>
          <h3>Welcome, {username}!</h3>
          <p style={{ margin: 0, color: '#666' }}>Role Assignment: <strong>{role}</strong></p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sign Out</button>
      </div>

      {msg.text && (
        <div style={{ margin: '20px 0', padding: '12px', borderRadius: '4px', background: msg.isError ? '#f8d7da' : '#d1e7dd', color: msg.isError ? '#842029' : '#0f5132' }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        
        {/* BLOCK 1: PATIENT REGISTRATION */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h4>Step 1: Test Patient Registration</h4>
          <form onSubmit={submitPatient}>
            <div style={{ marginBottom: '10px' }}>
              <label>Full Name:</label>
              <input type="text" style={{ width: '100%', padding: '6px' }} value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Gender:</label>
              <select style={{ width: '100%', padding: '6px' }} value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Age:</label>
              <input type="number" style={{ width: '100%', padding: '6px' }} value={age} onChange={(e) => setAge(e.target.value)} required />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Phone Number:</label>
              <input type="text" style={{ width: '100%', padding: '6px' }} value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Address:</label>
              <input type="text" style={{ width: '100%', padding: '6px' }} value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <button type="submit" style={{ padding: '8px 12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Register Patient</button>
          </form>
        </div>

        {/* BLOCK 2: BILLING PAYMENTS */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h4>Step 5: Test Payment Processing</h4>
          <form onSubmit={submitPayment}>
            <div style={{ marginBottom: '10px' }}>
              <label>Target Patient ID:</label>
              <input type="number" style={{ width: '100%', padding: '6px' }} placeholder="Ex: 1" value={patientId} onChange={(e) => setPatientId(e.target.value)} required />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Amount (RWF):</label>
              <input type="number" style={{ width: '100%', padding: '6px' }} placeholder="Ex: 15000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Payment Method:</label>
              <select style={{ width: '100%', padding: '6px' }} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Card">Card</option>
                <option value="Insurance">Insurance</option>
              </select>
            </div>
            <button type="submit" style={{ padding: '8px 12px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Process Payment</button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;