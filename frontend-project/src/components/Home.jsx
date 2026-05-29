import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* HERO */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
                🏥 Hope Medical Clinic
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Reliable care for every patient
              </h1>
              <p className="mt-4 text-sm sm:text-base text-slate-600">
                Book appointments, view services, and contact our front desk. We accept multiple payment
                methods and insurance plans.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  Staff Portal Login
                </button>
                <button
                  onClick={() => alert('Contact the clinic using the details shown below.')} 
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </div>

              {/* QUICK INFO */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Location</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">Kigali, Rwanda</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">+250 78 000 0000</div>
                </div>
              </div>
            </div>

            {/* INFO CARDS */}
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-slate-200 bg-white">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Clinic Schedule</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Mon–Sat: 08:00 AM – 06:00 PM</div>
                <div className="mt-1 text-xs text-slate-500">Closed Sunday & public holidays</div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-white">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Methods Accepted</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Cash • Mobile Money • Card • Insurance</div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-white">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Insurance Accepted</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Hope Insurance Partners (sample)</div>
                <div className="mt-1 text-xs text-slate-500">Update this list according to your real partners</div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-white">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Social Media</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Facebook / Instagram / X</div>
                <div className="mt-1 text-xs text-slate-500">@hopeclinic (sample)</div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTACT + LOCATION */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
            <h2 className="text-lg font-extrabold text-slate-900">Contact the Clinic</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div><span className="font-bold">Phone:</span> +250 78 000 0000</div>
              <div><span className="font-bold">Email:</span> info@hopeclinic.com</div>
              <div><span className="font-bold">Address:</span> Kigali, Rwanda</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
            <h2 className="text-lg font-extrabold text-slate-900">What we accept</h2>
            <div className="mt-3 text-sm text-slate-700 space-y-2">
              <div><span className="font-bold">Payment:</span> Cash, Mobile Money, Card, Insurance</div>
              <div><span className="font-bold">Insurance:</span> Hope Insurance Partners (sample)</div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Hope Medical Clinic. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Home;

