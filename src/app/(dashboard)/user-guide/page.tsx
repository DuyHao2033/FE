"use client";

import Link from "next/link";
import {
  BookOpen,
  CircleCheck,
  FileText,
  ArrowRight,
  Zap,
  MessageCircle,
  LayoutDashboard,
  ChevronDown, // Import thêm icon để làm mũi tên chỉ trạng thái
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";

export default function UserGuidePage() {
  const { t } = useTranslation();

  // 1. Quản lý trạng thái mở của từng bước (mặc định mở bước đầu tiên - index 0)
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const stepsList = [
    {
      title: "userGuide.steps.step1.title",
      description: "userGuide.steps.step1.description",
      icon: <LayoutDashboard className="h-6 w-6" />, 
      notes: [
        { id: 1, key: "userGuide.steps.step1.notes.single" },
        { id: 2, key: "userGuide.steps.step1.notes.template" },
        { id: 3, key: "userGuide.steps.step1.notes.bulk" },
      ]
    },
    {
      title: "userGuide.steps.step2.title",
      description: "userGuide.steps.step2.description",
      icon: <FileText className="h-6 w-6" />, 
      notes: [
        { id: 1, key: "userGuide.steps.step2.notes.clickButton" },
        { id: 2, key: "userGuide.steps.step2.notes.fillInfo" },
        { id: 3, key: "userGuide.steps.step2.notes.selectTemplate" },
        { id: 4, key: "userGuide.steps.step2.notes.confirm" },
      ],
      actionLink: "/certificate/issue",
      actionLabel: "Tạo chứng chỉ lẻ" // Thêm label cho nút nhảy nhanh
    },
    {
      title: "userGuide.steps.step3.title",
      description: "userGuide.steps.step3.description",
      icon: <Zap className="h-6 w-6" />,
      notes: [
        { id: 1, key: "userGuide.steps.step3.notes.viewTemplate" },
        { id: 2, key: "userGuide.steps.step3.notes.clickSelect" },
      ]
    },
    {
      title: "userGuide.steps.step4.title",
      description: "userGuide.steps.step4.description",
      icon: <CircleCheck className="h-6 w-6" />,
      notes: [
        { id: 1, key: "userGuide.steps.step4.notes.fillForm" },
        { id: 2, key: "userGuide.steps.step4.notes.checkPreview" },
        { id: 3, key: "userGuide.steps.step4.notes.submit" },
      ]
    }
  ];

  const tipsRaw = t("userGuide.tips", { returnObjects: true });
  const tips = Array.isArray(tipsRaw) ? tipsRaw : [];
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    if (tips.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // Hàm xử lý đóng mở
  const toggleStep = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 animate-in fade-in duration-700">
      
      {/* --- HEADER (GIỮ NGUYÊN) --- */}
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          <BookOpen className="h-4 w-4" />
          {t("userGuide.title")}
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-primary to-sky-600 bg-clip-text text-transparent">
          {t("userGuide.subtitle")}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto italic">
          {t("userGuide.description")}
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* CỘT TRÁI: ACCORDION TIMELINE */}
        <section className="lg:col-span-3 space-y-6">
          {stepsList.map((step, idx) => {
            const isOpen = openIndex === idx;
            
            return (
              <div 
                key={idx} 
                className={`bg-card border transition-all duration-300 rounded-[2rem] overflow-hidden ${
                  isOpen ? "border-primary/30 shadow-md" : "border-border shadow-sm"
                }`}
              >
                {/* TIÊU ĐỀ BƯỚC (Bấm vào để toggle) */}
                <div 
                  className={`p-6 md:p-8 flex items-center justify-between cursor-pointer group/header ${
                    isOpen ? "bg-primary/5" : "hover:bg-accent/50"
                  }`}
                  onClick={() => toggleStep(idx)}
                >
                  <div className="flex items-center gap-6">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-300 ${
                      isOpen ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "bg-primary/10 text-primary"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${isOpen ? "bg-primary/10 text-primary" : "bg-accent/50 text-muted-foreground group-hover/header:text-primary"}`}>
                        {step.icon}
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                        {t(step.title)}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* NÚT NHẢY TRANG (Hiện ngay trên tiêu đề nếu có actionLink) */}
                    {step.actionLink && (
                      <Link
                        href={step.actionLink}
                        onClick={(e) => e.stopPropagation()} // Ngăn việc bấm nút làm đóng/mở bước
                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary/90 transition-all shadow-md active:scale-95"
                      >
                        {step.actionLabel || "Bắt đầu ngay"}
                        <ArrowRight size={14} />
                      </Link>
                    )}
                    <ChevronDown className={`h-6 w-6 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`} />
                  </div>
                </div>

                {/* NỘI DUNG CHI TIẾT (Animation mượt mà) */}
                <div 
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-8 pt-0 ml-0 md:ml-12 border-t border-border/10">
                    <div className="space-y-5 max-w-3xl mt-6">
                      <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                        {t(step.description)}
                      </p>

                      <div className="space-y-3 bg-accent/10 p-5 rounded-2xl border border-border/50">
                        {step.notes.map((note: any) => (
                          <div key={note.id} className="flex gap-3 items-start group/note">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold">
                              {note.id}
                            </span>
                            <p className="text-sm text-muted-foreground italic leading-snug">
                              {t(note.key)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Nút dành cho Mobile (Hiện ở trong nội dung) */}
                      {step.actionLink && (
                        <Link
                          href={step.actionLink}
                          className="md:hidden flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-2xl font-bold mt-4"
                        >
                          {step.actionLabel || "Bắt đầu ngay"}
                          <ArrowRight size={18} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* CỘT PHẢI: WIDGETS (GIỮ NGUYÊN) */}
        <aside className="space-y-6">
          <div className="sticky top-6 space-y-6">
            <div className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-[2rem] p-8 shadow-sm">
              <h4 className="flex items-center gap-2 font-black text-primary mb-4 uppercase text-xs tracking-widest">
                <Zap className="h-4 w-4" />
                {t("userGuide.quickTip")}
              </h4>
              <div className="min-h-[100px] flex items-center">
                <p className="text-sm leading-relaxed font-medium italic text-foreground/80">
                  "{tips.length > 0 ? tips[currentTip] : "Loading..."}"
                </p>
              </div>
              <div className="flex gap-1.5 mt-6">
                {tips.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-300 ${i === currentTip ? "w-6 bg-primary" : "w-2 bg-primary/20"}`}
                  />
                ))}
              </div>
            </div>

            <div className="bg-foreground text-background rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <h4 className="text-xl font-bold mb-3 relative z-10">{t("userGuide.stillUnclear")}</h4>
              <p className="text-sm opacity-70 mb-6 leading-relaxed relative z-10">
                {t("userGuide.contactAdmin")}
              </p>
              <Link
                href="mailto:admin@siu.edu.vn"
                className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
              >
                <MessageCircle className="h-5 w-5" />
                Liên hệ ngay
              </Link>
            </div>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-4 border border-border bg-card rounded-2xl font-bold text-sm hover:bg-accent transition-all group"
            >
              {t("userGuide.backToDashboard")}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </aside>
      </main>
    </div>
  );
}