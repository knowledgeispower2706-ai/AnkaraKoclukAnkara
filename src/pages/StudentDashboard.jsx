import React from "react";
import { LogOut } from "lucide-react";
import { supabase } from "../supabaseClient";
import StudentDataView from "../components/StudentDataView.jsx";

export default function StudentDashboard({ profile }) {
  if (!profile) return null;
  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-grid bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] text-muted tracking-wide">KOÇLUK PANOSU</p>
            <h1 className="font-display text-lg font-semibold text-ink">Merhaba, {profile.name}</h1>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-muted font-sans text-xs flex items-center gap-1.5"
          >
            <LogOut size={13} /> Çıkış yap
          </button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <StudentDataView
          studentId={profile.id}
          studentName={profile.name}
          hedef={profile.hedef}
          canEdit={true}
        />
      </div>
    </div>
  );
}
