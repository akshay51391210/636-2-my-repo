import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";
import jsPDF from "jspdf";
import { useAuth } from "../context/AuthContext";

export default function AdminPrescription() {
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === "admin";
  const isVet = role === "vet";

  const [owners, setOwners] = useState([]);
  const [pets, setPets] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  const [formData, setFormData] = useState({
    ownerId: "",
    petId: "",
    date: "",
    time: "",
    symptomsDiagnosis: "",
    weight: "",
    species: "",
    medication: {
      drugName: "",
      strength: "",
      dosageForm: "",
      quantity: "",
      doseEachTime: "",
      frequency: "",
      route: "",
      cautions: "",
    },
    status: "Pending",
  });

  const [displayDate, setDisplayDate] = useState("");
  const nativeDateRef = useRef(null);
  const [errors, setErrors] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // ---------- utils: date mask ----------
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

  // ---------- list derivation ----------
  const filteredPets = useMemo(() => {
    if (!formData.ownerId) return [];
    return pets.filter((p) => String(p.ownerId?._id || p.ownerId) === String(formData.ownerId));
  }, [pets, formData.ownerId]);

  // ---------- validation ----------
  const validate = () => {
    const errs = [];
    if (!formData.ownerId) errs.push("Owner is required.");
    if (!formData.petId) errs.push("Pet is required.");
    const iso = dmyToIso(displayDate);
    if (!iso) errs.push("Date is required in dd/mm/yyyy.");
    if (!formData.time) errs.push("Time is required.");

    // if fill some drugs, needs drugName
    const med = formData.medication || {};
    const medAny =
      med.drugName || med.strength || med.dosageForm || med.quantity ||
      med.doseEachTime || med.frequency || med.route || med.cautions;
    if (medAny && !med.drugName) errs.push('Drug Name is required when adding medication.');

    setFormData((s) => ({ ...s, date: iso || "" }));
    setErrors(errs);
    return errs.length === 0;
  };

  const clearForm = () => {
    setFormData({
      ownerId: "",
      petId: "",
      date: "",
      time: "",
      symptomsDiagnosis: "",
      weight: "",
      species: "",
      medication: {
        drugName: "",
        strength: "",
        dosageForm: "",
        quantity: "",
        doseEachTime: "",
        frequency: "",
        route: "",
        cautions: "",
      },
      status: "Pending",
    });
    setDisplayDate("");
    setErrors([]);
    setEditingId(null);
  };

  // ---------- fetch ----------
  const loadAll = async () => {
    // Vet must fill form → load owners/pets
    if (!isAdmin) {
      const [o, p, r] = await Promise.all([
        api.get("/owners"),
        api.get("/pets"),
        api.get("/prescriptions"),
      ]);
      setOwners(o.data || []);
      setPets(p.data || []);
      setPrescriptions(r.data || []);
      return;
    }
    // Admin read-only:
    const r = await api.get("/prescriptions");
    setPrescriptions(r.data || []);
  };

  useEffect(() => {
    loadAll().catch((e) => {
      console.error("Load error:", e);
      alert("Error loading data");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isVet]);

  // ---------- sanitize helpers ----------
  const sanitizeMedication = (m) => {
    if (!m) return undefined;
    const norm = Object.fromEntries(
      Object.entries(m).map(([k, v]) => [k, String(v ?? "").trim()])
    );
    const hasAny = Object.values(norm).some((v) => v !== "");
    if (!hasAny) return undefined;           
    if (!norm.drugName) {
      alert('Please fill "Drug Name" for the medication.');
      return null;                            
    }
    return norm;
  };

  const buildPayload = () => {
    const med = sanitizeMedication(formData.medication);
    if (med === null) return null;

    const ownerId = typeof formData.ownerId === "object"
      ? formData.ownerId?._id
      : formData.ownerId;
    const petId = typeof formData.petId === "object"
      ? formData.petId?._id
      : formData.petId;

    const payload = {
      ownerId,
      petId,
      date: String(formData.date || "").trim(),
      time: String(formData.time || "").trim(),
      species: (formData.species || "").trim() || undefined,
      weight: (formData.weight ?? "").toString().trim() || undefined,
      symptomsDiagnosis: (formData.symptomsDiagnosis || "").trim() || undefined,
      status: formData.status || "Pending",
    };
    if (med) payload.medication = med;
    return payload;
  };

  // ---------- submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVet) {
      alert("Only Vet can create or edit prescriptions.");
      return;
    }
    if (!validate()) return;

    try {
      const payload = buildPayload();
      if (!payload) return;

      if (editingId) {
        await api.patch(`/prescriptions/${editingId}`, payload);
      } else {
        await api.post("/prescriptions", payload);
      }
      clearForm();
      await loadAll();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Save failed";
      console.error("Save_error:", err?.response?.data || err);
      alert(msg);
    }
  };

  // ---------- edit / delete / status ----------
  const startEdit = (row) => {
    if (!isVet) return;
    setEditingId(row._id);
    setFormData({
      ownerId: row.ownerId?._id || row.ownerId || "",
      petId: row.petId?._id || row.petId || "",
      date: row.date || "",
      time: row.time || "",
      symptomsDiagnosis: row.symptomsDiagnosis || row.reason || "",
      weight: row.weight || "",
      species: row.species || row.petId?.type || "",
      medication: {
        drugName: row.medication?.drugName || "",
        strength: row.medication?.strength || "",
        dosageForm: row.medication?.dosageForm || "",
        quantity: row.medication?.quantity || "",
        doseEachTime: row.medication?.doseEachTime || "",
        frequency: row.medication?.frequency || "",
        route: row.medication?.route || "",
        cautions: row.medication?.cautions || "",
      },
      status: row.status || "Pending",
    });
    setDisplayDate(isoToDmy(row.date) || "");
  };

  const cancelEdit = () => clearForm();

  const handleDelete = async (id) => {
    if (!isVet) return;
    if (!window.confirm("Delete this prescription? This action cannot be undone.")) return;
    try {
      await api.delete(`/prescriptions/${id}`);
      setPrescriptions((prev) => prev.filter((p) => p._id !== id));
      if (editingId === id) clearForm();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete");
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!isVet) return;
    if (newStatus === "Cancelled" && !window.confirm("Are you sure you want to cancel this prescription?")) return;
    try {
      await api.patch(`/prescriptions/${id}`, { status: newStatus });
      setPrescriptions((prev) => prev.map((p) => (p._id === id ? { ...p, status: newStatus } : p)));
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update status");
    }
  };

  // ---------- PDF ----------
  const handleDownload = (row) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Prescription", 14, 18);
    doc.setLineWidth(0.5);
    doc.line(14, 22, 200, 22);
    doc.setFontSize(11);

    let y = 30;

    doc.text(`Owner: ${row.ownerId?.name || row.ownerId || "-"}`, 14, y); y += 6;
    doc.text(`Pet: ${row.petId?.name || "-"}`, 14, y); y += 6;
    doc.text(`Species: ${row.species || row.petId?.type || "-"}`, 14, y); y += 6;
    doc.text(`Weight: ${row.weight || "-"}${row.weight ? " kg" : ""}`, 14, y); y += 6;

    doc.text(`Date: ${isoToDmy(row.date) || row.date || "-"}`, 120, 30);
    doc.text(`Time: ${row.time || "-"}`, 120, 36);
    doc.text(`Status: ${row.status || "-"}`, 120, 42);

    y += 4;
    doc.setFont(undefined, "bold");
    doc.text("Symptoms/Diagnosis:", 14, y);
    doc.setFont(undefined, "normal");
    const reasonText = row.symptomsDiagnosis || row.reason || "-";
    y += 6;
    doc.text(doc.splitTextToSize(reasonText, 180), 14, y);
    y += 12;

    doc.setFont(undefined, "bold");
    doc.text("Medication", 14, y);
    doc.setFont(undefined, "normal");
    y += 6;

    const med = row.medication || {};
    doc.text(`Drug Name: ${med.drugName || "-"}`, 14, y); y += 6;
    doc.text(`Strength: ${med.strength || "-"}`, 14, y); y += 6;
    doc.text(`Dosage Form: ${med.dosageForm || "-"}`, 14, y); y += 6;
    doc.text(`Quantity: ${med.quantity || "-"}`, 14, y); y += 6;
    doc.text(`Dose (each time): ${med.doseEachTime || "-"}`, 14, y); y += 6;
    doc.text(`Frequency: ${med.frequency || "-"}`, 14, y); y += 6;
    doc.text(`Route: ${med.route || "-"}`, 14, y); y += 6;
    doc.text("Cautions/Precautions:", 14, y); y += 6;
    doc.text(doc.splitTextToSize(med.cautions || "-", 180), 14, y);

    doc.save(`prescription_${row._id}.pdf`);
  };

  const handleSend = (row) => {
    alert(`Pretend-send prescription ${row._id} (hook this to email/SMS API).`);
  };

  // ---------- UI ----------
  return (
    <div className="page-shell">
      <style>{`
        .page-shell { padding: 28px 20px; }
        .container { max-width: 1120px; margin: 0 auto; }
        .card { border-radius: 16px; border: 1px solid #e5e7eb; background:#fff; }
        .card-body { padding: 18px; }
        .card-purple { background:#a5b4fc; border-color:#8ea0ff; }
        .card-title { font-weight: 800; font-size: 16px; margin-bottom: 10px; color:#111827; }
        .compact { font-size: 13px; }
        .compact .input, .compact .select, .compact textarea {
          width: 100%;
          border:1px solid #e5e7eb;
          border-radius: 10px;
          padding: 8px 10px;
          line-height: 1.2;
        }
        .compact label { font-size: 12px; color:#374151; }
        .form-grid { display:grid; grid-template-columns: 1fr; gap:12px; }
        @media (min-width: 768px) { .form-grid { grid-template-columns: 1fr 1fr; } }
        .form-grid-3 { display:grid; grid-template-columns: 1fr; gap:12px; }
        @media (min-width: 768px) { .form-grid-3 { grid-template-columns: 1fr 1fr 1fr; } }
        .btn-yellow { background:#F3F58B; color:#111827; padding:9px 14px; border-radius:10px; font-weight:700; font-size:13px; }
        .link-action { background:none; border:none; padding:0; margin-right:14px; text-decoration: underline; font-weight:700; font-size:13px; color:#4338ca; cursor:pointer; }
        .link-danger { color:#dc2626; }
        .btn-action { padding:6px 10px; border-radius:8px; font-weight:700; font-size:12px; margin-left:6px; }
        .btn-complete { background:#22c55e; color:#fff; }
        .btn-cancel { background:#ef4444; color:#fff; }
        .table-wrap { border-radius: 14px; overflow: hidden; border:1px solid #d7defe; background:#fff; }
        table { width:100%; border-collapse: collapse; font-size:13px; }
        thead th { background:#a5b4fc; color:#111827; text-align:left; font-weight:800; }
        th, td { padding: 10px 12px; border-bottom: 1px solid #e6eaff; }
        tbody tr:last-child td { border-bottom: none; }
        .badge { padding:5px 9px; border-radius:999px; font-size:11px; font-weight:800; }
        .badge-completed { background:#22c55e; color:#fff; }
        .badge-pending { background:#facc15; color:#111827; }
        .badge-cancelled { background:#ef4444; color:#fff; }
        .row-cancelled { opacity: 0.6; }
        .section-gap { margin-top: 18px; }
        .page-title { font-size: 22px; font-weight: 800; margin-bottom: 4px; color:#0f172a; }
        .page-sub { color:#475569; margin-bottom: 16px; }
        body, .page-shell { background: #f8fbff; }
      `}</style>

      <div className="container">
        <h1 className="page-title">Prescription Records</h1>
        <p className="page-sub">
          {isAdmin
            ? "Read-only for Admin. Only Vet can create or modify prescriptions."
            : "Create and manage prescriptions."}
        </p>

        {errors.length > 0 && !isAdmin && (
          <div className="card section-gap">
            <div className="card-body">
              <ul className="list-disc ml-5 text-rose-700">
                {errors.map((er, i) => <li key={i}>{er}</li>)}
              </ul>
            </div>
          </div>
        )}

        {!isAdmin && (
          <div className="card card-purple section-gap">
            <div className="card-body compact">
              <div className="card-title">{editingId ? "Edit prescription" : "New prescription"}</div>

              <form onSubmit={handleSubmit} className="form-grid">
                {/* Owner */}
                <div>
                  <label>Owner</label>
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
                  <label>Pet</label>
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
                  <label>Date</label>
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
                      aria-label="Open date picker"
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
                  <label>Time</label>
                  <input
                    className="input mt-1"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>

                {/* Species */}
                <div>
                  <label>Species</label>
                  <input
                    className="input mt-1"
                    placeholder="e.g., Dog, Cat"
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                  />
                </div>

                {/* Weight */}
                <div>
                  <label>Weight (kg)</label>
                  <input
                    className="input mt-1"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 4.50"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>

                {/* Symptoms / Diagnosis */}
                <div className="md:col-span-2">
                  <label>Symptoms/Diagnosis</label>
                  <input
                    className="input mt-1"
                    placeholder="e.g., coughing, fever; suspected bacterial infection"
                    value={formData.symptomsDiagnosis}
                    onChange={(e) => setFormData({ ...formData, symptomsDiagnosis: e.target.value })}
                  />
                </div>

                {/* Medication */}
                <div className="md:col-span-2">
                  <div className="card section-gap">
                    <div className="card-body compact">
                      <div className="card-title">Medication</div>

                      <div className="form-grid-3">
                        <div>
                          <label>Drug Name</label>
                          <input
                            className="input mt-1"
                            placeholder="e.g., Amoxicillin"
                            value={formData.medication.drugName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                medication: { ...formData.medication, drugName: e.target.value },
                              })
                            }
                          />
                        </div>

                        <div>
                          <label>Strength</label>
                          <input
                            className="input mt-1"
                            placeholder="e.g., 250 mg / 5 mL"
                            value={formData.medication.strength}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                medication: { ...formData.medication, strength: e.target.value },
                              })
                            }
                          />
                        </div>

                        <div>
                          <label>Dosage Form</label>
                          <select
                            className="select mt-1"
                            value={formData.medication.dosageForm}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                medication: { ...formData.medication, dosageForm: e.target.value },
                              })
                            }
                          >
                            <option value="">Select</option>
                            <option>Tablet</option>
                            <option>Capsule</option>
                            <option>Liquid</option>
                            <option>Cream</option>
                            <option>Ointment</option>
                            <option>Gel</option>
                            <option>Drop</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-grid-3 section-gap">
                        <div>
                          <label>Quantity</label>
                          <input
                            className="input mt-1"
                            placeholder="e.g., 20 tablets / 60 mL"
                            value={formData.medication.quantity}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                medication: { ...formData.medication, quantity: e.target.value },
                              })
                            }
                          />
                        </div>

                        <div>
                          <label>Dose (each time)</label>
                          <input
                            className="input mt-1"
                            placeholder="e.g., 1 tablet or 5 mL"
                            value={formData.medication.doseEachTime}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                medication: { ...formData.medication, doseEachTime: e.target.value },
                              })
                            }
                          />
                        </div>

                        <div>
                          <label>Frequency</label>
                          <input
                            className="input mt-1"
                            placeholder="e.g., twice daily for 7 days"
                            value={formData.medication.frequency}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                medication: { ...formData.medication, frequency: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="form-grid section-gap">
                        <div>
                          <label>Route of Administration</label>
                          <select
                            className="select mt-1"
                            value={formData.medication.route}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                medication: { ...formData.medication, route: e.target.value },
                              })
                            }
                          >
                            <option value="">Select</option>
                            <option>Oral</option>
                            <option>Topical</option>
                            <option>Eye</option>
                            <option>Ear</option>
                            <option>Subcutaneous</option>
                            <option>Intramuscular</option>
                          </select>
                        </div>

                        <div>
                          <label>Cautions/Precautions</label>
                          <input
                            className="input mt-1"
                            placeholder="e.g., give with food; watch for vomiting"
                            value={formData.medication.cautions}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                medication: { ...formData.medication, cautions: e.target.value },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="md:col-span-2 flex items-center gap-3">
                  <button type="submit" className="btn-yellow">
                    {editingId ? "Save changes" : "Create prescription"}
                  </button>
                  {editingId && (
                    <button type="button" className="link-action link-danger" onClick={cancelEdit}>
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TABLE */}
        <div className="section-gap table-wrap">
          <table>
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
                  <td colSpan="5" style={{ textAlign:"center", color:"#6b7280", padding:"18px" }}>
                    No prescriptions
                  </td>
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
                  <td style={{textAlign:"right", whiteSpace:"nowrap"}}>
                    <button className="link-action" onClick={() => handleDownload(r)}>Download</button>
                    <button className="link-action" onClick={() => handleSend(r)}>Send</button>

                    {!isAdmin && (
                      <>
                        <button className="link-action" onClick={() => startEdit(r)}>Edit</button>
                        <button className="link-action link-danger" onClick={() => handleDelete(r._id)}>Delete</button>
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
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
