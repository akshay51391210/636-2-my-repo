import React from "react";

export default function AdminPrescription() {
  // Dummy prescription rows
  const rows = [
    { date: "13/09/2025", name: "Tommy", type: "Cat", status: "Completed" },
    { date: "14/09/2025", name: "Devid", type: "Dog", status: "Completed" },
    { date: "15/09/2025", name: "Jack", type: "Dog", status: "Completed" },
    { date: "16/09/2025", name: "Lucy", type: "Bird", status: "Completed" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        backgroundImage: "url('/paws.png')", // from public/paws.png
        backgroundRepeat: "repeat",
        backgroundSize: "1800px 1200px",
        backgroundColor: "rgba(255,255,255,0.85)",
        backgroundBlendMode: "lighten",
      }}
    >
      <main
        className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 relative z-10"
        style={{
          transform: "scale(1.2)",         // ⬅ ขยาย 20%
          transformOrigin: "top center",   // ⬅ ขยายจากตรงกลางด้านบน
        }}
      >
        {/* Left-aligned Welcome */}
        <div className="mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Welcome <span role="img" aria-label="wave">👋</span>
          </h2>
          <p className="text-gray-600">Prescription Records Page</p>
        </div>

        {/* Centered headline + description */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-indigo-700">
            Prescription Records
          </h1>
          <p className="text-gray-500">
            Manage and send prescriptions for all appointments
          </p>
        </div>

        {/* Prescription card */}
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-indigo-200">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-indigo-300 text-gray-800">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
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
                  <td className="px-6 py-3 text-right space-x-4">
                    <button className="underline font-semibold text-indigo-700">
                      Download
                    </button>
                    <button className="underline font-semibold text-indigo-700">
                      Send
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
