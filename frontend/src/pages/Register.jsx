// frontend/src/pages/Register.jsx
import React, { useState } from "react";
import api from "../api/axios";
import { setToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", form);
      if (res.data?.token) setToken(res.data.token);
      nav("/profile");
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Registration failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        backgroundColor: "#ffffff",
        fontFamily: "Tuffy, sans-serif",
      }}
    >
      {/* 🐾 Background Pets */}
      <img
        src="/pet5.png"
        alt="pet5"
        className="absolute"
        style={{ left: "70%", bottom: "55%", width: "460px" }}
      />
      <img
        src="/bg2.png"
        alt="bg2"
        className="absolute"
        style={{ right: "18%", top: "-5%", width: "1600px", height: "1950" }}
      />

      {/* Register Card */}
      <div
        className="rounded-2xl shadow-lg p-10 relative z-10"
        style={{
          backgroundColor: "#9DB4E5",
          width: "560px",
          height: "520px",
        }}
      >
        <h1
          className="text-center mb-6"
          style={{
            fontFamily: "Cherry Bomb One, cursive",
            fontSize: "28px",
            fontWeight: "bold",
          }}
        >
          Create Account
        </h1>

        {errorMsg && (
          <div
            style={{
              background: "#ffe9e9",
              color: "#a40000",
              padding: 10,
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            {errorMsg}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div>
            <label>Name</label>
            <input
              className="w-full rounded-lg px-3 py-2 border"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label>Email</label>
            <input
              className="w-full rounded-lg px-3 py-2 border"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label>Password</label>
            <input
              className="w-full rounded-lg px-3 py-2 border"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              disabled={loading}
            />
          </div>
          <div className="flex gap-4 justify-center mt-2">
            <button
              type="submit"
              className="rounded-full px-6 py-2"
              style={{
                backgroundColor: "#F3F58B",
                fontFamily: "Cherry Bomb One, cursive",
                fontWeight: "bold",
              }}
              disabled={loading}
            >
              {loading ? "Creating..." : "Sign up 🐶"}
            </button>
            <button
              type="button"
              onClick={() => nav("/login")}
              className="rounded-full px-6 py-2"
              style={{
                backgroundColor: "#F3F58B",
                fontFamily: "Cherry Bomb One, cursive",
                fontWeight: "bold",
              }}
              disabled={loading}
            >
              Back to login
            </button>
          </div>
        </form>
      </div>

      {/* Note */}
      <p className="mt-4 text-sm relative z-10">
        Password must be strong enough.
      </p>
    </div>
  );
}
