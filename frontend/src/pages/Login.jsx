import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { setToken } from '../utils/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
  e.preventDefault();
  setErrorMsg('');
  setLoading(true);
  try {
    // login → call /api/auth/login
    const res = await api.post('/api/auth/login', form);
    if (res.data?.token) {
      setToken(res.data.token);

      // get profile
      let me;
      try {
        me = await api.get('/api/auth/me');
      } catch {
        me = await api.get('/api/auth/profile');
      }
      login(me.data);

      // Dashboard
      nav('/dashboard');
    } else {
      setErrorMsg('Login response missing token');
    }
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401) setErrorMsg('Invalid email or password');
    else setErrorMsg(err?.response?.data?.message || 'Error during login');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="container-page" style={{ maxWidth: 420 }}>
      <div className="card">
        <div className="card-header">Login</div>
        <div className="card-body">
          {errorMsg && (
            <div style={{ background:'#ffe9e9', color:'#a40000', padding:10, borderRadius:10, marginBottom:10 }}>
              {errorMsg}
            </div>
          )}
          <form className="form-grid" onSubmit={submit}>
            <div className="sm:col-span-2">
              <label>Email</label>
              <input className="input" type="email" value={form.email} onChange={onChange('email')} required disabled={loading} />
            </div>
            <div className="sm:col-span-2">
              <label>Password</label>
              <input className="input" type="password" value={form.password} onChange={onChange('password')} required disabled={loading} />
            </div>
            <div className="form-actions sm:col-span-2">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => nav('/register')} disabled={loading}>
                Create account
              </button>
            </div>
          </form>
        </div>
      </div>
      <p className="helper" style={{ marginTop: 8 }}>Use your registered email and password.</p>
    </div>
  );
}
