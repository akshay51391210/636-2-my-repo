// frontend/src/api/axios.js
import axios from 'axios';

function resolveBaseURL() {
  // ใช้ค่าจาก .env ถ้ามี
  const fromEnv = process.env.REACT_APP_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  // dev local
  if (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5001/api';
  }

  // เสิร์ฟ FE ผ่าน BE (same-origin)
  if (typeof window !== 'undefined') return `${window.location.origin}/api`;

  return 'http://localhost:5001/api';
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  // เราใช้ Bearer token (localStorage) ไม่ใช้คุกกี้ → ปิด credentials
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;
