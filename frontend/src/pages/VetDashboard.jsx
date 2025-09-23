// src/pages/VetDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { format, startOfDay, endOfDay } from "date-fns";

const uid = () => String(Date.now()) + Math.random().toString(36).slice(2);
const LS_KEY = "vet_records";

// seed data
const seedRows = [
  { id: uid(), date: "2025-09-13", name: "Tommy", owner: "Alice", phone: "089-111-2222", type: "Cat", diagnosis: "Reason 1", plan: "-", status: "Completed" },
  { id: uid(), date: "2025-09-14", name: "Devid", owner: "Bob", phone: "089-333-4444", type: "Dog", diagnosis: "Reason 2", plan: "-", status: "Completed" },
  { id: uid(), date: "2025-09-15", name: "Jack", owner: "Carol", phone: "089-555-6666", type: "Dog", diagnosis: "Reason 3", plan: "-", status: "Completed" },
  { id: uid(), date: "2025-09-16", name: "Lucy", owner: "Duke", phone: "089-777-8888", type: "Bird", diagnosis: "Getting vaccine", plan: "-", status: "Scheduled" },
];

export default function VetDashboard() {
  const [rows, setRows] = useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const blank = { id: "", date: "", name: "", owner: "", phone: "", type: "Dog", diagnosis: "", plan: "", status: "Scheduled" };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);

  // Load & persist
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        setRows(JSON.parse(raw));
      } catch {
        setRows(seedRows);
      }
    } else setRows(seedRows);
  }, []);
  useEffect(() => localStorage.setItem(LS_KEY, JSON.stringify(rows)), [rows]);

  // filter date (inclusive)
  const filtered = useMemo(() => {
    if (!fromDate && !toDate) return rows;
    return rows.filter((r) => {
      const d = new Date(r.date);
      const okFrom = fromDate ? d >= startOfDay(fromDate) : true;
      const okTo = toDate ? d <= endOfDay(toDate) : true;
      return okFrom && okTo;
    });
  }, [rows, fromDate, toDate]);

  const resetFilters = () => {
    setFromDate(null);
    setToDate(null);
  };

  const onChangeForm = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({ ...r });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitForm = (e) => {
    e.preventDefault();
    if (!form.date || !form.name || !form.diagnosis) return;

    if (editingId) {
      setRows((prev) => prev.map((r) => (r.id === editingId ? { ...form, id: editingId } : r)));
      setEditingId(null);
    } else {
      setRows((prev) => [{ ...form, id: uid() }, ...prev]);
    }
    setForm(blank);
  };

  const setStatus = (id, status) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  const removeRow = (id) => {
    if (window.confirm("Delete this record?")) setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/paws.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "1900px 1200px",
        backgroundColor: "rgba(255,255,255,0.85)",
        backgroundBlendMode: "lighten",
      }}
    >
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-14">
        {/* Top bar: Welcome (left) + Filters (right) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6">
          {/* Welcome (left) */}
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Welcome : <span className="font-semibold">Dr. Smith</span>{" "}
              <span role="img" aria-label="wave">👋</span>
            </h2>
            <p className="text-slate-600">Medical Records Page</p>
          </div>

          {/* Filters (right) */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end"
            style={{ transform: "scale(0.9)", transformOrigin: "top right" }}
          >
            {/* From date */}
            <div>
              <label className="block text-sm font-semibold mb-1">From date</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-[220px] rounded-2xl px-4 py-2 border-2 outline-none"
                  style={{ backgroundColor: "#FA9D9D", borderColor: "#FFAA99" }}
                  value={fromDate ? fromDate.toISOString().slice(0, 10) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFromDate(val ? new Date(val) : null);
                  }}
                />
              </div>
            </div>

            {/* To date */}
            <div>
              <label className="block text-sm font-semibold mb-1">To date</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-[220px] rounded-2xl px-4 py-2 border-2 outline-none"
                  style={{ backgroundColor: "#FA9D9D", borderColor: "#FFAA99" }}
                  value={toDate ? toDate.toISOString().slice(0, 10) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setToDate(val ? new Date(val) : null);
                  }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="col-span-1 sm:col-span-2 flex gap-3 justify-start">
              <button
                type="button"
                className="rounded-2xl px-5 py-2 font-bold"
                style={{ backgroundColor: "#F3F58B" }}
              >
                Search
              </button>
              <button
                type="button"
                className="rounded-2xl px-5 py-2 font-bold"
                style={{ backgroundColor: "#F3F58B" }}
                onClick={resetFilters}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Add / Edit form */}
        <section className="bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 shadow p-5 mb-8">
          <h3 className="text-lg font-bold mb-4">{editingId ? "Edit record" : "Add new record"}</h3>
          <form onSubmit={submitForm} className="grid sm:grid-cols-2 lg:grid-cols-8 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold mb-1">Date</label>
              <input
                type="date"
                className="w-full rounded-md px-3 py-2 border border-slate-300 outline-none"
                value={form.date ? form.date : ""}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Pet name</label>
              <input className="input w-full" value={form.name} onChange={onChangeForm("name")} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Owner name</label>
              <input className="input w-full" value={form.owner} onChange={onChangeForm("owner")} placeholder="e.g., Alice" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Phone number</label>
              <input className="input w-full" value={form.phone} onChange={onChangeForm("phone")} inputMode="tel" placeholder="041-xxx-xxxx" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Type</label>
              <select className="input w-full" value={form.type} onChange={onChangeForm("type")}>
                <option>Dog</option>
                <option>Cat</option>
                <option>Bird</option>
                <option>Other</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold mb-1">Diagnosis</label>
              <input className="input w-full" value={form.diagnosis} onChange={onChangeForm("diagnosis")} />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold mb-1">Treatment plan</label>
              <input className="input w-full" value={form.plan} onChange={onChangeForm("plan")} />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Status</label>
              <select className="input w-full" value={form.status} onChange={onChangeForm("status")}>
                <option>Scheduled</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </div>

            <div className="lg:col-span-2 flex items-end gap-3">
              <button type="submit" className="btn btn-primary px-5">
                {editingId ? "Save changes" : "Add record"}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setForm(blank); }}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Records table */}
        <section className="bg-white shadow-xl rounded-2xl overflow-hidden border border-indigo-200">
          <div className="bg-indigo-200 px-6 py-3 font-semibold text-slate-800">Pet record</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[1000px]">
              <thead>
                <tr className="bg-indigo-300 text-gray-800">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Pet</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Diagnosis</th>
                  <th className="px-4 py-3">Treatment Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr key={r.id} className={idx % 2 === 0 ? "bg-indigo-100" : "bg-indigo-200"}>
                    <td className="px-4 py-3">{format(new Date(r.date), "dd/MM/yy")}</td>
                    <td className="px-4 py-3">{r.name}</td>
                    <td className="px-4 py-3">{r.owner}</td>
                    <td className="px-4 py-3">{r.phone}</td>
                    <td className="px-4 py-3">{r.type}</td>
                    <td className="px-4 py-3">{r.diagnosis}</td>
                    <td className="px-4 py-3">{r.plan}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "px-3 py-1 rounded-full text-xs font-bold " +
                          (r.status === "Completed"
                            ? "bg-emerald-500 text-white"
                            : r.status === "Scheduled"
                            ? "bg-amber-400 text-slate-900"
                            : "bg-slate-400 text-white")
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button className="underline font-semibold text-indigo-700" onClick={() => startEdit(r)}>Edit</button>
                      <button className="underline font-semibold text-indigo-700" onClick={() => setStatus(r.id, "Completed")}>Completed</button>
                      <button className="underline font-semibold text-indigo-700" onClick={() => setStatus(r.id, "Cancelled")}>Cancel</button>
                      <button className="text-red-600 underline font-semibold" onClick={() => removeRow(r.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                      No records found for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
