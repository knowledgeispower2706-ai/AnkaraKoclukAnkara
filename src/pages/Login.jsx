import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AuthLayout from "../components/AuthLayout.jsx";

export default function Login({ session, profile }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session && profile) {
    return <Navigate to={profile.role === "coach" ? "/koc" : "/panelim"} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Tekrar hoş geldin</h1>
      <p className="font-sans text-sm text-muted mb-6">Hesabınla giriş yap.</p>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <label className="font-sans text-xs font-semibold uppercase tracking-wide text-muted block mb-1">
            E-posta
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-grid rounded-md px-3 py-2.5 text-sm font-sans outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-shadow"
          />
        </div>
        <div>
          <label className="font-sans text-xs font-semibold uppercase tracking-wide text-muted block mb-1">
            Şifre
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-grid rounded-md px-3 py-2.5 text-sm font-sans outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-shadow"
          />
        </div>
        {error && (
          <p className="text-coral text-xs font-sans bg-[rgba(193,72,60,0.06)] border border-[rgba(193,72,60,0.2)] rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-ink text-white font-sans font-semibold text-sm rounded-md py-2.5 mt-1 disabled:opacity-60 hover:opacity-90 transition-opacity"
        >
          {loading ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-grid flex flex-col gap-2.5">
        <Link to="/koc-kayit" className="font-sans text-sm text-teal font-medium hover:underline">
          Koç olarak kayıt ol →
        </Link>
        <Link to="/ogrenci-kayit" className="font-sans text-sm text-teal font-medium hover:underline">
          Öğrenci olarak kayıt ol (davet kodu ile) →
        </Link>
      </div>
    </AuthLayout>
  );
}
