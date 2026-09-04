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
          <h1 className="font-display text-3xl font-semibold text-white mt-0.5">{profile.name}</h1>
          <p className="font-sans text-sm text-[#C7D3E6] mt-2 max-w-md">
            {students.length === 0
              ? "Henüz öğrencin yok — hemen ilk öğrenciyi ekleyip davet kodunu paylaşabilirsin."
              : `Şu an ${students.length} öğrenciyi takip ediyorsun.`}
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-3 mt-6 max-w-lg">
          <HomeStat icon={Users} label="Öğrenci" value={students.length} color="#8CB3FF" />
          <HomeStat icon={Clock} label="Bu hafta (tümü)" value={`${Math.round((totalWeekMinutes / 60) * 10) / 10} sa`} color="#5CC9B0" />
          <HomeStat icon={Target} label="Ort. hedef ilerlemesi" value={`${avgProgress}%`} color="#FFB84D" />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-ink">Öğrencilerin</h2>
          {students.length > 0 && (
            <button onClick={onAddClick} className="font-sans text-xs font-semibold text-teal flex items-center gap-1">
              <Plus size={13} /> Yeni öğrenci ekle
            </button>
          )}
        </div>

        {students.length === 0 ? (
          <div className="bg-white border border-dashed border-grid rounded-lg p-10 text-center">
            <p className="font-sans text-sm text-muted mb-3">Henüz hiç öğrenci eklemedin.</p>
            <button onClick={onAddClick} className="bg-ink text-white font-sans font-semibold text-sm rounded-md px-4 py-2 inline-flex items-center gap-1.5">
              <Plus size={14} /> İlk öğrenciyi ekle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {students.map((s) => {
              const stat = studentStats[s.id] || { weekMinutes: 0, goalPct: 0 };
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className="bg-white border border-grid rounded-lg p-4 text-left hover:border-teal hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} size={40} />
                    <div className="min-w-0">
                      <div className="font-sans text-sm font-semibold text-ink truncate">{s.name}</div>
                      <div className="font-sans text-xs text-muted truncate">{s.hedef || "Hedef belirtilmedi"}</div>
                    </div>
                  </div>
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-sans text-[11px] text-muted">Hedef ilerlemesi</span>
                      <span className="font-mono text-[11px] font-semibold text-ink">{stat.goalPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#EEF1F0] overflow-hidden">
                      <div className="h-full rounded-full bg-teal" style={{ width: `${stat.goalPct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <TrendingUp size={12} className="text-muted" />
                    <span className="font-mono text-[11px] text-muted">
                      Bu hafta {Math.round((stat.weekMinutes / 60) * 10) / 10} sa çalıştı
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function HomeStat({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
      <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ background: `${color}2A` }}>
        <Icon size={15} color={color} />
      </div>
      <div>
        <div className="font-sans text-[10px] text-[#B7C2D6] leading-none">{label}</div>
        <div className="font-mono text-base font-semibold text-white leading-tight mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function AddStudentModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [hedef, setHedef] = useState("");
  return (
    <div className="fixed inset-0 bg-[rgba(20,33,61,0.45)] flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h3 className="font-display text-lg font-semibold text-ink mb-3.5">Yeni Öğrenci</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="font-sans text-xs font-semibold uppercase tracking-wide text-muted block mb-1">Ad Soyad</label>
            <input className="w-full border border-grid rounded-md px-3 py-2 text-sm font-sans outline-none focus:border-teal" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="font-sans text-xs font-semibold uppercase tracking-wide text-muted block mb-1">Hedef (opsiyonel)</label>
            <input className="w-full border border-grid rounded-md px-3 py-2 text-sm font-sans outline-none focus:border-teal" value={hedef} onChange={(e) => setHedef(e.target.value)} placeholder="Örn: Tıp Fakültesi — YKS 2027" />
          </div>
          <p className="font-sans text-xs text-muted">
            Öğrenci eklendiğinde bir davet kodu üretilir. Bu kodu öğrenciyle paylaş; öğrenci "Öğrenci olarak kayıt ol" sayfasından kendi hesabını açar.
          </p>
          <div className="flex gap-2 mt-1">
            <button onClick={() => name && onAdd(name, hedef)} className="flex-1 bg-ink text-white font-sans font-semibold text-sm rounded-md py-2.5">Davet Oluştur</button>
            <button onClick={onClose} className="flex-1 border border-grid text-muted font-sans font-semibold text-sm rounded-md py-2.5">Vazgeç</button>
          </div>
        </div>
      </div>
    </div>
  );
}
