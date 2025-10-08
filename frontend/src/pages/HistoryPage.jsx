import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

// Force absolute URL to avoid any baseURL/proxy mismatch
const API_HISTORY_ABS = 'http://localhost:5001/history';

// date helpers (UI dd/mm/yyyy <-> API ISO yyyy-mm-dd)
const isoToDmy = (iso) => {
  if (!iso || typeof iso !== 'string') return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
};

const dmyToIso = (dmy) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((dmy || '').trim());
  if (!m) return null;
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);
  const dt = new Date(yyyy, mm - 1, dd);
  if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return null;
  const mmStr = String(mm).padStart(2, '0');
  const ddStr = String(dd).padStart(2, '0');
  return `${yyyy}-${mmStr}-${ddStr}`;
};

const formatDmyMask = (val) => {
  const digits = (val || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export default function HistoryPage() {
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const [fromDmy, setFromDmy] = useState('');
  const [toDmy, setToDmy] = useState('');
  const fromNativeRef = useRef(null);
  const toNativeRef = useRef(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const fromIso = useMemo(() => dmyToIso(fromDmy) || '', [fromDmy]);
  const toIso = useMemo(() => dmyToIso(toDmy) || '', [toDmy]);

  const search = async (opts = {}) => {
    setLoading(true);
    try {
      const params = {
        q,
        status: status || undefined,
        from: fromIso || undefined,
        to: toIso || undefined,
        page,
        limit,
        ...opts,
      };
      // Use absolute URL to avoid baseURL/proxy issues
      const { data } = await api.get(API_HISTORY_ABS, { params });
      setRows(data.items || []);
      setTotal(data.total || 0);
      setHasMore(!!data.hasMore);
    } catch (err) {
      // Log diagnostic details for quick pinpointing
      console.error('History search error:', {
        message: err.message,
        status: err?.response?.status,
        data: err?.response?.data,
        url: API_HISTORY_ABS,
        params: { q, status, from: fromIso, to: toIso, page, limit },
      });
      // Only alert for network/5xx errors
      if (!err.response || err.response.status >= 500) {
        alert('Search failed, please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initialize default 30-day range (last 30 days)
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 29);
    setFromDmy(isoToDmy(start.toISOString().slice(0, 10)));
    setToDmy(isoToDmy(today.toISOString().slice(0, 10)));
  }, []);

  useEffect(() => {
    if (fromDmy && toDmy) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/bg4.png')",
        backgroundRepeat: 'repeat',
        backgroundSize: 'cover',
      }}
    >
      {/* Semi-transparent overlay (only affects background) */}
      <div className="absolute inset-0 bg-white" style={{ opacity: 0.9 }} aria-hidden="true" />

      {/* Original page conten */}
      <div className="relative z-10">
        <div className="container-page">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">History</h1>
            <p className="text-slate-600">Search by owner name / Phone / Pet name</p>
          </div>

          {/* Search Form — only color enhanced */}
          <div
            className="card mb-6 border rounded-xl"
            style={{
              // Card background and border per request
              backgroundColor: '#a5b4fc',
              borderColor: '#8ea0ff',
            }}
          >
            <div className="card-body">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* text query */}
                <div>
                  {/* Make label darker for readability on the lavender background */}
                  <label className="text-sm font-medium text-slate-800">
                    Search (Owner / Phone / Pet)
                  </label>
                  <input
                    className="input mt-1"
                    placeholder="e.g. John / 089xxx / Milo"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setPage(1);
                        search({ page: 1 });
                      }
                    }}
                  />
                </div>

                {/* status */}
                <div>
                  <label className="text-sm font-medium text-slate-800">Status</label>
                  <select
                    className="select mt-1"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">Total</option>
                    <option value="scheduled">scheduled</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>

                {/* from date */}
                <div>
                  <label className="text-sm font-medium text-slate-800">From date</label>
                  <div className="relative mt-1">
                    <input
                      className="input w-full pr-10"
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={fromDmy}
                      onChange={(e) => setFromDmy(formatDmyMask(e.target.value))}
                      onBlur={() => !dmyToIso(fromDmy) && setFromDmy('')}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-700"
                      onClick={() => {
                        const el = fromNativeRef.current;
                        if (!el) return;
                        if (el.showPicker) el.showPicker();
                        else el.click();
                      }}
                      title="Pick date"
                    >
                      📅
                    </button>
                    {/* invisible native date picker to ensure real calendar popup */}
                    <input
                      ref={fromNativeRef}
                      type="date"
                      style={{
                        position: 'absolute',
                        width: 1,
                        height: 1,
                        padding: 0,
                        margin: -1,
                        overflow: 'hidden',
                        clip: 'rect(0,0,0,0)',
                        whiteSpace: 'nowrap',
                        border: 0,
                      }}
                      onChange={(e) => {
                        const iso = e.target.value;
                        setFromDmy(iso ? isoToDmy(iso) : '');
                      }}
                    />
                  </div>
                </div>

                {/* to date */}
                <div>
                  <label className="text-sm font-medium text-slate-800">To date</label>
                  <div className="relative mt-1">
                    <input
                      className="input w-full pr-10"
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={toDmy}
                      onChange={(e) => setToDmy(formatDmyMask(e.target.value))}
                      onBlur={() => !dmyToIso(toDmy) && setToDmy('')}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-700"
                      onClick={() => {
                        const el = toNativeRef.current;
                        if (!el) return;
                        if (el.showPicker) el.showPicker();
                        else el.click();
                      }}
                      title="Pick date"
                    >
                      📅
                    </button>
                    <input
                      ref={toNativeRef}
                      type="date"
                      style={{
                        position: 'absolute',
                        width: 1,
                        height: 1,
                        padding: 0,
                        margin: -1,
                        overflow: 'hidden',
                        clip: 'rect(0,0,0,0)',
                        whiteSpace: 'nowrap',
                        border: 0,
                      }}
                      onChange={(e) => {
                        const iso = e.target.value;
                        setToDmy(iso ? isoToDmy(iso) : '');
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {/* Search button in F3F58B as requested */}
                <button
                  className="btn text-slate-900"
                  style={{ backgroundColor: '#F3F58B' }}
                  onClick={() => {
                    setPage(1);
                    search({ page: 1 });
                  }}
                  disabled={loading}
                >
                  Search
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setQ('');
                    setStatus('');
                    const today = new Date();
                    const start = new Date();
                    start.setDate(today.getDate() - 29);
                    setFromDmy(isoToDmy(start.toISOString().slice(0, 10)));
                    setToDmy(isoToDmy(today.toISOString().slice(0, 10)));
                    setPage(1);
                    search({ page: 1, q: '', status: '' });
                  }}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Results — only table colors changed */}
          <div className="bg-white rounded-xl shadow border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Result ({total.toLocaleString()} List)
              </h2>
              <div className="flex gap-2">
                <button
                  className="btn"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  ‹ Previous
                </button>
                <button
                  className="btn"
                  disabled={!hasMore || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next ›
                </button>
              </div>
            </div>

            <div className="p-5 overflow-x-auto">
              {loading ? (
                <div className="text-center text-slate-500">Searching...</div>
              ) : rows.length === 0 ? (
                <div className="text-center text-slate-500">No data</div>
              ) : (
                <table className="min-w-[900px] w-full border-collapse">
                  <thead>
                    {/* Table header in #a5b4fc */}
                    <tr style={{ backgroundColor: '#a5b4fc', color: '#1f2937' }}>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Time</th>
                      <th className="px-4 py-2 text-left">Pet</th>
                      <th className="px-4 py-2 text-left">Owner</th>
                      <th className="px-4 py-2 text-left">Phone</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-left">Reason</th>
                      <th className="px-4 py-2 text-left">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr
                        key={r._id}
                        className="border-t border-slate-200"
                        // Alternate row shades using rgba of #a5b4fc for readability
                        style={{
                          backgroundColor:
                            i % 2 === 0
                              ? 'rgba(165,180,252,0.25)'
                              : 'rgba(165,180,252,0.45)',
                        }}
                      >
                        <td className="px-4 py-2">{isoToDmy(r.date) || r.date}</td>
                        <td className="px-4 py-2">{r.time}</td>
                        <td className="px-4 py-2">{r.petId?.name || '—'}</td>
                        <td className="px-4 py-2">{r.ownerId?.name || '—'}</td>
                        <td className="px-4 py-2">{r.ownerId?.phone || '—'}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`badge ${
                              r.status === 'scheduled'
                                ? 'badge-yellow'
                                : r.status === 'completed'
                                ? 'badge-green'
                                : 'badge-red'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">{r.reason || '—'}</td>
                        <td className="px-4 py-2">
                          <button
                            className="btn btn-ghost"
                            onClick={() => navigate('/appointments')}
                          >
                            Open in Appointments
                          </button>
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
    </div>
  );
}
