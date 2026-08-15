import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import AuthLayout from "../components/AuthLayout.jsx";

export default function StudentSignup() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: "student", invite_code: code.trim().toUpperCase() } },
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      navigate("/panelim");
      return;
    }

    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <AuthLayout>
        <div className="text-center">
          <h2 className="font-display text-xl font-semibold text-ink mb-2">E-postanı kontrol et</h2>
          <p className="font-sans text-sm text-muted">
            Kayıt onay e-postası gönderildi. Onayladıktan sonra giriş yapıp panelin otomatik açılacak.
          </p>
          <Link to="/" className="text-teal text-sm font-medium mt-4 inline-block hover:underline">
            Girişe dön →
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">Öğrenci Kaydı</h1>
      <p className="font-sans text-sm text-muted mb-6">Koçundan aldığın davet kodunu gir.</p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Davet Kodu" value={code} onChange={setCode} />
        <Field label="E-posta" type="email" value={email} onChange={setEmail} />
        <Field label="Şifre" type="password" value={password} onChange={setPassword} />
        {error && (
          <p className="text-coral text-xs font-sans bg-[rgba(193,72,60,0.06)] border border-[rgba(193,72,60,0.2)] rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <button
          disabled={loading}
          className="bg-ink text-white font-sans font-semibold text-sm rounded-md py-2.5 mt-1 disabled:opacity-60 hover:opacity-90 transition-opacity"
        >
          {loading ? "Kaydediliyor…" : "Kayıt ol"}
        </button>
      </form>
      <Link to="/" className="font-sans text-sm text-muted mt-5 inline-block hover:text-ink transition-colors">
        ← Girişe dön
      </Link>
    </AuthLayout>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="font-sans text-xs font-semibold uppercase tracking-wide text-muted block mb-1">
        {label}
      </label>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-grid rounded-md px-3 py-2.5 text-sm font-sans outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-shadow"
      />
    </div>
  );
}
