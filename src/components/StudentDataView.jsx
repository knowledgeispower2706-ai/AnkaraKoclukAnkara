import React, { useEffect, useState } from "react";
import { Plus, LogOut, Users, ChevronRight, Copy, Check, LayoutGrid, TrendingUp, Target, Clock } from "lucide-react";
import { supabase } from "../supabaseClient";
import StudentDataView from "../components/StudentDataView.jsx";
import Avatar from "../components/Avatar.jsx";

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function CoachDashboard({ profile }) {
  const [students, setStudents] = useState([]);
  const [invites, setInvites] = useState([]);
  const [activeId, setActiveId] = useState(null); // null = home overview
  const [showAdd, setShowAdd] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");
  const [studentStats, setStudentStats] = useState({}); // { [studentId]: { weekMinutes, goalPct } }

  const load = async () => {
    if (!profile) return;
    const { data: st } = await supabase.from("profiles").select("*").eq("coach_id", profile.id);
    const { data: inv } = await supabase
      .from("invites")
      .select("*")
      .eq("coach_id", profile.id)
      .eq("used", false)
      .order("created_at", { ascending: false });
    setStudents(st || []);
    setInvites(inv || []);

    const ids = (st || []).map((s) => s.id);
    if (ids.length) {
      const [{ data: allGoals }, { data: allSessions }] = await Promise.all([
        supabase.from("goals").select("student_id,done").in("student_id", ids),
        supabase.from("study_sessions").select("student_id,date,minutes").in("student_id", ids),
      ]);
      const stats = {};
      ids.forEach((id) => (stats[id] = { weekMinutes: 0, goalPct: 0, totalGoals: 0, doneGoals: 0 }));
      (allGoals || []).forEach((g) => {
        const s = stats[g.student_id];
        if (!s) return;
        s.totalGoals += 1;
        if (g.done) s.doneGoals += 1;
      });
      const now = Date.now();
      (allSessions || []).forEach((sess) => {
        const s = stats[sess.student_id];
        if (!s) return;
        if ((now - new Date(sess.date).getTime()) / 86400000 <= 7) s.weekMinutes += sess.minutes;
      });
      ids.forEach((id) => {
        const s = stats[id];
        s.goalPct = s.totalGoals ? Math.round((s.doneGoals / s.totalGoals) * 100) : 0;
      });
      setStudentStats(stats);
    } else {
      setStudentStats({});
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line

  const addInvite = async (name, hedef) => {
    if (!profile) return;
    const code = genCode();
    await supabase.from("invites").insert({ code, coach_id: profile.id, student_name: name, hedef });
    setShowAdd(false);
    load();
  };

  const active = students.find((s) => s.id === activeId);

  const copy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 1500);
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-paper flex">
      <div className="w-64 bg-ink flex flex-col shrink-0">
        <div className="p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <Users size={15} className="text-amber" />
            <span className="font-mono text-[11px] text-[#8FA0B3] tracking-wide">KOÇLUK PANOSU</span>
          </div>
          <h1 className="font-display text-xl font-semibold text-white">Öğrencilerim</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5">
          <div
            onClick={() => setActiveId(null)}
            className="cursor-pointer rounded-lg px-3 py-2.5 mb-2 flex items-center gap-2.5"
            style={{
              background: activeId === null ? "rgba(227,162,26,0.14)" : "transparent",
              borderLeft: activeId === null ? "3px solid #E3A21A" : "3px solid transparent",
            }}
          >
            <LayoutGrid size={15} color={activeId === null ? "#E3A21A" : "#8FA0B3"} />
            <span className={`font-sans text-sm font-semibold ${activeId === null ? "text-white" : "text-[#C7D0DA]"}`}>
              Genel Bakış
            </span>
          </div>

          <p className="font-sans text-[11px] text-[#7B8AA0] uppercase tracking-wide px-3 mb-1.5 mt-3">Öğrenciler</p>
          {students.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className="cursor-pointer rounded-lg px-3 py-2.5 mb-1 flex items-center gap-2.5"
              style={{
                background: activeId === s.id ? "rgba(227,162,26,0.14)" : "transparent",
                borderLeft: activeId === s.id ? "3px solid #E3A21A" : "3px solid transparent",
              }}
            >
              <Avatar name={s.name} size={30} />
              <div className="flex-1 min-w-0">
                <div className={`font-sans text-sm font-semibold truncate ${activeId === s.id ? "text-white" : "text-[#C7D0DA]"}`}>{s.name}</div>
                <div className="font-sans text-[11px] text-[#7B8AA0] truncate">{s.hedef || "Hedef yok"}</div>
              </div>
              <ChevronRight size={14} color={activeId === s.id ? "#E3A21A" : "#5A6A80"} className="shrink-0" />
            </div>
          ))}
          {students.length === 0 && <p className="text-[#7B8AA0] font-sans text-sm px-2 py-2">Henüz öğrenci yok.</p>}

          {invites.length > 0 && (
            <div className="mt-4 px-1">
              <p className="font-sans text-[11px] text-[#7B8AA0] uppercase tracking-wide mb-2">Bekleyen davetler</p>
              {invites.map((i) => (
                <div key={i.code} className="flex items-center justify-between px-2 py-1.5 mb-1 rounded-md bg-[#1E293F]">
                  <div>
                    <div className="font-sans text-xs text-[#C7D0DA]">{i.student_name}</div>
                    <div className="font-mono text-xs text-amber tracking-wider">{i.code}</div>
                  </div>
                  <button onClick={() => copy(i.code)} className="text-[#8FA0B3]">
                    {copiedCode === i.code ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3.5 flex flex-col gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="w-full border border-dashed border-[#4A5A70] text-[#C7D0DA] rounded-lg py-2.5 font-sans text-sm font-semibold flex items-center justify-center gap-1.5 hover:border-amber hover:text-amber transition-colors"
          >
            <Plus size={14} /> Öğrenci Ekle
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full text-[#7B8AA0] rounded-lg py-2 font-sans text-xs flex items-center justify-center gap-1.5"
          >
            <LogOut size={13} /> Çıkış yap
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 max-w-6xl">
        {activeId === null ? (
          <CoachHome profile={profile} students={students} studentStats={studentStats} onSelect={setActiveId} onAddClick={() => setShowAdd(true)} />
        ) : active ? (
          <StudentDataView studentId={active.id} studentName={active.name} hedef={active.hedef} canEdit={false} />
        ) : (
          <div className="bg-white border border-grid rounded-lg p-10 text-center font-sans text-muted text-sm">
            Öğrenci bulunamadı.
          </div>
        )}
      </div>

      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} onAdd={addInvite} />}
    </div>
  );
}

function CoachHome({ profile, students, studentStats, onSelect, onAddClick }) {
  const totalWeekMinutes = Object.values(studentStats).reduce((a, s) => a + (s.weekMinutes || 0), 0);
  const totalGoals = Object.values(studentStats).reduce((a, s) => a + (s.totalGoals || 0), 0);
  const doneGoals = Object.values(studentStats).reduce((a, s) => a + (s.doneGoals || 0), 0);
  const avgProgress = totalGoals ? Math.round((doneGoals / totalGoals) * 100) : 0;

  return (
    <div>
      <div
        className="rounded-xl p-7 relative overflow-hidden"
        style={{ background: "linear-gradient(120deg, #14213D 0%, #1B2E52 55%, #123B39 100%)" }}
      >
        <div className="absolute rounded-full pointer-events-none" style={{ width: 240, height: 240, top: -90, right: 20, background: "#E3A21A", opacity: 0.18, filter: "blur(60px)" }} />
        <div className="absolute rounded-full pointer-events-none" style={{ width: 200, height: 200, bottom: -90, left: 40, background: "#1E9E8A", opacity: 0.22, filter: "blur(60px)" }} />
        <div className="relative">
          <p className="font-sans text-sm text-[#C7D3E6]">Hoş geldin,</p>
          <h1 className="font-display text-3xl
