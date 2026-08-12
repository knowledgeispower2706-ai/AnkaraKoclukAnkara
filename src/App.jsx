import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Login from "./pages/Login.jsx";
import CoachSignup from "./pages/CoachSignup.jsx";
import StudentSignup from "./pages/StudentSignup.jsx";
import CoachDashboard from "./pages/CoachDashboard.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(session === null ? null : undefined);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error) console.error(error);
      setProfile(data || null);
    })();
  }, [session]);

  if (session === undefined || (session && profile === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <span className="font-sans text-muted text-sm">Yükleniyor…</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Login session={session} profile={profile} />} />
      <Route path="/koc-kayit" element={<CoachSignup />} />
      <Route path="/ogrenci-kayit" element={<StudentSignup />} />
      <Route
        path="/koc"
        element={
          session && profile?.role === "coach" ? (
            <CoachDashboard profile={profile} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/panelim"
        element={
          session && profile?.role === "student" ? (
            <StudentDashboard profile={profile} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
