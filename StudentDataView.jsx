import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, X, Check, Clock, Award, Target, TrendingUp, BookOpen, MessageSquare,
  Smile, Meh, Frown, Star, Flame,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { supabase } from "../supabaseClient";

const DEFAULT_SUBJECTS = [
  "Türkçe", "Matematik",
  "Fizik", "Kimya", "Biyoloji",
  "Tarih", "Coğrafya", "Felsefe", "Din Kültürü ve Ahlak Bilgisi",
  "İngilizce",
];
const SUBJECT_COLORS = [
  "#1E6E63", "#E3A21A", "#C1483C", "#3D5A80", "#8A5A44", "#5B7B4F",
  "#7A4E8C", "#B0762C", "#2E7DA6", "#A64E6B",
];
const EXAM_TYPES = ["TYT", "AYT", "Branş"];
const PRIORITIES = [
  { key: "düşük", color: "#6B7686" },
  { key: "orta", color: "#E3A21A" },
  { key: "yüksek", color: "#C1483C" },
];
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
function subjColor(subject, keys) {
  const i = keys.indexOf(subject);
  return SUBJECT_COLORS[(i < 0 ? 0 : i) % SUBJECT_COLORS.length];
}

// ---------- shared chart styling ----------
const chartTick = { fontSize: 10.5, fill: "#6B7686" };
const gridProps = { strokeDasharray: "3 3", stroke: "#E4E9E7", vertical: false };
function ChartTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-ink text-white rounded-md px-3 py-2 shadow-lg text-xs font-sans">
      <div className="font-mono text-[10px] text-[#9AABC2] mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color || p.fill }} />
          <span>{p.name}: <b>{p.value}{suffix}</b></span>
        </div>
      ))}
    </div>
  );
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
  const streak = useMemo(() => {
    const days = new Set(sessions.map((s) => s.date));
    let c = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (days.has(d.toISOString().slice(0, 10))) c++;
      else if (i > 0) break;
    }
    return c;
  }, [sessions]);

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
        <div className="flex gap-5 flex-wrap">
          <Stat icon={Flame} label="Seri" value={`${streak} gün`} />
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
            {tab === "genel" && <Genel sessions={sessions} exams={exams} goals={goals} notes={notes} />}
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
const cardTitle = "font-display text-base font-semibold text-ink mb-1";
const cardSub = "font-sans text-xs text-muted mb-3.5";
const input = "w-full border border-grid rounded-md px-3 py-2 text-sm font-sans outline-none focus:border-teal";
const label = "font-sans text-xs font-semibold uppercase tracking-wide text-muted block mb-1";
const primaryBtn = "bg-ink text-white font-sans font-semibold text-sm rounded-md px-3.5 py-2 inline-flex items-center gap-1.5 self-start";

function Empty({ text }) {
  return <p className="font-sans text-sm text-muted py-4">{text}</p>;
}

