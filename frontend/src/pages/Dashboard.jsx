import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { format, addDays } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const toDate = addDays(today, 6);
  const toStr = format(toDate, 'yyyy-MM-dd');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/appointments/summary', {
          params: { from: todayStr, to: toStr }
        });
        setRows(data);
      } catch (err) {
        console.error('Error fetching summary:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [todayStr, toStr]);

  const todayCount = useMemo(
    () => rows.find(r => r.date === todayStr)?.total || 0,
    [rows, todayStr]
  );
  const weekTotal = useMemo(
    () => rows.reduce((s, r) => s + (r.total || 0), 0),
    [rows]
  );

  const hour = new Date().getHours();
  const hello =
    hour < 12 ? 'Good morning' :
    hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/paws.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "rgba(255,255,255,0.85)", //
        backgroundBlendMode: "lighten",
      }}
    >
      <div className="container-page relative z-10 px-6 py-10 max-w-7xl mx-auto">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            {hello} {user?.name || ''} 👋
          </h1>
          <p className="text-slate-600 mt-1">Summary on next 7 days</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 sm:grid-cols-3 mb-8">
          <div className="bg-indigo-300 rounded-xl shadow p-5 border border-indigo-400 text-center">
            <h2 className="text-sm font-medium text-slate-800">Today queue</h2>
            <p className="mt-2 text-4xl font-bold text-black">{todayCount}</p>
          </div>
          <div className="bg-indigo-300 rounded-xl shadow p-5 border border-indigo-400 text-center">
            <h2 className="text-sm font-medium text-slate-800">Summary 7 days</h2>
            <p className="mt-2 text-4xl font-bold text-black">{weekTotal}</p>
          </div>
          <div className="bg-indigo-300 rounded-xl shadow p-5 border border-indigo-400 text-center">
            <h2 className="text-sm font-medium text-slate-800">Period</h2>
            <p className="mt-2 text-lg font-semibold">
              {format(today, 'dd/MM/yyyy')} → {format(toDate, 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-indigo-200 rounded-xl shadow border border-indigo-300">
          <div className="p-5 border-b border-indigo-300">
            <h2 className="text-lg font-semibold text-slate-800">Daily details</h2>
          </div>
          <div className="p-5 overflow-x-auto">
            {loading ? (
              <div className="text-center text-slate-700">Loading...</div>
            ) : (
              <table className="table-fixed w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-300 text-slate-900 text-sm">
                    <th className="w-1/5 px-4 py-2 text-left">Date</th>
                    <th className="w-1/5 px-4 py-2 text-left">Total</th>
                    <th className="w-1/5 px-4 py-2 text-left">Waiting for confirmation</th>
                    <th className="w-1/5 px-4 py-2 text-left">Success</th>
                    <th className="w-1/5 px-4 py-2 text-left">Cancel</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.date} className={idx % 2 === 0 ? "bg-indigo-100" : "bg-indigo-200"}>
                      <td className="w-1/5 px-4 py-2">{format(new Date(r.date), 'dd/MM/yyyy')}</td>
                      <td className="w-1/5 px-4 py-2">{r.total}</td>
                      <td className="w-1/5 px-4 py-2">{r.scheduled || 0}</td>
                      <td className="w-1/5 px-4 py-2">{r.completed || 0}</td>
                      <td className="w-1/5 px-4 py-2">{r.cancelled || 0}</td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-700">
                        No data today
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
