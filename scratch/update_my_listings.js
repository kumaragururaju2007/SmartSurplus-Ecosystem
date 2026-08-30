const fs = require('fs');

const path = 'C:\\Users\\R.karthika\\Desktop\\Downloads\\agriconnect\\src\\components\\farmer\\MyListings.jsx';

const code = `import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  ArrowRight,
  Clock,
  Coins,
  Building2,
  Leaf,
  Wind,
} from 'lucide-react';
import { GradeBadge } from '../shared/GradeBadge';
import { TrustBadge } from '../shared/TrustBadge';

export const MyListings = () => {
  const {
    produceLots,
    byproductLots,
    buyerOffers,
    acceptOffer,
    rejectOffer,
    setIsListProduceOpen,
  } = useApp();

  // Filter farmer's lots (using mock farmer lots)
  const myLots = produceLots.slice(0, 4);
  const myByproducts = byproductLots.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* 1. Incoming Buyer Offers Section */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-extrabold text-base text-stone-900">
                Incoming Buyer Offers (Escrow Pre-Funded)
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Verified buyers who have deposited 100% escrow funds ready for instant release.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            {buyerOffers.filter((o) => o.status === 'PENDING_FARMER_ACTION').length} Pending Review
          </span>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buyerOffers.map((offer) => {
            const isPending = offer.status === 'PENDING_FARMER_ACTION';
            const isAccepted = offer.status === 'ACCEPTED_IN_ESCROW';
            const isRejected = offer.status === 'REJECTED';

            return (
              <div
                key={offer.id}
                className={"p-5 rounded-2xl border transition-all space-y-4 " + (
                  isAccepted
                    ? 'bg-emerald-950 text-white border-emerald-700 shadow-md'
                    : isRejected
                    ? 'bg-stone-100 text-stone-500 border-stone-300 opacity-60'
                    : 'bg-gradient-to-b from-amber-50/40 to-white border-amber-300/80 shadow-xs'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={"text-[10px] font-mono font-bold block " + (isAccepted ? 'text-emerald-300' : 'text-stone-500')}>
                      Offer #{offer.id} • Lot #{offer.lotId}
                    </span>
                    <h4 className={"text-sm font-extrabold mt-0.5 " + (isAccepted ? 'text-white' : 'text-stone-900')}>
                      {offer.cropName}
                    </h4>
                  </div>
                  <TrustBadge tier={offer.buyerTrustTier} score={offer.buyerTrustScore} size="sm" />
                </div>

                {/* Buyer & Price Info */}
                <div className={"p-3 rounded-xl text-xs space-y-2 " + (isAccepted ? 'bg-emerald-900/60 border border-emerald-800' : 'bg-stone-50 border border-stone-200')}>
                  <div className="flex items-center justify-between">
                    <span className={isAccepted ? 'text-emerald-200' : 'text-stone-500'}>Buyer:</span>
                    <strong className={isAccepted ? 'text-white' : 'text-stone-900'}>{offer.buyerName}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isAccepted ? 'text-emerald-200' : 'text-stone-500'}>Offered Rate:</span>
                    <span className={"text-base font-black " + (isAccepted ? 'text-amber-300' : 'text-emerald-800')}>
                      ₹{offer.offeredPrice.toLocaleString()} / qtl
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-current/10">
                    <span className={isAccepted ? 'text-emerald-200' : 'text-stone-500'}>Total Value ({offer.quantity} Qtl):</span>
                    <strong className={isAccepted ? 'text-white' : 'text-stone-900'}>₹{offer.totalOfferValue.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Status or Action Buttons */}
                {isPending && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => acceptOffer(offer.id)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Accept & Lock Escrow</span>
                    </button>
                    <button
                      onClick={() => rejectOffer(offer.id)}
                      className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs border border-stone-300 transition-colors cursor-pointer"
                      title="Decline"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {isAccepted && (
                  <div className="p-2.5 rounded-xl bg-emerald-900 text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 border border-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>LOCKED IN STATE ESCROW (Ready for QA)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Farmer's Active Produce Lots */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-extrabold text-base text-stone-900">
              My Active Produce Listings
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Certified lots visible to institutional buyers across Maharashtra.
            </p>
          </div>

          <button
            onClick={() => setIsListProduceOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            + List New Produce Lot
          </button>
        </div>

        {/* Lots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {myLots.map((lot) => (
            <div
              key={lot.id}
              className="rounded-2xl border border-stone-200 overflow-hidden bg-white hover:border-emerald-700/50 transition-all flex flex-col justify-between shadow-2xs"
            >
              <div>
                {/* Photo & Badges */}
                <div className="relative h-32 w-full overflow-hidden bg-stone-100">
                  <img src={lot.photos[0]} alt={lot.cropName} className="w-full h-full object-cover" />
                  
                  {/* Badges Overlay */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    <GradeBadge grade={lot.aiGrading.grade} confidence={lot.aiGrading.confidence} size="sm" />
                    {lot.isInsured && (
                      <span className="text-[9px] font-black bg-emerald-950/90 text-amber-300 px-2 py-0.5 rounded-full border border-emerald-600/80 shadow-xs flex items-center gap-1 backdrop-blur-xs">
                        🛡️ Insured shipment
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    #{lot.id}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="text-sm font-extrabold text-stone-900">{lot.cropName}</h4>
                  <div className="text-xs text-stone-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <strong className="text-stone-900">{lot.quantity} {lot.unit}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Asking Price:</span>
                      <strong className="text-emerald-800">₹{lot.askingPrice}/qtl</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage Location:</span>
                      <span className="text-stone-700 font-medium truncate max-w-[140px]">{lot.district}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {lot.offersCount || 0} Offers Active
                </span>
                <span className="text-[10px] text-stone-500">
                  Shelf Life: {lot.shelfLifeDays}D
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Farmer's Active Byproduct / Residue Listings */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-900/10 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-700" />
              <h3 className="font-extrabold text-base text-stone-900">
                My Active Byproduct & Residue Listings
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Harvest waste monetized on the Byproduct Exchange, generating extra income and zero air pollution.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
            🌱 {myByproducts.reduce((acc, b) => acc + (b.co2SavedTonnes || 0), 0)}T Total CO2 Averted
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {myByproducts.map((byp) => (
            <div
              key={byp.id}
              className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 hover:bg-white hover:border-emerald-700/40 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-stone-500 block">#{byp.id}</span>
                  <h4 className="text-xs font-extrabold text-stone-900 mt-0.5">{byp.name}</h4>
                  <span className="text-[10px] text-emerald-800 font-medium">{byp.marathiName}</span>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-emerald-950">
                  {byp.primaryBuyerTag}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-400 block">Quantity:</span>
                  <strong className="text-stone-900">{byp.quantity} {byp.unit}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block">Price:</span>
                  <strong className="text-emerald-800 font-mono">₹{byp.pricePerUnit}/{byp.unitName}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1">
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <Wind className="w-3 h-3" />
                  Prevents {byp.co2SavedTonnes}T CO2
                </span>
                <span className="text-emerald-800 font-semibold">Active on Exchange</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync(path, code, 'utf8');
console.log('MyListings.jsx updated successfully!');
