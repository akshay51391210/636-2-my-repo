import React, { useEffect, useCallback, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5001/owners';

const PURPLE_BG = '#a5b4fc';
const PURPLE_BORDER = '#8ea0ff';
const ROW_EVEN = 'rgba(165,180,252,0.20)';
const ROW_ODD  = 'rgba(165,180,252,0.35)';
const TEXT_DARK = '#111827';
const BTN_YELLOW = '#F3F58B';

export default function OwnerPage() {
  const { user } = useAuth();
  const [owners, setOwners] = useState([]);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [editingId, setEditingId] = useState(null);

  const getToken = () => localStorage.getItem('token');

  const fetchOwners = useCallback(async () => {
    try {
      const token = getToken();
      const res = await axios.get(API_BASE, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setOwners(res.data || []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to fetch owners');
    }
  }, []);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getToken();
      if (editingId) {
        await axios.put(`${API_BASE}/${editingId}`, formData, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      } else {
        await axios.post(API_BASE, formData, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      }
      setFormData({ name: '', phone: '' });
      setEditingId(null);
      fetchOwners();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Save failed');
    }
  };

  const handleEdit = (owner) => {
    setEditingId(owner._id);
    setFormData({ name: owner.name, phone: owner.phone });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this owner?')) return;
    try {
      const token = getToken();
      await axios.delete(`${API_BASE}/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      fetchOwners();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '' });
  };

  const isOwner = user?.role === 'owner';

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/bg6.png')",
        backgroundRepeat: 'repeat',
        backgroundSize: 'cover',
      }}
    >
      <div className="absolute inset-0 bg-white" style={{ opacity: 0.97 }} aria-hidden="true" />

      <div className="relative z-10">
        <div className="container-page">
          <div className="mb-4">
            <h1 style={{ margin: 0 }}>Owners</h1>
            <p className="helper">
              {isOwner
                ? 'Manage your owner profile'
                : 'Manage owner records (list / add / edit / delete)'}
            </p>
          </div>

          <div
            className="card"
            style={{
              marginBottom: 16,
              backgroundColor: PURPLE_BG,
              border: `1px solid ${PURPLE_BORDER}`,
            }}
          >
            <div className="card-header" style={{ color: TEXT_DARK, fontWeight: 700 }}>
              {editingId ? 'Edit owner' : 'Add owner'}
            </div>

            <div className="card-body">
              <form className="form-grid" onSubmit={handleSubmit}>
                <div>
                  <label>Name</label>
                  <input
                    className="input"
                    placeholder="Owner name"
                    value={formData.name}
                    onChange={(e)=>setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Phone</label>
                  <input
                    className="input"
                    placeholder="e.g., 0123456789"
                    value={formData.phone}
                    onChange={(e)=>setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      backgroundColor: BTN_YELLOW,
                      borderColor: BTN_YELLOW,
                      color: '#111',
                      fontWeight: 700,
                    }}
                  >
                    {editingId ? 'Update owner' : 'Add owner'}
                  </button>

                  {editingId && (
                    <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr
                  style={{
                    backgroundColor: PURPLE_BG,
                    color: TEXT_DARK,
                    fontWeight: 700,
                  }}
                >
                  <th>Name</th>
                  <th>Phone</th>
                  <th style={{ width: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {owners.length === 0 ? (
                  <tr>
                    <td className="empty" colSpan="3">
                      {isOwner
                        ? 'No owner profile found. Please create one.'
                        : 'No owners'}
                    </td>
                  </tr>
                ) : (
                  owners.map((owner, idx) => (
                    <tr
                      key={owner._id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? ROW_EVEN : ROW_ODD,
                      }}
                    >
                      <td>{owner.name}</td>
                      <td>{owner.phone}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-ghost"
                            onClick={() => handleEdit(owner)}
                            style={{
                              backgroundColor: BTN_YELLOW,
                              borderColor: BTN_YELLOW,
                              color: '#111',
                              fontWeight: 700,
                            }}
                          >
                            Edit
                          </button>

                          {!isOwner && (
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDelete(owner._id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
