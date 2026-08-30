const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  Building2,
  Zap,
  RefreshCw,
  Award,
  DollarSign,
  ChevronRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { TrustBadge } from '../shared/TrustBadge';

export const DigitalMandiPooling = () => {
  const {
    talukaPools,
    activePoolId,
    setActivePoolId,
    joinPool,
    acceptPoolBid,
  } = useApp();

  const currentPool = talukaPools.find((p) => p.id === activePoolId) || talukaPools[0];
  const [isJoined, setIsJoined] = useState(true);
  const [biddingStep, setBiddingStep] = useState(4); // 1 to 4 bids
  const [isSimulatingAuction, setIsSimulatingAuction] = useState(false);
  const [liveBids, setLiveBids] = useState(currentPool.bids);

  // Sync with current pool
  useEffect(() => {
    setLiveBids(currentPool.bids);
    setBiddingStep(currentPool.bids.length);
  }, [currentPool]);

  // Restart live simulated reverse auction
  const startLiveAuctionSimulation = () => {
    setIsSimulatingAuction(true);
    setBiddingStep(1);
    setLiveBids([currentPool.bids[0]]);

    let step = 1;
    const interval = setInterval(() => {
      step++;
      if (step <= currentPool.bids.length) {
        setBiddingStep(step);
        setLiveBids(currentPool.bids.slice(0, step));
      } else {
        clearInterval(interval);
        setIsSimulatingAuction(false);
      }
    }, 1800);
  };

  const currentWinningBidObj = liveBids[liveBids.length - 1] || currentPool.bids[0];
  const premiumOverMandi = currentWinningBidObj.bidPrice - currentPool.individualModalRate;
  const isLocked = currentPool.status === 'LOCKED_IN_ESCROW';

  return (
    <div className="space-y-6">
      {/* 1. Smart Taluka Pooling Banner / Prompt */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-3xl p-6 sm:p-7 text-emerald-950 shadow-lg border border-amber-300">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-amber-300 text-[11px] font-black tracking-wide shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>DIGITAL MANDI POOLING • TALUKA AGGREGATION</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950 leading-snug">
              4 nearby farmers in your taluka are also listing onion this week
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-emerald-950/80 max-w-2xl">
              Pool your lot of 15 Qtl with nearby Niphad farmers to form an 18.5 Tonne institutional lot. Bulk buyer lots command <strong>+₹{currentPool.bulkPremiumPerQtl}/qtl extra</strong> over individual spot prices!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
            <div className="bg-emerald-950/10 backdrop-blur-xs p-3 rounded-2xl border border-emerald-950/15 text-center">
              <span className="text-[10px] font-extrabold uppercase text-emerald-900 block">Taluka Lot Volume</span>
              <strong className="text-lg font-black text-emerald-950">{currentPool.combinedQuantity} Quintals</strong>
            </div>

            <div className="bg-emerald-950 text-amber-300 p-3 rounded-2xl shadow-md text-center">
              <span className="text-[10px] font-extrabold uppercase text-amber-200/80 block">Bulk Premium Gain</span>
              <strong className="text-lg font-black text-white font-mono">+₹{currentPool.bulkPremiumPerQtl}/qtl</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pool Selection Tabs & Taluka Navigation */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-500 shrink-0">Select Taluka Pool:</span>
          {talukaPools.map((pool) => (
            <button
              key={pool.id}
              onClick={() => setActivePoolId(pool.id)}
              className={"flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer border " + (
                activePoolId === pool.id
                  ? "bg-emerald-800 text-white border-emerald-700 shadow-sm"
                  : "bg-white text-stone-700 hover:bg-stone-50 border-stone-200"
              )}
            >
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>{pool.taluka} Taluka ({pool.cropName.split('(')[0]})</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10">
                {pool.combinedQuantity} Qtl
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={startLiveAuctionSimulation}
          disabled={isSimulatingAuction || isLocked}
          className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0 " + (
            isSimulatingAuction
              ? "bg-amber-100 text-amber-900 border-amber-300"
              : "bg-white hover:bg-stone-50 text-stone-700 border-stone-300"
          )}
        >
          <RefreshCw className={"w-3.5 h-3.5 " + (isSimulatingAuction ? "animate-spin text-amber-700" : "text-stone-500")} />
          <span>{isSimulatingAuction ? "Auction in progress..." : "Simulate Live Bidding"}</span>
        </button>
      </div>

      {/* 3. Main Pooling Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Pooled Lot Summary & Participating Farmers */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pooled Lot Specs Card */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-mono font-bold text-stone-500">#{currentPool.id}</span>
                </div>
                <h3 className="font-extrabold text-base text-stone-900">{currentPool.cropName}</h3>
              </div>

              <span className={"text-[10px] font-bold px-2.5 py-1 rounded-full border " + (
                isLocked
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-amber-100 text-amber-900 border-amber-300"
              )}>
                {isLocked ? "🔒 ESCROW LOCKED" : "⚡ LIVE REVERSE AUCTION"}
              </span>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
                <span className="text-[10px] text-stone-500 font-bold block">Combined Lot Size</span>
                <strong className="text-base font-black text-stone-900 font-mono">
                  {currentPool.combinedQuantity} Quintals
                </strong>
                <span className="text-[10px] text-stone-400 block mt-0.5">({(currentPool.combinedQuantity / 10).toFixed(1)} Metric Tonnes)</span>
              </div>

              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
                <span className="text-[10px] text-stone-500 font-bold block">Spot Mandi Rate</span>
                <strong className="text-base font-black text-stone-700 font-mono">
                  ₹{currentPool.individualModalRate}
                </strong>
                <span className="text-[10px] text-stone-400 block mt-0.5">Single-lot base price</span>
              </div>
            </div>

            {/* Participating Farmers Roster */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>Participating Farmers ({currentPool.participatingFarmers.length})</span>
                </h4>
                <span className="text-[10px] text-stone-500">First Name + Village Only</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {currentPool.participatingFarmers.map((f, i) => (
                  <div
                    key={f.id || i}
                    className={"p-3 rounded-2xl flex items-center justify-between text-xs border transition-colors " + (
                      f.isCurrentUser
                        ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold"
                        : "bg-stone-50 border-stone-200 text-stone-800"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{f.avatar || '👨‍🌾'}</span>
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{f.name}</span>
                          {f.isCurrentUser && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-800 text-white font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-500">{f.village}, {currentPool.district}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <strong className="text-emerald-800 font-mono">{f.quantity} Qtl</strong>
                      <span className="text-[10px] text-stone-400 block">
                        ({Math.round((f.quantity / currentPool.combinedQuantity) * 100)}% share)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandi Pickup Hub */}
            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Mandi Aggregation Bay</span>
              </div>
              <p className="text-[11px] text-amber-900/90 leading-snug">
                {currentPool.mandiPickupHub} • Zero individual transport friction. Transporter loads all lots in 1 container.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Live Reverse Auction Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-gradient-to-b from-stone-900 to-emerald-950 rounded-3xl p-6 text-white shadow-xl border border-emerald-800/80 space-y-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Auction Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-emerald-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Institutional Reverse Auction
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Live Institutional Bids for {currentPool.taluka} Pooled Lot
                </h3>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-emerald-300 block">Current Best Offer</span>
                <span className="text-2xl font-black text-amber-300 font-mono">
                  ₹{currentWinningBidObj.bidPrice.toLocaleString()}
                  <span className="text-xs font-normal text-emerald-200"> / qtl</span>
                </span>
              </div>
            </div>

            {/* Bulk Premium Advantage Pill */}
            <div className="bg-emerald-900/80 rounded-2xl p-4 border border-emerald-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs text-emerald-200 font-semibold">
                  Individual Rate: <strong>₹{currentPool.individualModalRate}/qtl</strong> $\rightarrow$ Bulk Pooled Rate: <strong className="text-amber-300">₹{currentWinningBidObj.bidPrice}/qtl</strong>
                </span>
                <div className="text-[11px] text-emerald-300/80">
                  Total Lot Escrow Value: <strong>₹{(currentWinningBidObj.bidPrice * currentPool.combinedQuantity).toLocaleString()}</strong>
                </div>
              </div>

              <div className="bg-amber-400 text-emerald-950 px-3 py-1.5 rounded-xl font-black text-xs font-mono shrink-0 shadow-sm">
                +₹{premiumOverMandi}/qtl Bulk Gain
              </div>
            </div>

            {/* Live Incoming Bids Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                <span>Verified Buyer Bidding Timeline</span>
                <span>{liveBids.length} Active Bids Placed</span>
              </div>

              <div className="space-y-2.5">
                {liveBids.map((bid, index) => {
                  const isTopBid = index === liveBids.length - 1;
                  return (
                    <div
                      key={bid.id}
                      className={"p-4 rounded-2xl border transition-all duration-500 flex items-center justify-between text-xs animate-fade-in " + (
                        isTopBid
                          ? "bg-gradient-to-r from-amber-500/20 via-emerald-800/40 to-emerald-900/60 border-amber-400 shadow-md scale-[1.01]"
                          : "bg-emerald-950/60 border-emerald-800/60 text-emerald-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0">
                          {bid.avatar || '🏢'}
                        </div>
                        <div>
                          <div className="font-extrabold text-white flex items-center gap-2">
                            <span>{bid.buyerName}</span>
                            {isTopBid && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950 font-black tracking-wider uppercase">
                                Winning Bid
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-300/80">{bid.buyerType} • {bid.time}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-amber-300 font-mono">
                          ₹{bid.bidPrice.toLocaleString()} <span className="text-[10px] font-normal text-emerald-200">/ qtl</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 block font-semibold">
                          +₹{bid.bidPrice - currentPool.individualModalRate}/qtl above spot
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Guaranteed Escrow Callout */}
            <div className="p-4 rounded-2xl bg-emerald-900/50 border border-emerald-700/60 flex items-start gap-3 text-xs text-emerald-200">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">
                  Best offer applies to ALL {currentPool.participatingFarmers.length} pooled farmers
                </strong>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed mt-0.5">
                  Winning buyer deposits 100% pre-funded Escrow into the AgriConnect State Escrow Pool. Each farmer receives direct Aadhaar DBT payout proportional to their quintals upon mandi weighbridge QA signoff.
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2">
              {isLocked ? (
                <div className="p-4 rounded-2xl bg-emerald-800 text-white border border-emerald-600 text-center space-y-1">
                  <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>DEAL LOCKED IN 100% STATE ESCROW</span>
                  </div>
                  <p className="text-xs text-emerald-100">
                    Dispatch scheduled at MSWC Niphad Aggregation Bay. Payout of ₹{(currentWinningBidObj.bidPrice * 15).toLocaleString()} earmarked for your 15 Qtl share.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => acceptPoolBid(currentPool.id)}
                    className="w-full flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-black text-xs shadow-lg shadow-amber-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-emerald-950" />
                    <span>Accept Best Offer (₹{currentWinningBidObj.bidPrice}/qtl) for All Farmers</span>
                  </button>

                  <button
                    onClick={() => setIsJoined(!isJoined)}
                    className="py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-emerald-200 font-bold text-xs border border-white/20 transition-colors cursor-pointer text-center"
                  >
                    {isJoined ? "Opt Out (Sell Solo)" : "Opt In with 15 Qtl"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('C:\\Users\\R.karthika\\Desktop\\Downloads\\agriconnect\\src\\components\\farmer\\DigitalMandiPooling.jsx', code, 'utf8');
console.log('DigitalMandiPooling.jsx written successfully!');