// ---------- Genel ----------
function Genel({ sessions, exams, goals, notes }) {
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
  const avgDaily = last14.length ? Math.round(last14.reduce((a, d) => a + d.dakika, 0) / last14.length) : 0;

  const trend = useMemo(() => {
    const byExam = {};
    exams.forEach((e) => {
      const key = e.date + "|" + e.exam_name;
      if (!byExam[key]) byExam[key] = { label: e.exam_name, net: 0, date: e.date };
      byExam[key].net += Number(e.net);
    });
    return Object.values(byExam).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [exams]);
  const avgNet = trend.length ? Math.round((trend.reduce((a, t) => a + t.net, 0) / trend.length) * 10) / 10 : 0;

  const subjectKeys = useMemo(() => [...new Set(exams.map((e) => e.subject))], [exams]);
  const radarData = useMemo(() => {
    return subjectKeys.map((s) => {
      const recs = exams.filter((e) => e.subject === s);
      const avg = recs.length ? recs.reduce((a, r) => a + Number(r.net), 0) / recs.length : 0;
      return { subject: s, net: Math.round(avg * 10) / 10 };
    });
  }, [exams, subjectKeys]);

  const distribution = useMemo(() => {
    const map = {};
    sessions.forEach((s) => (map[s.subject] = (map[s.subject] || 0) + s.minutes));
    return Object.entries(map).map(([subject, dakika]) => ({ subject, dakika }));
  }, [sessions]);
  const totalMinutes = distribution.reduce((a, d) => a + d.dakika, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className={card}>
        <h3 className={cardTitle}>Son 14 Gün — Çalışma Yoğunluğu</h3>
        <p className={cardSub}>Günlük ortalama {avgDaily} dakika</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={last14}>
            <defs>
              <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E6E63" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#1E6E63" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="date" tick={chartTick} axisLine={{ stroke: "#E4E9E7" }} tickLine={false} />
            <YAxis tick={chartTick} axisLine={false} tickLine={false} width={30} />
            <Tooltip content={<ChartTooltip suffix=" dk" />} />
            <ReferenceLine y={avgDaily} stroke="#E3A21A" strokeDasharray="4 4" strokeWidth={1.5} />
            <Area type="monotone" dataKey="dakika" name="Dakika" stroke="#1E6E63" strokeWidth={2.5} fill="url(#studyGradient)" dot={{ r: 3, fill: "#1E6E63", strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={card}>
        <h3 className={cardTitle}>Toplam Net Gelişimi</h3>
        <p className={cardSub}>Ortalama net {avgNet}</p>
        {trend.length === 0 ? <Empty text="Henüz deneme sonucu yok." /> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" tick={chartTick} axisLine={{ stroke: "#E4E9E7" }} tickLine={false} />
              <YAxis tick={chartTick} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={avgNet} stroke="#C1483C" strokeDasharray="4 4" strokeWidth={1.5} />
              <Line type="monotone" dataKey="net" name="Net" stroke="#E3A21A" strokeWidth={2.5} dot={{ r: 4, fill: "#E3A21A", strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={card}>
        <h3 className={cardTitle}>Ders Bazında Güç Analizi</h3>
        <p className={cardSub}>Derslerin ortalama net değeri</p>
        {radarData.length < 3 ? <Empty text="Radar grafiği için en az 3 farklı ders sonucu gerekiyor." /> : (
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="#E4E9E7" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#14213D" }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: "#6B7686" }} axisLine={false} />
              <Radar dataKey="net" stroke="#1E6E63" fill="#1E6E63" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip content={<ChartTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className={card}>
        <h3 className={cardTitle}>Zaman Dağılımı</h3>
        <p className={cardSub}>Ders bazında toplam çalışma süresi</p>
        {distribution.length === 0 ? <Empty text="Henüz çalışma kaydı yok." /> : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={distribution} dataKey="dakika" nameKey="subject" innerRadius={50} outerRadius={78} paddingAngle={2}>
                  {distribution.map((d, i) => (
                    <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip suffix=" dk" />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 flex-1">
              {distribution.map((d, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }} />
                    <span className="font-sans text-xs text-ink truncate">{d.subject}</span>
                  </div>
                  <span className="font-mono text-xs text-muted shrink-0">
                    {totalMinutes ? Math.round((d.dakika / totalMinutes) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`${card} lg:col-span-2`}>
        <h3 className={cardTitle}>Son Notlar</h3>
        <p className={cardSub}>Koçun en güncel geri bildirimleri</p>
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
  const [topic, setTopic] = useState("");
  const [resource, setResource] = useState("");
  const [minutes, setMinutes] = useState("");
  const [efficiency, setEfficiency] = useState(3);
  const [note, setNote] = useState("");

  const bySubject = useMemo(() => {
    const map = {};
    sessions.forEach((s) => (map[s.subject] = (map[s.subject] || 0) + s.minutes));
    return Object.entries(map).map(([subject, dakika]) => ({ subject, dakika }));
  }, [sessions]);

  const avgEfficiency = useMemo(() => {
    const withEff = sessions.filter((s) => s.efficiency);
    if (!withEff.length) return null;
    return Math.round((withEff.reduce((a, s) => a + s.efficiency, 0) / withEff.length) * 10) / 10;
  }, [sessions]);

  const add = async () => {
    if (!minutes) return;
    await supabase.from("study_sessions").insert({
      student_id: studentId, date, subject, topic: topic || null, resource: resource || null,
      minutes: Number(minutes), efficiency, note,
    });
    setMinutes(""); setNote(""); setTopic(""); setResource(""); setEfficiency(3);
    onChange();
  };
  const remove = async (id) => {
    await supabase.from("study_sessions").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-5">
      {canEdit && (
        <div className={card}>
          <h3 className={cardTitle}>Çalışma Kaydı Ekle</h3>
          <p className={cardSub}>Ne çalıştığını olabildiğince detaylı gir</p>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1"><label className={label}>Tarih</label><input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="flex-1">
                <label className={label}>Ders</label>
                <input list="subjects" className={input} value={subject} onChange={(e) => setSubject(e.target.value)} />
                <datalist id="subjects">{DEFAULT_SUBJECTS.map((s) => <option key={s} value={s} />)}</datalist>
              </div>
            </div>
            <div><label className={label}>Konu</label><input className={input} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Örn: Türev — Zincir Kuralı" /></div>
            <div><label className={label}>Kaynak</label><input className={input} value={resource} onChange={(e) => setResource(e.target.value)} placeholder="Örn: 3D Yayınları Soru Bankası" /></div>
            <div><label className={label}>Süre (dakika)</label><input type="number" className={input} value={minutes} onChange={(e) => setMinutes(e.target.value)} /></div>
            <div>
              <label className={label}>Verimlilik</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setEfficiency(n)} className="p-0.5">
                    <Star size={20} fill={n <= efficiency ? "#E3A21A" : "none"} color={n <= efficiency ? "#E3A21A" : "#D7DEDB"} />
                  </button>
                ))}
              </div>
            </div>
            <div><label className={label}>Not</label><input className={input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sayfa, zorlanılan yer vb." /></div>
            <button onClick={add} className={primaryBtn}><Plus size={14} /> Ekle</button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-5">
        <div className={card}>
          <h3 className={cardTitle}>Ders Bazında Toplam Süre</h3>
          <p className={cardSub}>{avgEfficiency ? `Ortalama verimlilik: ${avgEfficiency} / 5` : "Henüz verimlilik verisi yok"}</p>
          {bySubject.length === 0 ? <Empty text="Henüz kayıt yok." /> : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={bySubject} layout="vertical" barSize={16}>
                <CartesianGrid {...gridProps} horizontal={false} />
                <XAxis type="number" tick={chartTick} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="subject" width={100} tick={{ fontSize: 11.5, fill: "#14213D" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip suffix=" dk" />} />
                <Bar dataKey="dakika" radius={[0, 6, 6, 0]}>
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
            cols={[
              { k: "date", l: "Tarih", r: (r) => fmtDate(r.date) },
              { k: "subject", l: "Ders" },
              { k: "topic", l: "Konu", r: (r) => r.topic || "—" },
              { k: "minutes", l: "Dk" },
              { k: "efficiency", l: "Verim", r: (r) => r.efficiency ? "★".repeat(r.efficiency) : "—" },
            ]}
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
  const [examType, setExamType] = useState("TYT");
  const [subject, setSubject] = useState(DEFAULT_SUBJECTS[0]);
  const [dogru, setDogru] = useState("");
  const [yanlis, setYanlis] = useState("");
  const [bos, setBos] = useState("");
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

  const byType = useMemo(() => {
    const map = {};
    exams.forEach((e) => {
      const t = e.exam_type || "TYT";
      if (!map[t]) map[t] = { count: 0, totalNet: 0 };
      map[t].count += 1;
      map[t].totalNet += Number(e.net);
    });
    return map;
  }, [exams]);

  const add = async () => {
    if (!examName || net === "") return;
    await supabase.from("exam_results").insert({
      student_id: studentId, date, exam_name: examName, exam_type: examType, subject,
      dogru: Number(dogru || 0), yanlis: Number(yanlis || 0), bos: Number(bos || 0), net,
    });
    setDogru(""); setYanlis(""); setBos("");
    onChange();
  };
  const remove = async (id) => {
    await supabase.from("exam_results").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-5">
      {canEdit && (
        <div className={card}>
          <h3 className={cardTitle}>Deneme Sonucu Ekle</h3>
          <p className={cardSub}>Doğru/yanlış/boş girildikçe net otomatik hesaplanır</p>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1"><label className={label}>Tarih</label><input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="flex-1">
                <label className={label}>Tür</label>
                <select className={input} value={examType} onChange={(e) => setExamType(e.target.value)}>
                  {EXAM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div><label className={label}>Deneme Adı</label><input className={input} value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="Örn: 3D TYT Deneme 5" /></div>
            <div>
              <label className={label}>Ders</label>
              <input list="subjects2" className={input} value={subject} onChange={(e) => setSubject(e.target.value)} />
              <datalist id="subjects2">{DEFAULT_SUBJECTS.map((s) => <option key={s} value={s} />)}</datalist>
            </div>
            <div className="flex gap-2">
              <div className="flex-1"><label className={label}>Doğru</label><input type="number" className={input} value={dogru} onChange={(e) => setDogru(e.target.value)} /></div>
              <div className="flex-1"><label className={label}>Yanlış</label><input type="number" className={input} value={yanlis} onChange={(e) => setYanlis(e.target.value)} /></div>
              <div className="flex-1"><label className={label}>Boş</label><input type="number" className={input} value={bos} onChange={(e) => setBos(e.target.value)} /></div>
            </div>
            <div className="font-mono text-sm text-teal">Net: {net === "" ? "—" : net}</div>
            <button onClick={add} className={primaryBtn}><Plus size={14} /> Ekle</button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-5">
        {Object.keys(byType).length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(byType).map(([t, v]) => (
              <div key={t} className={`${card} p-4`}>
                <div className="font-sans text-[11px] text-muted uppercase tracking-wide">{t}</div>
                <div className="font-display text-xl font-semibold text-ink mt-0.5">{v.count} deneme</div>
                <div className="font-mono text-xs text-teal mt-0.5">Ort. net {Math.round((v.totalNet / v.count) * 10) / 10}</div>
              </div>
            ))}
          </div>
        )}
        <div className={card}>
          <h3 className={cardTitle}>Ders Bazında Net Trendi</h3>
          {trend.length === 0 ? <Empty text="Henüz deneme sonucu yok." /> : (
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={trend}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="examName" tick={chartTick} axisLine={{ stroke: "#E4E9E7" }} tickLine={false} />
                <YAxis tick={chartTick} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11.5, fontFamily: "inherit" }} iconType="circle" iconSize={8} />
                {subjectKeys.map((s, i) => (
                  <Line key={s} type="monotone" dataKey={s} stroke={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} strokeWidth={2.5} dot={{ r: 3.5 }} activeDot={{ r: 5.5 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className={card}>
          <h3 className={cardTitle}>Kayıtlar</h3>
          <Table
            rows={exams}
            cols={[
              { k: "date", l: "Tarih", r: (r) => fmtDate(r.date) },
              { k: "exam_name", l: "Deneme" },
              { k: "exam_type", l: "Tür", r: (r) => r.exam_type || "TYT" },
              { k: "subject", l: "Ders" },
              { k: "dyb", l: "D/Y/B", r: (r) => `${r.dogru}/${r.yanlis}/${r.bos || 0}` },
              { k: "net", l: "Net" },
            ]}
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
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("orta");
  const [due, setDue] = useState("");

  const add = async () => {
    if (!title) return;
    await supabase.from("goals").insert({ student_id: studentId, title, due: due || null, subject: subject || null, priority });
    setTitle(""); setDue(""); setSubject(""); setPriority("orta");
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

  const priorityOrder = { yüksek: 0, orta: 1, düşük: 2 };
  const sorted = [...goals].sort((a, b) => {
    if (a.done !== b.done) return Number(a.done) - Number(b.done);
    return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-5">
      {canEdit && (
        <div className={card}>
          <h3 className={cardTitle}>Hedef / Görev Ekle</h3>
          <div className="flex flex-col gap-3">
            <div><label className={label}>Başlık</label><input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: 50 türev sorusu çöz" /></div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={label}>Ders (opsiyonel)</label>
                <input list="subjects3" className={input} value={subject} onChange={(e) => setSubject(e.target.value)} />
                <datalist id="subjects3">{DEFAULT_SUBJECTS.map((s) => <option key={s} value={s} />)}</datalist>
              </div>
              <div className="flex-1">
                <label className={label}>Öncelik</label>
                <select className={input} value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.key}</option>)}
                </select>
              </div>
            </div>
            <div><label className={label}>Hedef Tarih</label><input type="date" className={input} value={due} onChange={(e) => setDue(e.target.value)} /></div>
            <button onClick={add} className={primaryBtn}><Plus size={14} /> Ekle</button>
          </div>
        </div>
      )}
      <div className={card}>
        <h3 className={cardTitle}>Hedef Listesi</h3>
        {sorted.length === 0 ? <Empty text="Henüz hedef yok." /> : (
          <div className="flex flex-col gap-2">
            {sorted.map((g) => {
              const pr = PRIORITIES.find((p) => p.key === g.priority) || PRIORITIES[1];
              return (
                <div key={g.id} className={`flex items-center justify-between px-3 py-2.5 rounded-md border border-grid ${g.done ? "bg-[#F0F4F2]" : "bg-white"}`}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => canEdit && toggle(g)}
                      className="w-5 h-5 rounded-[5px] flex items-center justify-center border shrink-0"
                      style={{ borderColor: g.done ? "#1E6E63" : "#D7DEDB", background: g.done ? "#1E6E63" : "transparent" }}
                    >
                      {g.done && <Check size={13} color="#fff" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-sans text-sm ${g.done ? "text-muted line-through" : "text-ink"}`}>{g.title}</span>
                        {!g.done && (
                          <span className="font-sans text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${pr.color}18`, color: pr.color }}>{g.priority}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {g.subject && <span className="font-mono text-[11px] text-teal">{g.subject}</span>}
                        {g.due && <span className="font-mono text-[11px] text-muted">{fmtDate(g.due)}</span>}
                      </div>
                    </div>
                  </div>
                  {canEdit && (
                    <button onClick={() => remove(g.id)} className="text-muted shrink-0"><X size={14} /></button>
                  )}
                </div>
              );
            })}
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
    <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-5">
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
