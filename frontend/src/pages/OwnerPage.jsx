import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5001/owners';

export default function OwnerPage() {
  const [owners, setOwners] = useState([]);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchOwners(); }, []);

  const fetchOwners = async () => {
    try {
      const res = await axios.get(API_BASE);
      setOwners(res.data || []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await axios.put(`${API_BASE}/${editingId}`, formData);
      else await axios.post(API_BASE, formData);
      setFormData({ name: '', phone: '' }); setEditingId(null);
      fetchOwners();
    } catch (err) { console.error(err); alert(err.response?.data?.message || 'Save failed'); }
  };

  const handleEdit = (owner) => {
    setEditingId(owner._id);
    setFormData({ name: owner.name, phone: owner.phone });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this owner?')) return;
    try { await axios.delete(`${API_BASE}/${id}`); fetchOwners(); }
    catch (err) { console.error(err); alert('Delete failed'); }
  };

  const cancelEdit = () => { setEditingId(null); setFormData({ name: '', phone: '' }); };

  return (
    <div className="container-page">
      <div className="mb-4">
        <h1 style={{ margin: 0 }}>Owners</h1>
        <p className="helper">Manage owner records (list / add / edit / delete)</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">{editingId ? 'Edit owner' : 'Add owner'}</div>
        <div className="card-body">
          <form className="form-grid" onSubmit={handleSubmit}>
            <div>
              <label>Name</label>
              <input className="input" placeholder="Owner name"
                     value={formData.name}
                     onChange={(e)=>setFormData({ ...formData, name: e.target.value })}
                     required />
            </div>
            <div>
              <label>Phone</label>
              <input className="input" placeholder="e.g., 0123456789"
                     value={formData.phone}
                     onChange={(e)=>setFormData({ ...formData, phone: e.target.value })}
                     required />
            </div>
            <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update owner' : 'Add owner'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Phone</th><th style={{width:200}}>Actions</th></tr>
          </thead>
          <tbody>
            {owners.length === 0 ? (
              <tr><td className="empty" colSpan="3">No owners</td></tr>
            ) : owners.map((owner) => (
              <tr key={owner._id}>
                <td>{owner.name}</td>
                <td>{owner.phone}</td>
                <td>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button className="btn btn-ghost" onClick={()=>handleEdit(owner)}>Edit</button>
                    <button className="btn btn-danger" onClick={()=>handleDelete(owner._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
