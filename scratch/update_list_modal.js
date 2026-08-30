const fs = require('fs');

const path = 'C:\\Users\\R.karthika\\Desktop\\Downloads\\agriconnect\\src\\components\\farmer\\ListProduceModal.jsx';

const code = `import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Upload,
  Sparkles,
  Camera,
  CheckCircle2,
  Award,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  FileCheck,
  RefreshCw,
  Leaf,
  Wind,
  Plus,
} from 'lucide-react';
import { CROPS_DATA, MAHARASHTRA_DISTRICTS } from '../../data/mockData';
import { GradeBadge } from '../shared/GradeBadge';

export const ListProduceModal = () => {
  const {
    isListProduceOpen,
    setIsListProduceOpen,
    addProduceLot,
    addByproductLot,
    selectedCrop,
  } = useApp();

  const [step, setStep] = useState(1); // 1: Crop Info, 2: Photo Upload, 3: AI Scanning, 4: Grade Result & Publish, 5: Byproduct Prompt
  
  // Form State
  const [cropId, setCropId] = useState(selectedCrop ? selectedCrop.id : 'onion');
  const [variety, setVariety] = useState('Garva Super Red (Export)');
  const [quantity, setQuantity] = useState(300);
  const [unit, setUnit] = useState('Quintals');
  const [askingPrice, setAskingPrice] = useState(2650);
  const [district, setDistrict] = useState('Nashik');
  const [mandi, setMandi] = useState('Lasalgaon APMC');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [organic, setOrganic] = useState(false);
  const [isInsured, setIsInsured] = useState(true);
  const [selectedPhotoSample, setSelectedPhotoSample] = useState(
    'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80'
  );

  // Byproduct prompt state
  const [selectedByproductChip, setSelectedByproductChip] = useState('Straw / Stalks');
  const [byproductQuantity, setByproductQuantity] = useState(15);
  const [byproductPrice, setByproductPrice] = useState(1850);

  // Micro-Insurance calculation: 0.8% of lot value, min Rs 45
  const lotValue = Number(quantity || 0) * Number(askingPrice || 0);
  const calculatedPremium = Math.max(45, Math.round(lotValue * 0.008));

  // AI Grading Simulation States
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMetricPhase, setScanMetricPhase] = useState('Initializing Computer Vision Models...');
  const [gradingResult, setGradingResult] = useState({
    grade: 'A',
    confidence: 96.4,
    certificateId: "MH-AGR-AI-2026-8841",
    metrics: {
      uniformity: '96.2%',
      sizeDiameter: '55-65 mm (Export Grade)',
      moistureContent: '11.2% (Optimal)',
      foreignMatter: '0.3%',
      sproutingDefects: '0.1%',
      colorIndex: 'Deep Crimson Red (98.4%)',
    },
    recommendedPriceRange: '₹2,600 - ₹2,750 / qtl',
  });

  if (!isListProduceOpen) return null;

  const currentCropObj = CROPS_DATA.find((c) => c.id === cropId) || CROPS_DATA[0];

  // Sample produce images for quick demo selection
  const samplePhotos = [
    {
      label: 'Nashik Red Onion',
      cropId: 'onion',
      url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
      suggestedGrade: 'A',
      confidence: 96.4,
    },
    {
      label: 'Latur Yellow Soybean',
      cropId: 'soybean',
      url: 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?w=600&auto=format&fit=crop&q=80',
      suggestedGrade: 'A',
      confidence: 94.8,
    },
    {
      label: 'Akola White Cotton',
      cropId: 'cotton',
      url: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600&auto=format&fit=crop&q=80',
      suggestedGrade: 'A',
      confidence: 95.2,
    },
    {
      label: 'Pune Farm Tomato',
      cropId: 'tomato',
      url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
      suggestedGrade: 'B',
      confidence: 91.0,
    },
  ];

  const byproductChips = [
    { name: 'Straw / Fodder (पेंढा)', tag: 'Cattle Feed Producer', price: 1850 },
    { name: 'Husk & Pod Shells (भुसा)', tag: 'Cattle Feed Producer', price: 2400 },
    { name: 'Stalks & Bio-matter (पराटी)', tag: 'Biomass Plant', price: 1450 },
    { name: 'Sugarcane Bagasse (पाचट)', tag: 'Packaging Manufacturer', price: 1650 },
    { name: 'Oilseed Cake (पेंड)', tag: 'Cattle Feed Producer', price: 3200 },
  ];

  // Run simulated AI Scan
  const startAIScan = () => {
    setStep(3);
    setScanProgress(0);

    const phases = [
      { p: 20, text: 'Detecting produce boundaries & segmenting lot...' },
      { p: 45, text: 'Analyzing pixel color histogram & surface blemishes...' },
      { p: 70, text: 'Calculating size diameter uniformity index...' },
      { p: 90, text: 'Estimating moisture level & defect percentage...' },
      { p: 100, text: 'Generating tamper-proof Maharashtra AI Quality Certificate...' },
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < phases.length) {
        setScanProgress(phases[i].p);
        setScanMetricPhase(phases[i].text);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setStep(4);
        }, 500);
      }
    }, 600);
  };

  const handlePublish = () => {
    const newLot = {
      cropId,
      cropName: currentCropObj.name,
      variety,
      quantity: Number(quantity),
      unit,
      askingPrice: Number(askingPrice),
      apmcBenchmark: currentCropObj.currentPrice,
      district,
      mandi,
      harvestDate,
      shelfLifeDays: cropId === 'tomato' ? 10 : cropId === 'onion' ? 90 : 180,
      isInsured,
      insurancePremium: isInsured ? calculatedPremium : 0,
      aiGrading: {
        grade: gradingResult.grade,
        confidence: gradingResult.confidence,
        certificateId: gradingResult.certificateId,
        metrics: gradingResult.metrics,
        verifiedAt: new Date().toLocaleString(),
      },
      photos: [selectedPhotoSample],
      storageStatus: "Stored at " + district + " Verified Agro Hub",
      organic,
      deliveryOptions: ['Farmer Farmgate Pickup', 'AgriConnect State Logistics to Mumbai/Pune'],
    };

    addProduceLot(newLot);
    // Move to Byproduct Prompt step
    setStep(5);
  };

  const handlePublishByproduct = () => {
    const chipObj = byproductChips.find((c) => c.name === selectedByproductChip) || byproductChips[0];
    addByproductLot({
      name: "Fresh " + currentCropObj.name.split('(')[0] + " " + selectedByproductChip.split('(')[0],
      marathiName: selectedByproductChip,
      category: 'Crop Residue & Biomass',
      sourceCrop: currentCropObj.name.split('(')[0],
      quantity: Number(byproductQuantity),
      unit: 'Tonnes',
      pricePerUnit: Number(byproductPrice),
      unitName: 'Tonne',
      district,
      location: district + " Agro Hub",
      moisturePercent: 10.5,
      densityType: 'Hydraulic Baled',
      buyerTargetTags: [chipObj.tag, 'Biomass Plant', 'Bio-fertilizer & Compost'],
      primaryBuyerTag: chipObj.tag,
    });
    setIsListProduceOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-emerald-900/10 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 relative">
          <button
            onClick={() => setIsListProduceOpen(false)}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                SIH 26132 • AI Computer Vision Pipeline
              </span>
              <h2 className="text-xl font-extrabold text-white">
                List Produce with Instant AI Quality Grading
              </h2>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-4 gap-2 mt-5 text-[11px] font-bold text-center">
            <div className={"p-1.5 rounded-lg border " + (step >= 1 ? 'bg-amber-400 text-emerald-950 border-amber-300' : 'bg-emerald-900/40 text-emerald-300 border-emerald-800')}>
              1. Details & Insurance
            </div>
            <div className={"p-1.5 rounded-lg border " + (step >= 2 ? 'bg-amber-400 text-emerald-950 border-amber-300' : 'bg-emerald-900/40 text-emerald-300 border-emerald-800')}>
              2. Lot Photo
            </div>
            <div className={"p-1.5 rounded-lg border " + (step >= 3 ? 'bg-amber-400 text-emerald-950 border-amber-300' : 'bg-emerald-900/40 text-emerald-300 border-emerald-800')}>
              3. AI Scanner
            </div>
            <div className={"p-1.5 rounded-lg border " + (step >= 4 ? 'bg-amber-400 text-emerald-950 border-amber-300' : 'bg-emerald-900/40 text-emerald-300 border-emerald-800')}>
              4. Certificate & Submit
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1: Crop Details Form + Micro-Insurance Toggle */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Select Crop Type
                  </label>
                  <select
                    value={cropId}
                    onChange={(e) => {
                      setCropId(e.target.value);
                      const sel = CROPS_DATA.find((c) => c.id === e.target.value);
                      if (sel) {
                        setAskingPrice(sel.currentPrice + 120);
                        const matchSample = samplePhotos.find((p) => p.cropId === sel.id);
                        if (matchSample) setSelectedPhotoSample(matchSample.url);
                      }
                    }}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-emerald-700"
                  >
                    {CROPS_DATA.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Crop Variety / Seed Line
                  </label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-emerald-700"
                    placeholder="e.g. Garva Super Red / JS-335"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Lot Quantity (Quintals)
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-emerald-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Expected Asking Price (₹/qtl)
                  </label>
                  <input
                    type="number"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-emerald-700"
                  />
                  <span className="text-[10px] text-stone-500 mt-1 block">
                    Today APMC Benchmark: <strong>₹{currentCropObj.currentPrice}/qtl</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    District (Maharashtra)
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900 focus:outline-emerald-700"
                  >
                    {MAHARASHTRA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Harvest Date
                  </label>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-emerald-700"
                  />
                </div>
              </div>

              {/* 3. FEATURE 3: MICRO-INSURANCE AT POINT OF SALE TOGGLE CARD */}
              <div className={"p-4 rounded-2xl border transition-all space-y-2 " + (
                isInsured
                  ? "bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white border-emerald-700 shadow-md"
                  : "bg-stone-50 text-stone-700 border-stone-200"
              )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={"w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 " + (
                      isInsured ? "bg-amber-400/20 text-amber-300 border border-amber-300/40" : "bg-stone-200 text-stone-600"
                    )}>
                      🛡️
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={"text-xs font-black " + (isInsured ? "text-white" : "text-stone-900")}>
                          Insure this shipment against transit & storage damage?
                        </h4>
                        <span className={"text-[10px] font-mono font-bold px-2 py-0.5 rounded-full " + (
                          isInsured ? "bg-amber-400 text-emerald-950" : "bg-stone-200 text-stone-700"
                        )}>
                          ₹{calculatedPremium.toLocaleString()} — 0.8% of lot value
                        </span>
                      </div>
                      <p className={"text-[11px] leading-relaxed " + (isInsured ? "text-emerald-200" : "text-stone-500")}>
                        Covers transit rain, truck overturn & warehouse moisture spoilage with 48h direct Aadhaar DBT payout.
                      </p>
                      <span className={"text-[9px] block font-semibold " + (isInsured ? "text-amber-300" : "text-stone-400")}>
                        *AgriConnect Micro-Protection (Underwritten by State Pool) — Distinct from seasonal PMFBY crop insurance
                      </span>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={isInsured}
                      onChange={(e) => setIsInsured(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="organic-cert"
                  checked={organic}
                  onChange={(e) => setOrganic(e.target.checked)}
                  className="rounded text-emerald-800 focus:ring-emerald-700 w-4 h-4"
                />
                <label htmlFor="organic-cert" className="text-xs font-semibold text-stone-700">
                  Certified Organic / Good Agricultural Practices (GAP) Lot
                </label>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  <span>Continue to Photo Upload</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Photo Upload & Sample Selection */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-extrabold text-stone-900">
                  Upload Farmgate Produce Photo for Computer Vision Inspection
                </h3>
                <p className="text-xs text-stone-500">
                  Place a representative sample on a clean sheet with natural lighting.
                </p>
              </div>

              {/* Upload Dropzone Simulation */}
              <div className="border-2 border-dashed border-emerald-600/40 rounded-2xl p-6 bg-emerald-50/40 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-800">
                    Drag & Drop lot photo or click to take photo
                  </div>
                  <div className="text-[10px] text-stone-500">
                    Supports JPG, PNG, WEBP (Smartphone High-Res)
                  </div>
                </div>
              </div>

              {/* Quick Sample Selector for Demo Testing */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-2">
                  Or select a demo lot photograph:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {samplePhotos.map((photo, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedPhotoSample(photo.url);
                        setCropId(photo.cropId);
                      }}
                      className={"cursor-pointer rounded-xl border-2 overflow-hidden transition-all " + (
                        selectedPhotoSample === photo.url
                          ? 'border-emerald-700 ring-2 ring-emerald-500/50 scale-[1.03]'
                          : 'border-stone-200 opacity-70 hover:opacity-100'
                      )}
                    >
                      <img src={photo.url} alt={photo.label} className="w-full h-20 object-cover" />
                      <div className="p-1.5 bg-white text-[10px] font-bold text-stone-800 truncate">
                        {photo.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-200">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={startAIScan}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-950" />
                  <span>Run AI Quality Scanner</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Computer Vision Scanner Animation */}
          {step === 3 && (
            <div className="space-y-6 text-center py-4">
              <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden border-4 border-emerald-700 shadow-xl bg-stone-900">
                <img
                  src={selectedPhotoSample}
                  alt="Produce Under Scan"
                  className="w-full h-full object-cover opacity-80"
                />

                {/* Laser Scanning Bar */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#E9C46A] animate-scan" />

                {/* Bounding Box HUD Overlays */}
                <div className="absolute top-4 left-4 border border-emerald-400 text-[9px] font-mono text-emerald-300 px-1 bg-black/40">
                  CV_ROI #1: 96.2%
                </div>
                <div className="absolute bottom-6 right-4 border border-amber-400 text-[9px] font-mono text-amber-300 px-1 bg-black/40">
                  MOISTURE: 11.2%
                </div>
                <div className="absolute top-1/2 left-1/3 w-16 h-16 border-2 border-dashed border-emerald-300 rounded-full" />
              </div>

              {/* Progress Bar & Phase */}
              <div className="max-w-md mx-auto space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-700 animate-spin" />
                    {scanMetricPhase}
                  </span>
                  <span className="font-mono text-emerald-800">{scanProgress}%</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-600 to-amber-400 h-full transition-all duration-300"
                    style={{ width: scanProgress + '%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AI Certificate, Insurance Summary & Publish */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Certificate Card */}
              <div className="bg-gradient-to-b from-emerald-50 to-white rounded-2xl p-5 border-2 border-emerald-600 shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <GradeBadge grade={gradingResult.grade} confidence={gradingResult.confidence} size="md" />
                      <span className="text-xs font-bold text-stone-900">{variety}</span>
                    </div>
                    <span className="text-[10px] text-stone-500 font-mono block mt-0.5">
                      Certificate ID: <strong>{gradingResult.certificateId}</strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 block">AI Recommended Price</span>
                    <span className="text-sm font-black text-emerald-800 font-mono">
                      {gradingResult.recommendedPriceRange}
                    </span>
                  </div>
                </div>

                {/* Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Size Diameter</span>
                    <strong className="text-stone-900">{gradingResult.metrics.sizeDiameter}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Moisture Content</span>
                    <strong className="text-stone-900">{gradingResult.metrics.moistureContent}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Uniformity Score</span>
                    <strong className="text-emerald-700">{gradingResult.metrics.uniformity}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Foreign Matter</span>
                    <strong className="text-stone-900">{gradingResult.metrics.foreignMatter}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Sprouting / Rot</span>
                    <strong className="text-stone-900">{gradingResult.metrics.sproutingDefects}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Color Index</span>
                    <strong className="text-stone-900">{gradingResult.metrics.colorIndex}</strong>
                  </div>
                </div>

                {/* Insurance Confirmation Badge */}
                {isInsured && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950 text-amber-300 text-xs border border-emerald-800">
                    <div className="flex items-center gap-2">
                      <span>🛡️</span>
                      <strong className="text-white">Micro-Insurance Active (₹{calculatedPremium.toLocaleString()} premium)</strong>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-200">Transit & Storage Protected</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-scan
                </button>

                <button
                  onClick={handlePublish}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-lg transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>Publish Lot & Check Byproducts</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: FEATURE 2: POST-HARVEST BYPRODUCT LISTING PROMPT */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in text-stone-900">
              <div className="p-4 rounded-2xl bg-emerald-100/60 border border-emerald-300 text-emerald-950 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-extrabold text-xs">Produce Lot Successfully Listed!</h4>
                  <p className="text-[11px] text-emerald-900/80">Certified Grade {gradingResult.grade} • {isInsured ? '🛡️ Insured shipment' : 'Standard listing'}</p>
                </div>
              </div>

              {/* Byproduct Prompt Card */}
              <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl p-5 border-2 border-amber-300 shadow-sm space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase">
                    <Leaf className="w-3 h-3 text-amber-800" />
                    <span>Circular Economy Add-On</span>
                  </div>
                  <h3 className="text-sm font-black text-stone-900">
                    Also list byproducts from this {currentCropObj.name.split('(')[0]} harvest?
                  </h3>
                  <p className="text-xs text-stone-600">
                    Connect directly with Cattle Feed & Biomass buyers to earn extra income and prevent stubble burning.
                  </p>
                </div>

                {/* Quick-Select Chips */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 block">
                    Quick-Select Byproduct Type:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {byproductChips.map((chip, idx) => {
                      const isSel = selectedByproductChip === chip.name;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedByproductChip(chip.name);
                            setByproductPrice(chip.price);
                          }}
                          className={"px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border " + (
                            isSel
                              ? "bg-amber-400 text-emerald-950 border-amber-500 shadow-xs font-black"
                              : "bg-white text-stone-700 border-stone-300 hover:bg-amber-50/60"
                          )}
                        >
                          {chip.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity & Price Fields */}
                <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      Residue Quantity (Tonnes)
                    </label>
                    <input
                      type="number"
                      value={byproductQuantity}
                      onChange={(e) => setByproductQuantity(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      Asking Rate (₹/Tonne)
                    </label>
                    <input
                      type="number"
                      value={byproductPrice}
                      onChange={(e) => setByproductPrice(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl font-bold text-stone-900"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-100/60 border border-amber-300 text-[11px] text-amber-950 flex items-center gap-2">
                  <Wind className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>
                    Listing {byproductQuantity} Tonnes will prevent ~{(byproductQuantity * 1.5).toFixed(1)} MT CO2 and add +₹{(byproductQuantity * byproductPrice).toLocaleString()} extra revenue!
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setIsListProduceOpen(false)}
                  className="text-xs font-bold text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Skip for Now
                </button>

                <button
                  onClick={handlePublishByproduct}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-emerald-950 font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>List Byproduct on Exchange</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync(path, code, 'utf8');
console.log('ListProduceModal.jsx updated successfully!');
