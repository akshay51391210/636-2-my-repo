import React, { useEffect, useState } from "react";
import axios from "axios";
import generateInvoicePDF from '../utils/generateInvoicePDF';


export default function AdminInvoice() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchCompletedAppointments = async () => {
      try {
        const res = await axios.get("http://localhost:5001/appointments?status=completed");
        const data = res.data || [];

        const formattedRows = data.map((item) => ({
          date: formatDate(item.date),
          name: item.petId?.name || "—",
          type: item.petId?.type || "—",
          status: item.status || "—",
        }));

        setRows(formattedRows);
      } catch (err) {
        console.error("Failed to fetch completed appointments:", err);
        alert("Error loading invoice records.");
      }
    };

    fetchCompletedAppointments();
  }, []);

  const formatDate = (isoDate) => {
    if (!isoDate) return "—";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
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
            style={{
                transform: "scale(1.2)",
                transformOrigin: "top center",
            }}
        >
            {/* Welcome */}
            <div className="mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    Welcome <span role="img" aria-label="wave">👋</span>
                </h2>
                <p className="text-gray-600">Invoice Records Page</p>
            </div>

            {/* Headline */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-indigo-700">
                    Invoice Records
                </h1>
                <p className="text-gray-500">
                    Manage and download invoices for all appointments
                </p>
            </div>

            {/* Table */}
            <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-indigo-200">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-indigo-300 text-gray-800">
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Download</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center py-6 text-gray-500">
                                    No completed appointments found.
                                </td>
                            </tr>
                        ) : (
                            rows.map((r, idx) => (
                                <tr
                                    key={idx}
                                    className={idx % 2 === 0 ? "bg-indigo-100" : "bg-indigo-200"}
                                >
                                    <td className="px-6 py-3">{r.date}</td>
                                    <td className="px-6 py-3">{r.name}</td>
                                    <td className="px-6 py-3">{r.type}</td>
                                    <td className="px-6 py-3">
                                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            className="underline font-semibold text-indigo-700"
                                            onClick={() => generateInvoicePDF(r)}
                                        >
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    </div>
);
}
