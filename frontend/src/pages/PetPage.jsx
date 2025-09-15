// frontend/src/pages/PetPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API_PETS = 'http://localhost:5001/pets';
const API_OWNERS = 'http://localhost:5001/owners';

const formatDMY = (value) => {
  if (!value) return '—';
  const s = String(value);
  const base = s.includes('T') ? s.slice(0, 10) : s;
  const parts = base.split(/[-/]/);
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (y && m && d) return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }
  const dt = new Date(value);
  if (!isNaN(dt)) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${d}/${m}/${y}`;
  }
  return '—';
};

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
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
};

const formatDmyMask = (val) => {
  const digits = (val || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export default function PetPage() {
  const [pets, setPets] = useState([]);
  const [owners, setOwners] = useState([]);
  const [formData, setFormData] = useState({ name:'', type:'', breed:'', dob:'', ownerId:'' });
  const [displayDob, setDisplayDob] = useState('');
  const [dobError, setDobError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const nativeDateRef = useRef(null);
  const dobInputRef = useRef(null);

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => {
    const [p, o] = await Promise.all([axios.get(API_PETS), axios.get(API_OWNERS)]);
    setPets(p.data || []); setOwners(o.data || []);
  };

  useEffect(() => {
    setDisplayDob(isoToDmy(formData.dob));
  }, [formData.dob]);

  const validateDob = (dmy) => {
    const iso = dmyToIso(dmy);
    if (!iso) {
      setDobError('Date is required in dd/mm/yyyy.');
      return null;
    }
    setDobError('');
    return iso;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isoFromDisplay = validateDob(displayDob);
    if (!isoFromDisplay) {
      dobInputRef.current?.focus();
      return;
    }
    const payload = { ...formData, dob: isoFromDisplay };
    if (editingId) await axios.put(`${API_PETS}/${editingId}`, payload);
    else await axios.post(API_PETS, payload);
    setFormData({ name:'', type:'', breed:'', dob:'', ownerId:'' });
    setDisplayDob('');
    setEditingId(null);
    fetchAll();
  };

  const handleEdit = (pet) => {
    setEditingId(pet._id);
    const iso = pet.dob ? String(pet.dob).split('T')[0] : '';
    setFormData({
      name: pet.name,
      type: pet.type,
      breed: pet.breed || '',
      dob: iso,
      ownerId: pet.ownerId?._id || pet.ownerId || ''
    });
    setDisplayDob(isoToDmy(iso));
    setDobError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this pet?')) return;
    await axios.delete(`${API_PETS}/${id}`);
    fetchAll();
  };

  const tableHeaderBg = '#a5b4fc';
  const tableHeaderText = '#1f2937';
  const tableRowEven = '#EEF2FF';
  const tableRowOdd = '#DFE4FF';
  const tableBorder = '#C7CEFF';

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/bg5.png')",
        backgroundRepeat: 'repeat',
        backgroundSize: 'cover'
      }}
    >
      <div className="absolute inset-0 bg-white" style={{ opacity: 0.85 }} aria-hidden="true" />
      <div className="relative z-10">
        <div className="container-page">
          <div className="mb-4">
            <h1 style={{ margin: 0 }}>Pets</h1>
            <p className="helper">Manage pet records and link to an owner</p>
          </div>

          <div
            className="card"
            style={{
              marginBottom: 16,
              backgroundColor: '#a5b4fc',
              borderColor: '#8ea0ff'
            }}
          >
            <div className="card-header" style={{ color: '#1f2937' }}>
              {editingId ? 'Edit pet' : 'Add pet'}
            </div>
            <div className="card-body" style={{ background: 'transparent' }}>
              <form className="form-grid" onSubmit={handleSubmit}>
                <div>
                  <label>Pet name</label>
                  <input
                    className="input"
                    value={formData.name}
                    onChange={(e)=>setFormData({ ...formData, name:e.target.value })}
                    placeholder="e.g., Lucky"
                    required
                  />
                </div>
                <div>
                  <label>Type</label>
                  <input
                    className="input"
                    value={formData.type}
                    onChange={(e)=>setFormData({ ...formData, type:e.target.value })}
                    placeholder="Dog, Cat..."
                    required
                  />
                </div>
                <div>
                  <label>Breed</label>
                  <input
                    className="input"
                    value={formData.breed}
                    onChange={(e)=>setFormData({ ...formData, breed:e.target.value })}
                    placeholder="(optional)"
                  />
                </div>
                <div>
                  <label>Date of birth</label>
                  <div className="relative">
                    <input
                      ref={dobInputRef}
                      className="input w-full pr-10"
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="dd/mm/yyyy"
                      value={displayDob}
                      aria-invalid={!!dobError}
                      onChange={(e) => {
                        const masked = formatDmyMask(e.target.value);
                        setDisplayDob(masked);
                        const iso = dmyToIso(masked);
                        setFormData(prev => ({ ...prev, dob: iso || '' }));
                        if (masked.length === 0 || masked.length === 10) {
                          if (!iso) setDobError('Date is required in dd/mm/yyyy.');
                          else setDobError('');
                        } else {
                          setDobError('');
                        }
                      }}
                      onBlur={() => {
                        const iso = dmyToIso(displayDob);
                        if (!iso) setDobError('Date is required in dd/mm/yyyy.');
                        else setDobError('');
                        setFormData(prev => ({ ...prev, dob: iso || '' }));
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                      aria-label="Open calendar"
                      onClick={() => {
                        const el = nativeDateRef.current;
                        if (!el) return;
                        if (el.showPicker) el.showPicker();
                        else el.click();
                      }}
                    >
                      📅
                    </button>
                    <input
                      ref={nativeDateRef}
                      type="date"
                      style={{
                        position: 'absolute',
                        width: 1, height: 1, padding: 0, margin: -1,
                        overflow: 'hidden', clip: 'rect(0,0,0,0)',
                        whiteSpace: 'nowrap', border: 0
                      }}
                      value={formData.dob}
                      onChange={(e) => {
                        const iso = e.target.value;
                        setFormData(prev => ({ ...prev, dob: iso || '' }));
                        setDisplayDob(iso ? isoToDmy(iso) : '');
                        setDobError(iso ? '' : 'Date is required in dd/mm/yyyy.');
                      }}
                    />
                  </div>
                  {dobError && (
                    <div style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>
                      {dobError}
                    </div>
                  )}
                </div>
                <div>
                  <label>Owner</label>
                  <select
                    className="select"
                    value={formData.ownerId}
                    onChange={(e)=>setFormData({ ...formData, ownerId: e.target.value })}
                    required
                  >
                    <option value="">Select owner</option>
                    {owners.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                  </select>
                </div>
                <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      backgroundColor: '#F3F58B',
                      borderColor: '#F3F58B',
                      color: '#111827'
                    }}
                  >
                    {editingId ? 'Update pet' : 'Add pet'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingId(null);
                        setFormData({ name:'', type:'', breed:'', dob:'', ownerId:'' });
                        setDisplayDob('');
                        setDobError('');
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="table-wrap">
            <table
              className="table"
              style={{
                borderColor: tableBorder,
                borderWidth: 1,
                borderStyle: 'solid',
                width: '100%',
                borderRadius: 12,
                overflow: 'hidden'
              }}
            >
              <thead>
                <tr style={{ backgroundColor: tableHeaderBg, color: tableHeaderText }}>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Breed</th>
                  <th>DOB</th>
                  <th>Owner</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pets.length === 0 ? (
                  <tr><td className="empty" colSpan="6">No pets</td></tr>
                ) : pets.map((pet, idx) => (
                  <tr
                    key={pet._id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? tableRowEven : tableRowOdd,
                      borderColor: tableBorder,
                      borderTopWidth: 1,
                      borderTopStyle: 'solid'
                    }}
                  >
                    <td>{pet.name}</td>
                    <td>{pet.type}</td>
                    <td>{pet.breed || '—'}</td>
                    <td>{formatDMY(pet.dob)}</td>
                    <td>{pet.ownerId?.name || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-ghost"
                          style={{
                            backgroundColor: '#F3F58B',
                            borderColor: '#F3F58B',
                            color: '#111827'
                          }}
                          onClick={() => handleEdit(pet)}
                        >
                          Edit
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDelete(pet._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
