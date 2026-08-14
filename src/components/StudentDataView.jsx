import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, X, Check, Clock, Award, Target, TrendingUp, BookOpen, MessageSquare,
  Smile, Meh, Frown,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { supabase } from "../supabaseClient";

const DEFAULT_SUBJECTS = ["Türkçe", "Matematik", "Fen Bilimleri", "Sosyal Bilimler", "İngilizce"];
const SUBJECT_COLORS = ["#1E6E63", "#E3A21A", "#C1483C", "#3D5A80", "#8A5A44", "#5B7B4F"];
const MOODS = [
  { key: "iyi", label: "İyi", icon: Smile, color: "#1E6E63" },
  { key: "notr", label: "Nötr", icon: Meh, color: "#E3A21A" },
  { key: "zor", label: "Zorlandı", icon: Frown, color: "#C1483C" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function fmtDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

export default function StudentDataView({ studentId, studentName, hedef, canEdit }) {
  const [tab, setTab] = useState("genel");
  const [sessions, setSessions] = useState([]);
  const [exams, setExams] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [s, e, g, n] = await Promise.all([
      supabase.from("study_sessions").select("*").eq("student_id", studentId).order("date", { ascending: false }),
      supabase.from("exam_results").select("*").eq("student_id", studentId).order("date", { ascending: false }),
      supabase.from("goals").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
      supabase.from("notes").select("*").eq("student_id", studentId).order("date", { ascending: false }),
    ]);
    setSessions(s.data || []);
    setExams(e.data || []);
    setGoals(g.data || []);
    setNotes(n.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [studentId]); // eslint-disable-line

  const goalPct = goals.length ? Math.round((goals.filter((g) => g.done).length / goals.length) * 100) : 0;
  const lastExam = exams[0];
  const weekMinutes = sessions
    .filter((s) => (new Date() - new Date(s.date)) / 86400000 <= 7)
    .reduce((a, s) => a + s.minutes, 0);

  const tabs = [
    { key: "genel", label: "Genel Bakış", icon: TrendingUp },
    { key: "calisma", label: "Çalışma", icon: BookOpen },
    { key: "denemeler", label: "Denemeler", icon: Award },
    { key: "hedefler", label: "Hedefler", icon: Target },
    { key: "notlar", label: "Notlar", icon: MessageSquare },
  ];

  return (
    <div>
      <div className="bg-white border border-grid rounded-lg p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">{studentName}</h2>
          <p className="font-sans text-sm text-muted mt-0.5">{hedef || "Hedef belirtilmedi"}</p>
        </div>
        <div className="flex gap-5">
          <Stat icon={Clock} label="Bu hafta" value={`${Math.round((weekMinutes / 60) * 10) / 10} sa`} />
          <Stat icon={Award} label="Son net" value={lastExam ? lastExam.net : "—"} />
          <Stat icon={Target} label="Aktif hedef" value={goals.filter((g) => !g.done).length} />
          <Stat icon={Check} label="Hedef %" value={`${goalPct}%`} />
        </div>
      </div>

      <div className="flex gap-1 mt-4 border-b border-grid overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 font-sans text-sm font-semibold whitespace-nowrap border-b-2 ${
                active ? "border-amber text-ink" : "border-transparent text-muted"
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {loading ? (
          <p className="font-sans text-sm text-muted">Yükleniyor…</p>
        ) : (
          <>
            {tab === "genel" && <Genel sessions={sessions} exams={exams} notes={notes} />}
            {tab === "calisma" && (
              <Calisma sessions={sessions} canEdit={canEdit} studentId={studentId} onChange={load} />
            )}
            {tab === "denemeler" && (
              <Denemeler exams={exams} canEdit={canEdit} studentId={studentId} onChange={load} />
            )}
            {tab === "hedefler" && (
              <Hedefler goals={goals} canEdit={canEdit} studentId={studentId} onChange={load} />
            )}
            {tab === "notlar" && (
              <Notlar notes={notes} canEdit={canEdit} studentId={studentId} onChange={load} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} className="text-teal" />
      <span className="font-sans text-[11px] text-muted">{label}</span>
      <span className="font-mono text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

const card = "bg-white border border-grid rounded-lg p-5";
const cardTitle = "font-display text-base font-semibold text-ink mb-3.5";
const input = "w-full border border-grid rounded-md px-3 py-2 text-sm font-sans outline-none focus:border-teal";
const label = "font-sans text-xs font-semibold uppercase tracking-wide text-muted block mb-1";
const primaryBtn = "bg-ink text-white font-sans font-semibold text-sm rounded-md px-3.5 py-2 inline-flex items-center gap-1.5 self-start";

function Empty({ text }) {
  return <p className="font-sans text-sm text-muted py-4">{text}</p>;
}

// ---------- Genel ----------
function Genel({ sessions, exams, notes }) {
  const last14 = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const mins = sessions.filter((s) => s.date === iso).reduce((a, s) => a + s.minutes, 0);
      days.push({ date: fmtDate(iso), dakika: mins });
    }
    return days;
  }, [sessions]);

  const trend = useMemo(() => {
    const byExam = {};
    exams.forEach((e) => {
      const key = e.date + "|" + e.exam_name;
      if (!byExam[key]) byExam[key] = { label: e.exam_name, net: 0, date: e.date };
      byExam[key].net += Number(e.net);
    });
    return Object.values(byExam).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [exams]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className={card}>
        <h3 className={cardTitle}>Son 14 Gün — Çalışma (dk)</h3>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={last14}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D7DEDB" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="dakika" fill="#1E6E63" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className={card}>
        <h3 className={cardTitle}>Toplam Net Gelişimi</h3>
        {trend.length === 0 ? <Empty text="Henüz deneme sonucu yok." /> : (
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D7DEDB" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="net" stroke="#E3A21A" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className={`${card} md:col-span-2`}>
        <h3 className={cardTitle}>Son Notlar</h3>
        {notes.length === 0 ? <Empty text="Henüz not yok." /> : (
          <div className="flex flex-col">
            {notes.slice(0, 3).map((n) => {
              const m = MOODS.find((mm) => mm.key === n.mood) || MOODS[1];
              const Icon = m.icon;
              return (
                <div key={n.id} className="flex gap-2.5 py-2 border-t border-grid first:border-t-0">
                  <Icon size={15} style={{ color: m.color }} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="font-mono text-[11px] text-muted">{fmtDate(n.date)}</div>
                    <div className="font-sans text-sm text-ink">{n.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Çalışma ----------
function Calisma({ sessions, canEdit, studentId, onChange }) {
  const [date, setDate] = useState(todayISO());
  const [subject, setSubject] = useState(DEFAULT_SUBJECTS[0]);
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");

  const bySubject = useMemo(() => {
    const map = {};
    sessions.forEach((s) => (map[s.subject] = (map[s.subject] || 0) + s.minutes));
    return Object.entries(map).map(([subject, dakika]) => ({ subject, dakika }));
  }, [sessions]);

  const add = async () => {
    if (!minutes) return;
    await supabase.from("study_sessions").insert({
      student_id: studentId, date, subject, minutes: Number(minutes), note,
    });
    setMinutes(""); setNote("");
    onChange();
  };
  const remove = async (id) => {
    await supabase.from("study_sessions").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-5">
      {canEdit && (
        <div className={card}>
          <h3 className={cardTitle}>Çalışma Kaydı Ekle</h3>
          <div className="flex flex-col gap-3">
            <div><label className={label}>Tarih</label><input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div>
              <label className={label}>Ders</label>
              <input list="subjects" className={input} value={subject} onChange={(e) => setSubject(e.target.value)} />
              <datalist id="subjects">{DEFAULT_SUBJECTS.map((s) => <option key={s} value={s} />)}</datalist>
            </div>
            <div><label className={label}>Süre (dakika)</label><input type="number" className={input} value={minutes} onChange={(e) => setMinutes(e.target.value)} /></div>
            <div><label className={label}>Not</label><input className={input} value={note} onChange={(e) => setNote(e.target.value)} /></div>
            <button onClick={add} className={primaryBtn}><Plus size={14} /> Ekle</button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-5">
        <div className={card}>
          <h3 className={cardTitle}>Ders Bazında Toplam Süre</h3>
          {bySubject.length === 0 ? <Empty text="Henüz kayıt yok." /> : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={bySubject} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#D7DEDB" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="subject" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="dakika" radius={[0, 3, 3, 0]}>
                  {bySubject.map((_, i) => <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className={card}>
          <h3 className={cardTitle}>Kayıtlar</h3>
          <Table
            rows={sessions}
            cols={[{ k: "date", l: "Tarih", r: (r) => fmtDate(r.date) }, { k: "subject", l: "Ders" }, { k: "minutes", l: "Dakika" }, { k: "note", l: "Not" }]}
            onDelete={canEdit ? remove : null}
          />
        </div>
      </div>
    </div>
  );
}

// ---------- Denemeler ----------
function Denemeler({ exams, canEdit, studentId, onChange }) {
  const [date, setDate] = useState(todayISO());
  const [examName, setExamName] = useState("");
  const [subject, setSubject] = useState(DEFAULT_SUBJECTS[0]);
  const [dogru, setDogru] = useState("");
  const [yanlis, setYanlis] = useState("");
  const net = dogru !== "" || yanlis !== "" ? Math.round((Number(dogru || 0) - Number(yanlis || 0) / 4) * 100) / 100 : "";

  const subjectKeys = useMemo(() => [...new Set(exams.map((e) => e.subject))], [exams]);
  const trend = useMemo(() => {
    const names = [...new Set(exams.map((e) => e.exam_name))];
    return names.map((name) => {
      const row = { examName: name };
      subjectKeys.forEach((s) => {
        const rec = exams.find((e) => e.exam_name === name && e.subject === s);
        if (rec) row[s] = Number(rec.net);
      });
      return row;
    });
  }, [exams, subjectKeys]);

  const add = async () => {
    if (!examName || net === "") return;
    await supabase.from("exam_results").insert({
      student_id: studentId, date, exam_name: examName, subject, dogru: Number(dogru || 0), yanlis: Number(yanlis || 0), net,
    });
    setDogru(""); setYanlis("");
    onChange();
  };
  const remove = async (id) => {
    await supabase.from("exam_results").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-5">
      {canEdit && (
        <div className={card}>
          <h3 className={cardTitle}>Deneme Sonucu Ekle</h3>
          <div className="flex flex-col gap-3">
            <div><label className={label}>Tarih</label><input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><label className={label}>Deneme Adı</label><input className={input} value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="Örn: 3D TYT Deneme 5" /></div>
            <div>
              <label className={label}>Ders</label>
              <input list="subjects2" className={input} value={subject} onChange={(e) => setSubject(e.target.value)} />
              <datalist id="subjects2">{DEFAULT_SUBJECTS.map((s) => <option key={s} value={s} />)}</datalist>
            </div>
            <div className="flex gap-3">
              <div className="flex-1"><label className={label}>Doğru</label><input type="number" className={input} value={dogru} onChange={(e) => setDogru(e.target.value)} /></div>
              <div className="flex-1"><label className={label}>Yanlış</label><input type="number" className={input} value={yanlis} onChange={(e) => setYanlis(e.target.value)} /></div>
            </div>
            <div className="font-mono text-sm text-teal">Net: {net === "" ? "—" : net}</div>
            <button onClick={add} className={primaryBtn}><Plus size={14} /> Ekle</button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-5">
        <div className={card}>
          <h3 className={cardTitle}>Ders Bazında Net Trendi</h3>
          {trend.length === 0 ? <Empty text="Henüz deneme sonucu yok." /> : (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D7DEDB" />
                <XAxis dataKey="examName" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {subjectKeys.map((s, i) => (
                  <Line key={s} type="monotone" dataKey={s} stroke={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className={card}>
          <h3 className={cardTitle}>Kayıtlar</h3>
          <Table
            rows={exams}
            cols={[{ k: "date", l: "Tarih", r: (r) => fmtDate(r.date) }, { k: "exam_name", l: "Deneme" }, { k: "subject", l: "Ders" }, { k: "net", l: "Net" }]}
            onDelete={canEdit ? remove : null}
          />
        </div>
      </div>
    </div>
  );
}

// ---------- Hedefler ----------
function Hedefler({ goals, canEdit, studentId, onChange }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const add = async () => {
    if (!title) return;
    await supabase.from("goals").insert({ student_id: studentId, title, due: due || null });
    setTitle(""); setDue("");
    onChange();
  };
  const toggle = async (g) => {
    await supabase.from("goals").update({ done: !g.done }).eq("id", g.id);
    onChange();
  };
  const remove = async (id) => {
    await supabase.from("goals").delete().eq("id", id);
    onChange();
  };

  const sorted = [...goals].sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-5">
      {canEdit && (
        <div className={card}>
          <h3 className={cardTitle}>Hedef / Görev Ekle</h3>
          <div className="flex flex-col gap-3">
            <div><label className={label}>Başlık</label><input className={input} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><label className={label}>Hedef Tarih</label><input type="date" className={input} value={due} onChange={(e) => setDue(e.target.value)} /></div>
            <button onClick={add} className={primaryBtn}><Plus size={14} /> Ekle</button>
          </div>
        </div>
      )}
      <div className={card}>
        <h3 className={cardTitle}>Hedef Listesi</h3>
        {sorted.length === 0 ? <Empty text="Henüz hedef yok." /> : (
          <div className="flex flex-col gap-2">
            {sorted.map((g) => (
              <div key={g.id} className={`flex items-center justify-between px-3 py-2.5 rounded-md border border-grid ${g.done ? "bg-[#F0F4F2]" : "bg-white"}`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => canEdit && toggle(g)}
                    className="w-5 h-5 rounded-[5px] flex items-center justify-center border"
                    style={{ borderColor: g.done ? "#1E6E63" : "#D7DEDB", background: g.done ? "#1E6E63" : "transparent" }}
                  >
                    {g.done && <Check size={13} color="#fff" />}
                  </button>
                  <div>
                    <div className={`font-sans text-sm ${g.done ? "text-muted line-through" : "text-ink"}`}>{g.title}</div>
                    {g.due && <div className="font-mono text-[11px] text-muted">{fmtDate(g.due)}</div>}
                  </div>
                </div>
                {canEdit && (
                  <button onClick={() => remove(g.id)} className="text-muted"><X size={14} /></button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Notlar ----------
function Notlar({ notes, canEdit, studentId, onChange }) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("iyi");

  const add = async () => {
    if (!text) return;
    await supabase.from("notes").insert({ student_id: studentId, date: todayISO(), mood, text });
    setText("");
    onChange();
  };
  const remove = async (id) => {
    await supabase.from("notes").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-5">
      {canEdit && (
        <div className={card}>
          <h3 className={cardTitle}>Not / Geri Bildirim Ekle</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className={label}>Durum</label>
              <div className="flex gap-2">
                {MOODS.map((m) => {
                  const Icon = m.icon;
                  const sel = mood === m.key;
                  return (
                    <button key={m.key} onClick={() => setMood(m.key)}
                      className="flex-1 py-2 rounded-md border flex flex-col items-center gap-1"
                      style={{ borderColor: sel ? m.color : "#D7DEDB", background: sel ? `${m.color}15` : "transparent" }}>
                      <Icon size={16} style={{ color: m.color }} />
                      <span className="font-sans text-[10px] text-muted">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div><label className={label}>Not</label><textarea className={`${input} min-h-[90px]`} value={text} onChange={(e) => setText(e.target.value)} /></div>
            <button onClick={add} className={primaryBtn}><Plus size={14} /> Ekle</button>
          </div>
        </div>
      )}
      <div className={card}>
        <h3 className={cardTitle}>Zaman Çizelgesi</h3>
        {notes.length === 0 ? <Empty text="Henüz not yok." /> : (
          <div className="flex flex-col">
            {notes.map((n) => {
              const m = MOODS.find((mm) => mm.key === n.mood) || MOODS[1];
              const Icon = m.icon;
              return (
                <div key={n.id} className="flex gap-3 py-3 border-t border-grid first:border-t-0">
                  <Icon size={16} style={{ color: m.color }} className="mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-mono text-[11px] text-muted">{fmtDate(n.date)}</div>
                    <div className="font-sans text-sm text-ink mt-0.5">{n.text}</div>
                  </div>
                  {canEdit && <button onClick={() => remove(n.id)} className="text-muted h-4"><X size={14} /></button>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- generic table ----------
function Table({ rows, cols, onDelete }) {
  if (rows.length === 0) return <Empty text="Henüz kayıt yok." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.k} className="text-left font-sans text-[11px] uppercase tracking-wide text-muted px-2 py-1.5 border-b border-grid">{c.l}</th>
            ))}
            {onDelete && <th className="w-8 border-b border-grid" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {cols.map((c) => (
                <td key={c.k} className="font-mono text-[12.5px] text-ink px-2 py-2 border-b border-grid">
                  {c.r ? c.r(r) : r[c.k]}
                </td>
              ))}
              {onDelete && (
                <td className="border-b border-grid px-2">
                  <button onClick={() => onDelete(r.id)} className="text-muted"><X size={13} /></button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
