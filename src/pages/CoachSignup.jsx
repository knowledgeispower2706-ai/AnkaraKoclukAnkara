import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function CoachSignup() {
  const [name, setName] = useState("");
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
      options: { data: { role: "coach", name } },
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      // Oturum hemen açıldı (e-posta onayı kapalı) — App.jsx profili otomatik oluşturur.
      navigate("/koc");
      return;
    }
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="max-w-sm text-center font-sans">
          <h2 className="font-display text-xl font-semibold text-ink mb-2">E-postanı kontrol et</h2>
          <p className="text-sm text-muted">
            Kayıt onay e-postası gönderildi. Onayladıktan sonra giriş yapıp profilini tamamlayabilirsin.
          </p>
          <Link to="/" className="text-teal text-sm font-medium mt-4 inline-block">Girişe dön →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-grid rounded-lg p-8">
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">Koç Kaydı</h1>
        <p className="font-sans text-sm text-muted mb-6">Öğrencilerini takip etmeye başla.</p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="Ad Soyad" value={name} onChange={setName} />
          <Field label="E-posta" type="email" value={email} onChange={setEmail} />
          <Field label="Şifre" type="password" value={password} onChange={setPassword} />
          {error && <p className="text-coral text-xs font-sans">{error}</p>}
          <button
            disabled={loading}
            className="bg-ink text-white font-sans font-semibold text-sm rounded-md py-2.5 mt-1 disabled:opacity-60"
          >
            {loading ? "Kaydediliyor…" : "Kayıt ol"}
          </button>
        </form>
        <Link to="/" className="font-sans text-sm text-muted mt-5 inline-block">← Girişe dön</Link>
      </div>
    </div>
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
        className="w-full border border-grid rounded-md px-3 py-2 text-sm font-sans outline-none focus:border-teal"
      />
    </div>
  );
}
