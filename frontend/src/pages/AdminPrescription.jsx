import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import jsPDF from "jspdf";

export default function AdminPrescription() {
  const [owners, setOwners] = useState([]);
  const [pets, setPets] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [formData, setFormData] = useState({
    ownerId: "",
    petId: "",
    date: "",
    time: "",
    reason: "",
  });
  const [displayDate, setDisplayDate] = useState("");
  const nativeDateRef = useRef(null);
  const [errors, setErrors] = useState([]);

  // ---------- helpers ----------
  const isoToDmy = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const dmyToIso = (dmy) => {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((dmy || "").trim());
    if (!m) return null;
    const dd = +m[1], mm = +m[2], yyyy = +m[3];
    const dt = new Date(yyyy, mm - 1, dd);
    if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return null;
    return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  };

  const formatDmyMask = (val) => {
    const digits = (val || "").replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  useEffect(() => setDisplayDate(isoToDmy(formData.date)), [formData.date]);

  const filteredPets = useMemo(() => {
    if (!formData.ownerId) return [];
    return pets.filter((p) => String(p.ownerId?._id || p.ownerId) === String(formData.ownerId));
  }, [pets, formData.ownerId]);

  const validate = () => {
    const errs = [];
    if (!formData.ownerId) errs.push("Owner is required.");
    if (!formData.petId) errs.push("Pet is required.");
    const iso = dmyToIso(displayDate);
    if (!iso) errs.push("Date is required in dd/mm/yyyy.");
    if (!formData.time) errs.push("Time is required.");
    setFormData((s) => ({ ...s, date: iso || "" }));
    setErrors(errs);
    return errs.length === 0;
  };

  const clearForm = () => {
    setFormData({ ownerId: "", petId: "", date: "", time: "", reason: "" });
    setDisplayDate("");
    setErrors([]);
  };

  // ---------- load ----------
  const loadAll = async () => {
    const [o, p, r] = await Promise.all([
      api.get("/owners"),
      api.get("/pets"),
      api.get("/prescriptions"),
    ]);
    setOwners(o.data || []);
    setPets(p.data || []);
    setPrescriptions(r.data || []);
  };

  useEffect(() => {
    loadAll().catch((e) => {
      console.error("Load error:", e);
      alert("Error loading data");
    });
  }, []);

  // ---------- submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await api.post("/prescriptions", formData);
      clearForm();
      await loadAll();
    } catch (err) {
      console.error("Save error:", err);
      alert("Save failed");
    }
  };

  // ---------- update status ----------
  const handleUpdateStatus = async (id, newStatus) => {
    if (newStatus === "Cancelled" && !window.confirm("Are you sure you want to cancel this prescription?")) {
      return;
    }
    try {
      await api.patch(`/prescriptions/${id}`, { status: newStatus });
      setPrescriptions((prev) => prev.map((p) => (p._id === id ? { ...p, status: newStatus } : p)));
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update status");
    }
  };

  // ---------- download PDF ----------
  const handleDownload = (row) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Prescription", 14, 20);

    // Line
    doc.setLineWidth(0.5);
    doc.line(14, 28, 200, 28);

    // Details
    doc.setFontSize(12);
    let y = 40;
    doc.text(`Owner: ${row.ownerId?.name || row.ownerId}`, 14, y); y += 10;
    doc.text(`Pet: ${row.petId?.name || row.petId}`, 14, y); y += 10;
    doc.text(`Date: ${isoToDmy(row.date) || row.date}`, 14, y); y += 10;
    doc.text(`Time: ${row.time}`, 14, y); y += 10;
    doc.text(`Reason: ${row.reason || "-"}`, 14, y); y += 10;
    doc.text(`Status: ${row.status}`, 14, y);

    // Save
    doc.save(`prescription_${row._id}.pdf`);
  };

  // ---------- send (placeholder) ----------
  const handleSend = (row) => {
    alert(`Pretend-send prescription ${row._id} (hook this to email/SMS API).`);
  };

  // ---------- UI ----------
  return (
    <div className="px-6 py-6">
      <style>{`
        .card { border-radius: 16px; border: 1px solid #e5e7eb; }
        .card-purple { background: #a5b4fc; border-color:#8ea0ff; }
        .card-body { padding: 24px; }
        .card-title { font-weight: 700; font-size: 20px; margin-bottom: 16px; color:#111827; }
        .input, .select { width:100%; border:1px solid #e5e7eb; border-radius:12px; padding:12px 14px; }
        .btn-yellow { background:#F3F58B; color:#111827; padding:12px 18px; border-radius:12px; font-weight:600; }
        .btn-action { padding:6px 12px; border-radius:8px; font-weight:600; margin-left:6px; }
        .btn-complete { background:#22c55e; color:#fff; }
        .btn-cancel { background:#ef4444; color:#fff; }
        .link-action { text-decoration: underline; font-weight: 600; color: #4338ca; margin-right: 16px; }
        .form-grid { display:grid; grid-template-columns: 1fr; gap:16px; }
        @media (min-width: 768px) { .form-grid { grid-template-columns: 1fr 1fr; } }
        .table { width:100%; border-collapse:collapse; }
        .table th, .table td { padding:14px; border:1px solid #c9d0ff; }
        .table thead th { background:#a5b4fc; color:#111827; }
        .badge { padding:6px 10px; border-radius:999px; font-size:12px; font-weight:700; }
        .badge-completed { background:#22c55e; color:#fff; }
        .badge-pending { background:#facc15; color:#111827; }
        .badge-cancelled { background:#ef4444; color:#fff; }
        .row-cancelled { opacity: 0.6; }
      `}</style>

      <h1 className="text-2xl font-bold text-slate-900 mb-1">Prescription Records</h1>
      <p className="text-slate-600 mb-6">Create and manage prescriptions.</p>

      {errors.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <ul className="list-disc ml-5 text-rose-700">
              {errors.map((er, i) => <li key={i}>{er}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* New prescription form */}
      <div className="card card-purple mb-6">
        <div className="card-body">
          <div className="card-title">New prescription</div>
          <form onSubmit={handleSubmit} className="form-grid">
            {/* Owner */}
            <div>
              <label className="text-sm text-slate-700">Owner</label>
              <select
                className="select mt-1"
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value, petId: "" })}
              >
                <option value="">Select owner</option>
                {owners.map((o) => (
                  <option key={o._id} value={o._id}>{o.name}</option>
                ))}
              </select>
            </div>

            {/* Pet */}
            <div>
              <label className="text-sm text-slate-700">Pet</label>
              <select
                className="select mt-1"
                disabled={!formData.ownerId}
                value={formData.petId}
                onChange={(e) => setFormData({ ...formData, petId: e.target.value })}
              >
                <option value="">{formData.ownerId ? "Select pet" : "Select owner first"}</option>
                {filteredPets.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.type})</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="text-sm text-slate-700">Date</label>
              <div className="relative mt-1">
                <input
                  className="input pr-10"
                  type="text"
                  placeholder="dd/mm/yyyy"
                  value={displayDate}
                  onChange={(e) => {
                    const masked = formatDmyMask(e.target.value);
                    setDisplayDate(masked);
                    const iso = dmyToIso(masked);
                    setFormData((s) => ({ ...s, date: iso || "" }));
                  }}
                  onBlur={() => {
                    const iso = dmyToIso(displayDate);
                    setFormData((s) => ({ ...s, date: iso || "" }));
                  }}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => {
                    const el = nativeDateRef.current;
                    if (el.showPicker) el.showPicker(); else el.click();
                  }}
                >📅</button>
                <input
                  ref={nativeDateRef}
                  type="date"
                  style={{ position:"absolute", width:1, height:1, padding:0, margin:-1,
                           overflow:"hidden", clip:"rect(0,0,0,0)", whiteSpace:"nowrap", border:0 }}
                  onChange={(e) => {
                    const iso = e.target.value;
                    setFormData((s) => ({ ...s, date: iso }));
                    if (iso) {
                      const [y, m, d] = iso.split("-");
                      setDisplayDate(`${d}/${m}/${y}`);
                    } else setDisplayDate("");
                  }}
                />
              </div>
            </div>

            {/* Time */}
            <div>
              <label className="text-sm text-slate-700">Time</label>
              <input
                className="input mt-1"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            {/* Reason */}
            <div className="md:col-span-2">
              <label className="text-sm text-slate-700">Reason</label>
              <input
                className="input mt-1"
                placeholder="(optional)"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <button type="submit" className="btn-yellow">Create prescription</button>
            </div>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Pet</th>
              <th>Owner</th>
              <th>Status</th>
              <th style={{textAlign:"right"}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-slate-500 py-6">No prescriptions</td>
              </tr>
            ) : prescriptions.map((r) => (
              <tr key={r._id} className={r.status === "Cancelled" ? "row-cancelled" : ""}>
                <td>{isoToDmy(r.date) || r.date}</td>
                <td>{r.petId?.name || "—"}</td>
                <td>{r.ownerId?.name || "—"}</td>
                <td>
                  {r.status === "Completed" && <span className="badge badge-completed">Completed</span>}
                  {r.status === "Pending"   && <span className="badge badge-pending">Pending</span>}
                  {r.status === "Cancelled" && <span className="badge badge-cancelled">Cancelled</span>}
                </td>
                <td style={{textAlign:"right"}}>
                  <button className="link-action" onClick={() => handleDownload(r)}>Download</button>
                  <button className="link-action" onClick={() => handleSend(r)}>Send</button>

                  {r.status === "Pending" && (
                    <>
                      <button
                        className="btn-action btn-complete"
                        onClick={() => handleUpdateStatus(r._id, "Completed")}
                      >
                        Complete
                      </button>
                      <button
                        className="btn-action btn-cancel"
                        onClick={() => handleUpdateStatus(r._id, "Cancelled")}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}





