const fs = require('fs');

const path = 'C:\\Users\\R.karthika\\Desktop\\Downloads\\agriconnect\\src\\components\\landing\\WhatsAppAccessibility.jsx';

const code = `import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Mic,
  Play,
  Pause,
  PhoneCall,
  CheckCheck,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Send,
  Languages,
  Zap,
  Globe,
} from 'lucide-react';

export const WhatsAppAccessibility = () => {
  const { setRole, setIsListProduceOpen } = useApp();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeLang, setActiveLang] = useState('mr-en'); // 'mr-en' | 'hi-en'
  const [chatStep, setChatStep] = useState(4); // 1: voice note, 2: bot rate reply, 3: farmer confirm, 4: bot confirmed

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-[#103D20] via-emerald-950 to-stone-900 text-white relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value Proposition & IVR Callout (6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-600/60 text-xs font-bold text-amber-300 shadow-inner">
              <MessageSquare className="w-4 h-4 text-amber-300" />
              <span>ZERO DIGITAL BARRIER • WHATSAPP & VOICE IVR AI</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Accessible to Every Farmer. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400">
                Send a 5-Second Voice Note.
              </span>
            </h2>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
              No app download or complex navigation required. Farmers can simply send a Marathi or Hindi voice note on WhatsApp or call our toll-free IVR line to get real-time mandi prices, AI storage advice, and list produce instantly.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-base">
                  🎙️
                </div>
                <h4 className="text-xs font-extrabold text-white">Voice Note AI Sourcing</h4>
                <p className="text-[11px] text-emerald-200/80 leading-snug">
                  Speech-to-text NLP extracts crop, quantity, and taluka from local Marathi/Hindi dialects.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-base">
                  🌐
                </div>
                <h4 className="text-xs font-extrabold text-white">Bi-Lingual Intelligence</h4>
                <p className="text-[11px] text-emerald-200/80 leading-snug">
                  Marathi + English side-by-side rates, modal APMC benchmarks, and 14-day AI forecast.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-base">
                  📞
                </div>
                <h4 className="text-xs font-extrabold text-white">1800-AGRI-MH Voice IVR</h4>
                <p className="text-[11px] text-emerald-200/80 leading-snug">
                  Toll-free interactive phone line for non-smartphone farmers with instant SMS rate slips.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-base">
                  ⚡
                </div>
                <h4 className="text-xs font-extrabold text-white">1-Tap WhatsApp Listing</h4>
                <p className="text-[11px] text-emerald-200/80 leading-snug">
                  Tap reply buttons in chat to confirm lots, join taluka pools, and lock micro-insurance.
                </p>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="pt-2">
              <button
                onClick={() => setRole('farmer')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-black text-xs shadow-lg shadow-amber-950/20 transition-all cursor-pointer"
              >
                <span>Launch Farmer Experience</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Realistic WhatsApp Phone Mockup (6 Cols) */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-stone-900 rounded-[40px] p-3 shadow-2xl border-4 border-stone-700 ring-1 ring-white/10">
              {/* Screen Shell */}
              <div className="bg-[#0B141A] rounded-[32px] overflow-hidden flex flex-col h-[580px] text-stone-900 font-sans border border-stone-800">
                {/* WhatsApp Header */}
                <div className="bg-[#1F2C34] text-white p-3 px-4 flex items-center justify-between border-b border-[#2A3942] shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-xl font-bold border-2 border-emerald-500">
                        🌱
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1F2C34]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">AgriConnect Krishi Bot</span>
                        <span className="text-[10px] text-emerald-400 font-black">✓</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 block leading-tight">
                        Govt of Maharashtra • Online
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-stone-400 text-xs">
                    <button
                      onClick={() => setActiveLang(activeLang === 'mr-en' ? 'hi-en' : 'mr-en')}
                      className="px-2 py-1 rounded bg-[#2A3942] hover:bg-[#374248] text-[10px] text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Toggle Language"
                    >
                      <Languages className="w-3 h-3" />
                      <span>{activeLang === 'mr-en' ? 'मराठी / EN' : 'हिंदी / EN'}</span>
                    </button>
                  </div>
                </div>

                {/* Chat Messages Feed */}
                <div className="flex-1 p-3.5 space-y-3 overflow-y-auto bg-[#0B141A] bg-[radial-gradient(#1F2C34_1px,transparent_1px)] [background-size:16px_16px] text-xs">
                  {/* Security E2E Banner */}
                  <div className="text-center">
                    <span className="text-[9px] bg-[#182229] text-[#8696A0] px-2.5 py-1 rounded-lg border border-[#222E35] inline-flex items-center gap-1">
                      🔒 Messages are end-to-end encrypted with Maharashtra State APMC Gateway.
                    </span>
                  </div>

                  {/* Message 1: Outgoing Voice Note from Farmer */}
                  <div className="flex justify-end animate-fade-in">
                    <div className="max-w-[85%] bg-[#005C4B] text-white p-3 rounded-2xl rounded-tr-none shadow-sm space-y-2 border border-[#00705B]">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={toggleAudio}
                          className="w-9 h-9 rounded-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 flex items-center justify-center transition-transform hover:scale-105 shrink-0 cursor-pointer shadow-xs"
                        >
                          {isPlayingAudio ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        <div className="flex-1 space-y-1">
                          {/* Simulated Audio Waveform */}
                          <div className="flex items-center gap-0.5 h-4">
                            {[12, 24, 18, 28, 14, 20, 32, 16, 26, 14, 22, 10, 28, 18, 12, 24, 16].map((h, idx) => (
                              <div
                                key={idx}
                                className={"w-1 rounded-full transition-all duration-200 " + (
                                  isPlayingAudio
                                    ? 'bg-emerald-300 animate-pulse'
                                    : 'bg-emerald-200/60'
                                )}
                                style={{ height: (isPlayingAudio ? Math.max(6, (h * Math.random() * 1.3)) : h) + 'px' }}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between text-[9px] text-emerald-200/80 font-mono">
                            <span>0:06</span>
                            <span className="flex items-center gap-0.5">
                              10:14 AM <CheckCheck className="w-3 h-3 text-cyan-300" />
                            </span>
                          </div>
                        </div>

                        <div className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs shrink-0">
                          👨‍🌾
                        </div>
                      </div>

                      {/* Audio Transcript Box */}
                      <div className="p-2 rounded-xl bg-black/20 text-[10px] text-emerald-100 italic border border-white/10 leading-snug">
                        {activeLang === 'mr-en' ? (
                          <span>"भाऊ, नाशिक लासलगावला कांद्याचा काय भाव चालू आहे? माझ्याकडे २० क्विंटल लाल कांदा आहे विकायला."</span>
                        ) : (
                          <span>"भैया, नासिक लासलगांव में प्याज का क्या भाव है? मेरे पास २० क्विंटल लाल प्याज बेचने के लिए है।"</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Message 2: Incoming Bot Price Reply with Side-by-Side Table */}
                  <div className="flex justify-start animate-fade-in">
                    <div className="max-w-[92%] bg-[#202C33] text-white p-3.5 rounded-2xl rounded-tl-none shadow-md border border-[#2A3942] space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#2A3942] pb-2">
                        <span className="font-extrabold text-[11px] text-amber-300 flex items-center gap-1.5">
                          <span>🧅</span>
                          <span>{activeLang === 'mr-en' ? 'कांदा बाजारभाव / Onion Rates' : 'प्याज मंडी भाव / Onion Rates'}</span>
                        </span>
                        <span className="text-[9px] text-[#8696A0] font-mono">Lasalgaon APMC</span>
                      </div>

                      {/* Side by Side Bi-lingual Price Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] bg-[#111B21] p-2.5 rounded-xl border border-[#222E35]">
                        <div>
                          <span className="text-[#8696A0] block">
                            {activeLang === 'mr-en' ? 'सरासरी भाव (Modal)' : 'औसत भाव (Modal)'}
                          </span>
                          <strong className="text-emerald-400 text-xs font-mono">₹2,480 / qtl</strong>
                          <span className="text-[9px] text-[#8696A0] block">Grade A: ₹2,650</span>
                        </div>
                        <div>
                          <span className="text-[#8696A0] block">
                            {activeLang === 'mr-en' ? '१४ दिवसांचा अंदाज' : '१४ दिन AI अनुमान'}
                          </span>
                          <strong className="text-amber-300 text-xs font-mono">₹2,750 / qtl</strong>
                          <span className="text-[9px] text-emerald-400 block font-semibold">+8.5% Expected</span>
                        </div>
                      </div>

                      {/* AI Recommendation */}
                      <div className="p-2 rounded-lg bg-[#182229] border border-[#2A3942] text-[10px] space-y-1">
                        <div className="flex items-center gap-1 text-amber-300 font-bold">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{activeLang === 'mr-en' ? 'AI सल्ला / Recommendation' : 'AI सलाह / Recommendation'}</span>
                        </div>
                        <p className="text-stone-300 leading-snug">
                          {activeLang === 'mr-en' ? (
                            <span>१०-१४ दिवस साठवा (+₹२३२/क्विंटल नफा) किंवा निफाडमधील ४ शेतकऱ्यांसोबत <strong>डिजिटल पूल</strong> करा!</span>
                          ) : (
                            <span>१०-१४ दिन रोकें (+₹२३२/क्विंटल लाभ) या निफाड़ के ४ किसानों के साथ <strong>डिजिटल पूल</strong> बनाएं!</span>
                          )}
                        </p>
                      </div>

                      {/* 1-Tap Action Chips */}
                      <div className="space-y-1.5 pt-1">
                        <button
                          onClick={() => {
                            setRole('farmer');
                            setIsListProduceOpen(true);
                          }}
                          className="w-full py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[10px] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>📦 1-Tap List 20 Qtl Produce Now</span>
                          <span>$\rightarrow$</span>
                        </button>
                        <button
                          onClick={() => setRole('farmer')}
                          className="w-full py-1.5 px-3 rounded-lg bg-[#111B21] hover:bg-[#182229] text-amber-300 border border-[#2A3942] font-bold text-[10px] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>🤝 Join Niphad Taluka Pool (+₹265/qtl)</span>
                          <span>$\rightarrow$</span>
                        </button>
                      </div>

                      <div className="text-right text-[9px] text-[#8696A0]">10:14 AM</div>
                    </div>
                  </div>

                  {/* Message 3: Confirmation Feedback */}
                  <div className="flex justify-start animate-fade-in">
                    <div className="max-w-[90%] bg-[#202C33] text-white p-3 rounded-2xl rounded-tl-none shadow-md border border-[#2A3942] space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                        <CheckCheck className="w-4 h-4" />
                        <span>Listing #LOT-NSK-4491 Confirmed!</span>
                      </div>
                      <p className="text-[10px] text-stone-300 leading-snug">
                        20 Qtl Red Onion published at ₹2,650/qtl. 🛡️ <strong>Micro-Insurance add-on included</strong> (₹42 premium). 3 institutional buyers notified.
                      </p>
                      <div className="text-right text-[9px] text-[#8696A0]">10:15 AM</div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Chat Input Bar (Mock) */}
                <div className="bg-[#1F2C34] p-2 px-3 flex items-center gap-2 border-t border-[#2A3942] shrink-0 text-stone-300">
                  <div className="w-7 h-7 rounded-full bg-[#2A3942] flex items-center justify-center text-xs">
                    😊
                  </div>
                  <div className="flex-1 bg-[#2A3942] rounded-full py-1.5 px-3 text-[11px] text-[#8696A0] flex items-center justify-between">
                    <span>बोलून सांगा किंवा टाईप करा...</span>
                    <span>📎</span>
                  </div>
                  <button
                    onClick={toggleAudio}
                    className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xs cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
`;

fs.writeFileSync(path, code, 'utf8');
console.log('WhatsAppAccessibility.jsx written successfully!');
