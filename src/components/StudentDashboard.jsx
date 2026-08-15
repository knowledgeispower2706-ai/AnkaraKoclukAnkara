import React from "react";
import { LogOut } from "lucide-react";
import { supabase } from "../supabaseClient";
import StudentDataView from "../components/StudentDataView.jsx";

export default function StudentDashboard({ profile }) {
  if (!profile) return null;
  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-2 flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted tracking-wide">KOÇLUK PANOSU</span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-muted font-sans text-xs flex items-center gap-1.5 hover:text-ink transition-colors"
        >
          <LogOut size={13} /> Çıkış yap
        </button>
      </div>
      <div className="max-w-6xl mx-auto px-6 pb-8">
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
