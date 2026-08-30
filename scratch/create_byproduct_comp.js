const fs = require('fs');

const code = `import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Search,
  Filter,
  Leaf,
  Wind,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Flame,
  Award,
  Factory,
  Package,
  Layers,
} from 'lucide-react';
import { TrustBadge } from '../shared/TrustBadge';
import { MAHARASHTRA_DISTRICTS } from '../../data/mockData';

export const ByproductExchange = () => {
  const {
    byproductLots,
    buyByproductLot,
    setIsByproductModalOpen,
  } = useApp();

  const [selectedBuyerTag, setSelectedBuyerTag] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const buyerTags = [
    { id: 'all', label: 'All Industries', icon: '🌐' },
    { id: 'Cattle Feed Producer', label: 'Cattle Feed Producer', icon: '🐮' },
    { id: 'Biomass Plant', label: 'Biomass / Biofuel Plant', icon: '⚡' },
    { id: 'Mushroom Cultivator', label: 'Mushroom Cultivator', icon: '🍄' },
    { id: 'Packaging Manufacturer', label: 'Packaging Manufacturer', icon: '📦' },
  ];

  // Filtering
  const filteredByproducts = byproductLots.filter((lot) => {
    if (selectedBuyerTag !== 'all' && !lot.buyerTargetTags.includes(selectedBuyerTag)) return false;
    if (selectedDistrict !== 'all' && lot.district !== selectedDistrict) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lot.name.toLowerCase().includes(q);
      const matchMarathi = lot.marathiName.toLowerCase().includes(q);
      const matchCrop = lot.sourceCrop.toLowerCase().includes(q);
      const matchLoc = lot.location.toLowerCase().includes(q);
      if (!matchName && !matchMarathi && !matchCrop && !matchLoc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Environmental Clean Air Callout & Impact Hero */}
      <div className="bg-gradient-to-r from-teal-950 via-emerald-950 to-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-teal-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/80 text-emerald-300 text-xs font-bold shadow-inner">
              <Leaf className="w-3.5 h-3.5 text-amber-300" />
              <span>CIRCULAR AGRI-ECONOMY • ZERO STUBBLE BURNING</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Crop Residue & Agricultural Byproduct Exchange
            </h2>
            
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Monetize harvest biomass (straw, husk, stalks, bagasse, oilseed cake) by connecting directly with industrial buyers.
            </p>

            {/* Crucial Air Pollution Callout */}
            <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs flex items-start gap-3">
              <Wind className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">
                  Reduces crop-residue burning — 1 of India's largest seasonal air pollution sources.
                </strong>
                <span className="text-[11px] text-amber-200/90">
                  Every tonne of residue traded on AgriConnect prevents ~1.5 tonnes of CO2 and hazardous particulate emissions while generating up to ₹3,500/Tonne additional farm income.
                </span>
              </div>
            </div>
          </div>

          {/* Impact Scorecard */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto shrink-0 text-xs">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] text-emerald-300 font-bold uppercase block">CO2 Emissions Averted</span>
              <strong className="text-xl font-black text-white font-mono">540+ MT</strong>
              <span className="text-[10px] text-emerald-400 block mt-0.5">360 Tonnes Bio-Residue</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] text-amber-300 font-bold uppercase block">Extra Farmer Income</span>
              <strong className="text-xl font-black text-amber-300 font-mono">₹18.4 Lakhs</strong>
              <span className="text-[10px] text-emerald-300 block mt-0.5">100% Escrow Direct DBT</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Industry Category Filters Ribbon */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by residue name (e.g. straw, husk, stalks, bagasse)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-teal-700"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
            <span className="text-stone-500 font-semibold shrink-0">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-teal-700"
            >
              <option value="all">All Maharashtra</option>
              {MAHARASHTRA_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-stone-400 uppercase shrink-0 mr-1">Buyer Industry:</span>
          {buyerTags.map((tag) => {
            const isSelected = selectedBuyerTag === tag.id;
            return (
              <button
                key={tag.id}
                onClick={() => setSelectedBuyerTag(tag.id)}
                className={"flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer border " + (
                  isSelected
                    ? "bg-teal-900 text-white border-teal-800 shadow-sm"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
                )}
              >
                <span>{tag.icon}</span>
                <span>{tag.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Byproduct Lots Grid */}
      {filteredByproducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
          <div className="text-3xl">🌾</div>
          <h3 className="text-base font-bold text-stone-800">No byproduct listings match this filter</h3>
          <p className="text-xs text-stone-500">
            Try resetting your filters or selecting "All Industries" to view available crop residues.
          </p>
          <button
            onClick={() => {
              setSelectedBuyerTag('all');
              setSelectedDistrict('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-teal-900 text-white text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredByproducts.map((lot) => (
            <div
              key={lot.id}
              className="bg-white rounded-3xl border border-stone-200 shadow-xs hover:shadow-xl hover:border-teal-700/40 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Photo & Badges */}
                <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                  <img
                    src={lot.image}
                    alt={lot.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full bg-amber-400 text-emerald-950 shadow-xs">
                      {lot.primaryBuyerTag}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                      #{lot.id}
                    </span>
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white text-xs">
                    <span className="flex items-center gap-1 font-semibold text-stone-200">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      {lot.location}
                    </span>
                    <span className="font-bold text-amber-300 font-mono">
                      {lot.quantity} {lot.unit}
                    </span>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-black text-base text-stone-900 group-hover:text-teal-900 transition-colors leading-snug">
                      {lot.name}
                    </h3>
                    <p className="text-xs font-medium text-emerald-800 mt-0.5">
                      {lot.marathiName} • Source: {lot.sourceCrop}
                    </p>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {lot.description}
                  </p>

                  {/* Quality & Density Specs */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-stone-400 font-semibold block">Moisture:</span>
                      <strong className="text-stone-800">{lot.moisturePercent}% (Dry Baled)</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 font-semibold block">Density:</span>
                      <strong className="text-stone-800 truncate block">{lot.densityType.split(' ')[0]}</strong>
                    </div>
                  </div>

                  {/* Target Buyer Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {lot.buyerTargetTags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-900 border border-teal-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Environmental Callout Badge */}
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Wind className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Prevents {lot.co2SavedTonnes}T CO2 Emissions</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      Clean Air
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer / Price & Action */}
              <div className="p-5 pt-0">
                <div className="flex items-end justify-between pb-3 border-b border-stone-100">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold block">Residue Asking Rate</span>
                    <div className="text-xl font-black text-emerald-800 font-mono">
                      ₹{lot.pricePerUnit.toLocaleString()}
                      <span className="text-xs font-normal text-stone-500"> / {lot.unitName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 block">Total Lot Value</span>
                    <span className="text-xs font-black text-stone-900 font-mono">
                      ₹{(lot.pricePerUnit * lot.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => buyByproductLot(lot)}
                    className="w-full py-2.5 rounded-xl bg-teal-900 hover:bg-teal-950 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Purchase via State Escrow Pool</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
`;

fs.writeFileSync('C:\\Users\\R.karthika\\Desktop\\Downloads\\agriconnect\\src\\components\\buyer\\ByproductExchange.jsx', code, 'utf8');
console.log('ByproductExchange.jsx written successfully!');
