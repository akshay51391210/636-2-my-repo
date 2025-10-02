import React, { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api/axios";
import generateInvoicePDF from "../utils/generateInvoicePDF";

export default function AdminInvoice() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // calls only completed appointment
  const fetchCompletedAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/appointments", {
        params: { status: "completed" },
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch completed appointments:", err);
      if (err?.response?.status === 401) {
        alert("Session expired or not authorized. Please log in again.");
      } else {
        alert("Error loading invoice records.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedAppointments();
  }, [fetchCompletedAppointments]);

  // calculates money+tax+discount
  const table = useMemo(() => {
    return rows.map((a) => {
      const subtotal =
        a?.billing?.subtotal ??
        a?.amount ??
        a?.total ??
        a?.price ??
        0;

      // taxRate e.g. 0.07 = 7%
      const taxRate = a?.billing?.taxRate ?? a?.taxRate ?? 0;
      const discount = a?.billing?.discount ?? a?.discount ?? 0;

      const tax = +(subtotal * taxRate).toFixed(2);
      const grandTotal = +(subtotal + tax - discount).toFixed(2);

      return {
        id: a._id,
        date: a.date,
        time: a.time,
        ownerName: a.ownerId?.name ?? "-",
        ownerPhone: a.ownerId?.phone ?? "-",
        petName: a.petId?.name ?? "-",
        status: a.status ?? "-",
        subtotal,
        taxRate,
        tax,
        discount,
        total: grandTotal,
        raw: {
          ...a,
          billing: {
            ...(a.billing || {}),
            subtotal,
            taxRate,
            tax,
            discount,
            total: grandTotal,
          },
        },
      };
    });
  }, [rows]);

  //Set Billing
  const setBilling = async (row) => {
    const cur = row.raw?.billing || {};

    const subtotal =
      Number(prompt("Subtotal (AUD):", cur.subtotal ?? row.subtotal ?? 0)) || 0;

    const taxRatePercent =
      Number(
        prompt(
          "Tax rate %:",
          ((cur.taxRate ?? row.taxRate ?? 0) * 100).toString()
        )
      ) || 0;

    const discount =
      Number(prompt("Discount (AUD):", cur.discount ?? row.discount ?? 0)) || 0;

    const taxRate = taxRatePercent / 100;
    const tax = +(subtotal * taxRate).toFixed(2);
    const total = +(subtotal + tax - discount).toFixed(2);

    setRows((prev) =>
      prev.map((a) =>
        a._id === row.id
          ? { ...a, billing: { subtotal, taxRate, tax, discount, total } }
          : a
      )
    );

    try {
      await api.patch(`/appointments/${row.id}`, {
        billing: { subtotal, taxRate, tax, discount, total },
      });
    } catch (e) {
      console.warn("PATCH /appointments/:id billing failed (FE-only for now)", e);
    }
  };

  //Download PDF
  const onDownload = (row) => {
    try {
      generateInvoicePDF(row.raw);
    } catch (e) {
      console.error("PDF error:", e);
      alert("Failed to generate PDF");
    }
  };

  // Delete
  const onDelete = async (row) => {
    const ok = window.confirm(
      `Delete invoice/appointment of ${row.ownerName} (${row.petName}) on ${row.date}?`
    );
    if (!ok) return;

    setRows((prev) => prev.filter((a) => a._id !== row.id));

    try {
      await api.delete(`/appointments/${row.id}`);
    } catch (e) {
      console.error("DELETE /appointments/:id failed", e);
      alert("Delete failed on server. Restoring the row.");
      await fetchCompletedAppointments();
    }
  };

  const statusClass = (s) => {
    const v = (s || "").toLowerCase();
    if (v === "completed" || v === "success") return "bg-green-500 text-white";
    if (v === "cancelled" || v === "canceled") return "bg-rose-500 text-white";
    return "bg-amber-500 text-black"; // waiting/scheduled
  };

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: "url('/paws.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "1800px 1200px",
        backgroundColor: "rgba(255,255,255,0.85)",
        backgroundBlendMode: "lighten",
      }}
    >
      <main
        className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 relative z-10"
        style={{ transform: "scale(1.2)", transformOrigin: "top center" }}
      >
        {/* Welcome + Refresh */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Welcome <span role="img" aria-label="wave">👋</span>
            </h2>
            <p className="text-gray-600">Invoice Records Page</p>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-indigo-700">
            Invoice Records
          </h1>
          <p className="text-gray-500">
            Manage and download invoices for all completed appointments
          </p>
        </div>

        {/* table */}
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-indigo-200">
          {loading ? (
            <div className="p-8 text-center text-slate-700">Loading...</div>
          ) : table.length === 0 ? (
            <div className="p-8 text-center text-slate-700">
              No completed appointments
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-indigo-300 text-gray-800">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Owner</th>
                    <th className="px-6 py-3">Pet</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Subtotal</th>
                    <th className="px-6 py-3">Tax</th>
                    <th className="px-6 py-3">Discount</th>
                    <th className="px-6 py-3">Total (AUD)</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((r, idx) => (
                    <tr
                      key={r.id}
                      className={idx % 2 === 0 ? "bg-indigo-100" : "bg-indigo-200"}
                    >
                      <td className="px-6 py-3">{r.date}</td>
                      <td className="px-6 py-3">{r.time}</td>
                      <td className="px-6 py-3">
                        {r.ownerName}{" "}
                        <span className="text-gray-500">({r.ownerPhone})</span>
                      </td>
                      <td className="px-6 py-3">{r.petName}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`${statusClass(
                            r.status
                          )} px-3 py-1 rounded-full text-xs font-bold`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-3">{r.subtotal.toFixed(2)}</td>
                      <td className="px-6 py-3">
                        {r.tax.toFixed(2)}{" "}
                        <span className="text-gray-600">
                          ({(r.taxRate * 100).toFixed(0)}%)
                        </span>
                      </td>
                      <td className="px-6 py-3">-{r.discount.toFixed(2)}</td>
                      <td className="px-6 py-3 font-semibold">
                        {r.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right space-x-3">
                        <button
                          onClick={() => setBilling(r)}
                          className="underline font-semibold text-indigo-700"
                          title="Set billing values"
                        >
                          Set Billing
                        </button>
                        <button
                          onClick={() => onDownload(r)}
                          className="underline font-semibold text-indigo-700"
                          title="Download invoice PDF"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => onDelete(r)}
                          className="text-rose-700 underline font-semibold"
                          title="Delete appointment"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
