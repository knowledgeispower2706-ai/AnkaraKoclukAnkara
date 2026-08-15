import React from "react";
import { GraduationCap, TrendingUp, Target, MessageSquare, Sparkles } from "lucide-react";

export function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{
          background: light ? "rgba(255,255,255,0.18)" : "#14213D",
          backdropFilter: light ? "blur(4px)" : undefined,
        }}
      >
        <GraduationCap size={16} color={light ? "#fff" : "#fff"} />
      </div>
      <span
        className="font-display font-semibold text-base"
        style={{ color: light ? "#fff" : "#14213D" }}
      >
        Koçluk Takip
      </span>
    </div>
  );
}

const features = [
  { icon: TrendingUp, text: "Çalışma saatlerini ve deneme netlerini grafiklerle takip et", color: "#FFB84D" },
  { icon: Target, text: "Her öğrenciye özel hedefler koy, ilerlemeyi anlık gör", color: "#5CC9B0" },
  { icon: MessageSquare, text: "Notlar ve geri bildirimlerle bağlantıyı güçlü tut", color: "#FF8C7A" },
];

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-paper flex">
      {/* Branding panel */}
      <div
        className="hidden md:flex md:w-[44%] flex-col justify-between p-10 relative overflow-hidden"
        style={{
          background: "linear-gradient(155deg, #14213D 0%, #1B2E52 42%, #0F3B3A 100%)",
        }}
      >
        {/* decorative color blobs */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 320, height: 320, top: -100, right: -100, background: "#E3A21A", opacity: 0.22, filter: "blur(70px)" }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 260, height: 260, bottom: -80, left: -60, background: "#1E9E8A", opacity: 0.28, filter: "blur(70px)" }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 220, height: 220, bottom: "30%", right: -60, background: "#C1483C", opacity: 0.2, filter: "blur(70px)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative">
          <Logo light />
          <div className="inline-flex items-center gap-1.5 mt-8 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <Sparkles size={12} color="#FFD37A" />
            <span className="font-sans text-[11px] font-medium text-white">Koç ve öğrenci için tek panel</span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-white mt-5 leading-tight">
            Öğrencilerinle her
            <br />
            adımda bağlantıda kal.
          </h1>
          <p className="font-sans text-sm text-[#C7D3E6] mt-3 max-w-sm">
            Çalışma takibinden deneme sonuçlarına, hedeflerden geri bildirime
            kadar her şey tek yerde.
          </p>
        </div>

        <div className="relative flex flex-col gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${f.color}2A`, border: `1px solid ${f.color}55` }}
                >
                  <Icon size={16} color={f.color} />
                </div>
                <p className="font-sans text-[13px] text-[#DCE4F0] leading-snug pt-1.5">{f.text}</p>
              </div>
            );
          })}
        </div>

        <p className="relative font-mono text-[11px] text-[#7B8AA0]">
          Koçluk ve Eğitim Danışmanlığı
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 relative overflow-hidden">
        <div
          className="hidden md:block absolute rounded-full pointer-events-none"
          style={{ width: 260, height: 260, top: -80, right: -80, background: "#E3A21A", opacity: 0.05, filter: "blur(60px)" }}
        />
        <div className="w-full max-w-sm relative">
          <div className="md:hidden mb-8 flex justify-center">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
