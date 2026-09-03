import React from 'react';
import { AlertTriangle, Megaphone } from 'lucide-react';
import { NewsTickerItem } from '../types';

interface NewsTickerBarProps {
  tickers: NewsTickerItem[];
}

export const NewsTickerBar: React.FC<NewsTickerBarProps> = ({ tickers }) => {
  const activeTickers = tickers.filter(t => Number(t.is_active) === 1);

  if (activeTickers.length === 0) return null;

  // Combine ticker text with hazard bullet separators
  const combinedText = activeTickers.map(t => t.content).join('   ⚠️   ');

  return (
    <div className="sticky top-[64px] z-30 shadow-2xl">
      {/* Top Hazard Stripe Line */}
      <div className="police-line-stripes-border" />

      {/* Police Line Yellow Banner */}
      <div className="police-line-banner py-2 px-4 text-xs sm:text-sm font-extrabold flex items-center gap-3">
        {/* Label Badge: Black Police Caution Badge */}
        <div className="flex items-center gap-1.5 bg-slate-950 text-yellow-400 border border-yellow-500/40 px-3 py-1 rounded-md font-black text-[11px] uppercase tracking-wider shrink-0 shadow-lg">
          <AlertTriangle size={14} className="text-yellow-400 animate-pulse" />
          <Megaphone size={14} className="text-yellow-400" />
          <span>PENGUMUMAN</span>
        </div>

        {/* Ticker Content: Bold Black Text on Yellow */}
        <div className="flex-1 overflow-hidden relative whitespace-nowrap">
          <div className="inline-block animate-marquee pl-4">
            <span className="font-black text-slate-950 tracking-wide mr-12">{combinedText}</span>
            <span className="font-black text-slate-950 tracking-wide">{combinedText}</span>
          </div>
        </div>
      </div>

      {/* Bottom Hazard Stripe Line */}
      <div className="police-line-stripes-border" />
    </div>
  );
};
