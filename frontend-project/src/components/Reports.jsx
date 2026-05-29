import { useEffect, useMemo, useState } from 'react';

import axios from 'axios';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const getToken = () => localStorage.getItem('token');

const cardClass = 'rounded-2xl border border-slate-200 bg-white shadow-sm p-5';
const statLabel = 'text-xs font-bold uppercase tracking-wider text-slate-500';
const statValue = 'text-2xl font-black text-slate-900 mt-1';

function formatRwf(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString();
}

const Reports = () => {
  const [summary, setSummary] = useState(null);
  const [medDist, setMedDist] = useState([]);
  const [payDist, setPayDist] = useState([]);
  const [trend, setTrend] = useState({ labels: [], data: [], days: 14 });
  const [topMedicines, setTopMedicines] = useState([]);
  const [topDiagnoses, setTopDiagnoses] = useState([]);
  const [msg, setMsg] = useState({ text: '', isError: false });

  const header = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${getToken()}` }
    }),
    []
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setMsg({ text: '', isError: false });
        const [s, md, pd, tr, tmed, tdiag] = await Promise.all([
          axios.get('http://localhost:5000/api/reports/summary', header),
          axios.get('http://localhost:5000/api/reports/medicines-distribution', header),
          axios.get('http://localhost:5000/api/reports/payments-distribution', header),
          axios.get('http://localhost:5000/api/reports/treatments-trend?days=14', header),
          axios.get('http://localhost:5000/api/reports/top-medicines-used?limit=6', header),
          axios.get('http://localhost:5000/api/reports/top-diagnoses?limit=6', header)
        ]);

        if (!mounted) return;

        setSummary(s.data);
        setMedDist(Array.isArray(md.data) ? md.data : []);
        setPayDist(Array.isArray(pd.data) ? pd.data : []);
        setTrend(tr.data || { labels: [], data: [], days: 14 });
        setTopMedicines(Array.isArray(tmed.data) ? tmed.data : []);
        setTopDiagnoses(Array.isArray(tdiag.data) ? tdiag.data : []);
      } catch (err) {
        if (!mounted) return;
        setMsg({
          text: err.response?.data?.message || 'Failed to load reports (check your session / role).',
          isError: true
        });
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [header]);

  const medBarData = useMemo(() => {
    return medDist.map((r) => ({ name: r.bucket, value: Number(r.count) }));
  }, [medDist]);

  const payPieData = useMemo(() => {
    return payDist.map((r) => ({ name: r.payment_method, value: Number(r.count) }));
  }, [payDist]);

  const pieColors = ['#2563eb', '#16a34a', '#f59e0b', '#7c3aed', '#dc2626', '#0ea5e9'];

  return (
    <div className="space-y-6">
      {msg.text && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold shadow-sm ${
            msg.isError
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={cardClass}>
          <div className={statLabel}>Medicines in Inventory</div>
          <div className={statValue}>{summary?.medicine?.total_medicines ?? 0}</div>
          <div className="mt-3 text-xs font-semibold text-slate-500">
            Low: {summary?.medicine?.low_stock ?? 0} • Out: {summary?.medicine?.out_of_stock ?? 0}
          </div>
        </div>

        <div className={cardClass}>
          <div className={statLabel}>Expired Medicines</div>
          <div className={statValue}>{summary?.medicine?.expired_medicines ?? 0}</div>
          <div className="mt-3 text-xs font-semibold text-slate-500">Check expiry dates daily</div>
        </div>

        <div className={cardClass}>
          <div className={statLabel}>Total Treatments</div>
          <div className={statValue}>{summary?.treatments?.total_treatments ?? 0}</div>
          <div className="mt-3 text-xs font-semibold text-slate-500">All visits & consults</div>
        </div>

        <div className={cardClass}>
          <div className={statLabel}>Total Payments</div>
          <div className={statValue}>{summary?.payments?.total_payments ?? 0}</div>
          <div className="mt-3 text-xs font-semibold text-slate-500">
            Sum: {formatRwf(summary?.payments?.total_amount)} RWF
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        <div className={cardClass + ' xl:col-span-1'}>
          <h3 className="font-black text-slate-900">💊 Medicines Stock Distribution</h3>
          <p className="text-xs text-slate-500 mt-1">Healthy vs low vs out-of-stock</p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={medBarData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Medicines" fill="#2563eb" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cardClass + ' xl:col-span-1'}>
          <h3 className="font-black text-slate-900">💳 Payment Methods Distribution</h3>
          <p className="text-xs text-slate-500 mt-1">Breakdown of payment channels</p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie data={payPieData} dataKey="value" nameKey="name" outerRadius={95}>
                  {payPieData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cardClass + ' xl:col-span-1'}>
          <h3 className="font-black text-slate-900">📈 Treatments Trend (Last {trend.days} days)</h3>
          <p className="text-xs text-slate-500 mt-1">Daily number of treatments</p>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart
                data={trend.labels.map((d, i) => ({ day: d, count: trend.data[i] ?? 0 }))}
              >
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" name="Treatments" stroke="#16a34a" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className={cardClass}>
          <h3 className="font-black text-slate-900">🏷️ Top Medicines Used</h3>
          <p className="text-xs text-slate-500 mt-1">Based on prescription quantities</p>
          <div className="mt-4 overflow-x-auto">
            {topMedicines.length === 0 ? (
              <div className="text-sm text-slate-500 font-medium py-6 text-center">No data</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Total Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {topMedicines.map((r) => (
                    <tr key={r.medicine_id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-900">{r.name}</td>
                      <td className="p-3 font-mono text-blue-700 font-bold">
                        {Number(r.total_quantity ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className={cardClass}>
          <h3 className="font-black text-slate-900">🩺 Top Diagnoses</h3>
          <p className="text-xs text-slate-500 mt-1">Most frequent diagnosis text</p>
          <div className="mt-4 overflow-x-auto">
            {topDiagnoses.length === 0 ? (
              <div className="text-sm text-slate-500 font-medium py-6 text-center">No data</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-3">Diagnosis</th>
                    <th className="p-3">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {topDiagnoses.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="p-3 font-semibold text-slate-900">{r.diagnosis}</td>
                      <td className="p-3 font-mono text-emerald-700 font-bold">
                        {Number(r.count ?? 0).toLocaleString()}
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

export default Reports;

