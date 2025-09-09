import React, { useState } from 'react';
import api from '../api/axios';
import { setToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg(''); setLoading(true);
    try {
      const res = await api.post('/api/auth/register', form);
      if (res.data?.token) setToken(res.data.token);
      nav('/profile');
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Registration failed');
      console.error(err);
    } finally { setLoading(false); }
  };

  return (
    <div className="container-page" style={{ maxWidth: 420 }}>
      <div className="card">
        <div className="card-header">Create account</div>
        <div className="card-body">
          {errorMsg && (
            <div style={{ background:'#ffe9e9', color:'#a40000', padding:10, borderRadius:10, marginBottom:10 }}>
              {errorMsg}
            </div>
          )}
          <form className="form-grid" onSubmit={submit}>
            <div className="sm:col-span-2">
              <label>Name</label>
              <input className="input" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required />
            </div>
            <div className="sm:col-span-2">
              <label>Email</label>
              <input className="input" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
            </div>
            <div className="sm:col-span-2">
              <label>Password</label>
              <input className="input" type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} required />
            </div>
            <div className="form-actions sm:col-span-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create account'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={()=>nav('/login')} disabled={loading}>
                Back to login
              </button>
            </div>
          </form>
        </div>
      </div>
      <p className="helper" style={{ marginTop: 8 }}>Password must be strong enough.</p>
    </div>
  );
}
