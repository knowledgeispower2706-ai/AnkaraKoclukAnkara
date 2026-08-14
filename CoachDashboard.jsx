import React, { useEffect, useState } from "react";
import { Plus, LogOut, Users, ChevronRight, Copy, Check } from "lucide-react";
import { supabase } from "../supabaseClient";
import StudentDataView from "../components/StudentDataView.jsx";

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function CoachDashboard({ profile }) {
  const [students, setStudents] = useState([]);
  const [invites, setInvites] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");

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
    if (!activeId && st && st.length) setActiveId(st[0].id);
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
      <div className="w-60 bg-ink flex flex-col shrink-0">
        <div className="p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <Users size={15} className="text-amber" />
            <span className="font-mono text-[11px] text-[#8FA0B3] tracking-wide">KOÇLUK PANOSU</span>
          </div>
          <h1 className="font-display text-xl font-semibold text-white">Öğrencilerim</h1>
        </div>
        <div className="flex-1 overflow-y-auto px-2.5">
          {students.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className="cursor-pointer rounded-lg px-3 py-2.5 mb-1 flex items-center justify-between"
              style={{
                background: activeId === s.id ? "rgba(227,162,26,0.14)" : "transparent",
                borderLeft: activeId === s.id ? "3px solid #E3A21A" : "3px solid transparent",
              }}
            >
              <div>
                <div className={`font-sans text-sm font-semibold ${activeId === s.id ? "text-white" : "text-[#C7D0DA]"}`}>{s.name}</div>
                <div className="font-sans text-[11px] text-[#7B8AA0]">{s.hedef || "Hedef yok"}</div>
              </div>
              <ChevronRight size={14} color={activeId === s.id ? "#E3A21A" : "#5A6A80"} />
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
            className="w-full border border-dashed border-[#4A5A70] text-[#C7D0DA] rounded-lg py-2.5 font-sans text-sm font-semibold flex items-center justify-center gap-1.5"
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

      <div className="flex-1 p-8 max-w-5xl">
        {!active ? (
          <div className="bg-white border border-grid rounded-lg p-10 text-center font-sans text-muted text-sm">
            Soldan bir öğrenci seç ya da yeni öğrenci ekleyip davet kodunu paylaş.
          </div>
        ) : (
          <StudentDataView studentId={active.id} studentName={active.name} hedef={active.hedef} canEdit={false} />
        )}
      </div>

      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} onAdd={addInvite} />}
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
