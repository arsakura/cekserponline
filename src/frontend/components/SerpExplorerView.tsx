import React, { useState } from 'react';
import { Search, Globe, Sparkles, ExternalLink, RefreshCw, Trophy, AlertCircle, Layers } from 'lucide-react';
import { SerpExplorerResponse, SerpOrganicResult } from '../types';

interface SerpExplorerViewProps {
  onExploreSerp: (keyword: string, country: string, limit: number) => Promise<SerpExplorerResponse>;
}

export const SerpExplorerView: React.FC<SerpExplorerViewProps> = ({ onExploreSerp }) => {
  const [keyword, setKeyword] = useState('jasa seo terbaik jakarta');
  const [country, setCountry] = useState('id');
  const [limit, setLimit] = useState<number>(10);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SerpExplorerResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await onExploreSerp(keyword, country, limit);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Gagal mengeksplorasi SERP Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner & Form */}
      <div className="glass-panel p-6 space-y-5 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950">
        <div>
          <h2 className="text-2xl font-bold brand-font text-white flex items-center gap-2">
            Live SERP Explorer (Analisis Top 10 & 100 Google)
            <Sparkles className="text-cyan-400" size={20} />
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Fitur tersendiri untuk mengecek dan menampilkan seluruh website teratas yang menduduki peringkat di Google tanpa harus membuat project terlebih dahulu.
          </p>
        </div>

        {/* Explorer Search Form */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          
          {/* Keyword Input (6 cols) */}
          <div className="md:col-span-6 relative">
            <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Masukkan kata kunci yang ingin diperiksa..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="input-field pl-10 h-11 text-sm font-medium"
            />
          </div>

          {/* Country Select (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="input-field h-11 text-xs"
            >
              <option value="id">Indonesia (google.co.id)</option>
              <option value="us">United States (google.com)</option>
              <option value="sg">Singapore (google.com.sg)</option>
              <option value="my">Malaysia (google.com.my)</option>
            </select>
          </div>

          {/* Depth Limit Select (3 cols) */}
          <div className="md:col-span-3 flex gap-2">
            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="input-field h-11 text-xs"
            >
              <option value={10}>Top 10 Website (Halaman 1)</option>
              <option value={30}>Top 30 Website (Halaman 1-3)</option>
              <option value={100}>Top 100 Website (Halaman 1-10)</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary h-11 px-5 whitespace-nowrap"
            >
              {loading ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              <span>Cek SERP</span>
            </button>
          </div>

        </form>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* SERP Search Results Output */}
      {results && (
        <div className="space-y-4">
          
          {/* Metadata Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-400 px-2">
            <div>
              Kata kunci: <span className="font-bold text-white">"{results.keyword}"</span>
              {results.total_results && <span className="ml-2 text-slate-500">({results.total_results})</span>}
            </div>
            <div className="text-slate-500 text-[11px] mt-1 sm:mt-0 font-mono">
              API Key: {results.api_key_used} | {new Date(results.checked_at).toLocaleTimeString('id-ID')}
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-3">
            {results.results.map((item) => {
              const isTop3 = item.position <= 3;
              const isTop10 = item.position <= 10;

              return (
                <div
                  key={item.position}
                  className={`glass-panel p-5 glass-panel-hover flex items-start gap-4 ${
                    isTop3 ? 'border-indigo-500/40 bg-indigo-950/20' : ''
                  }`}
                >
                  
                  {/* Rank Badge */}
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-base shadow-lg ${
                      item.position === 1 ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-amber-500/20' :
                      item.position === 2 ? 'bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-950 shadow-slate-400/20' :
                      item.position === 3 ? 'bg-gradient-to-tr from-amber-700 to-amber-500 text-white shadow-amber-700/20' :
                      isTop10 ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      #{item.position}
                    </div>
                    {isTop3 && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-400 mt-1 flex items-center gap-0.5">
                        <Trophy size={10} /> Top {item.position}
                      </span>
                    )}
                  </div>

                  {/* Organic Item Content */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    
                    {/* Domain & Display Link */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono truncate">
                        {item.displayed_link || item.link}
                      </span>
                    </div>

                    {/* Title Link */}
                    <h3 className="text-base font-bold text-indigo-300 hover:text-indigo-200 hover:underline">
                      <a href={item.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                        <span>{item.title}</span>
                        <ExternalLink size={14} className="text-indigo-400 shrink-0" />
                      </a>
                    </h3>

                    {/* Snippet Description */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.snippet}
                    </p>

                    {/* Sitelinks (if available) */}
                    {item.sitelinks && item.sitelinks.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {item.sitelinks.map((sl, idx) => (
                          <a
                            key={idx}
                            href={sl.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] bg-slate-800/80 hover:bg-slate-800 text-indigo-300 border border-slate-700 px-2.5 py-1 rounded-md transition-colors"
                          >
                            {sl.title}
                          </a>
                        ))}
                      </div>
                    )}

                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {!results && !loading && (
        <div className="glass-panel p-12 text-center text-slate-500 space-y-2">
          <Search size={32} className="mx-auto text-slate-600 mb-2" />
          <h4 className="text-base font-bold text-slate-300">Siap Mengeksplorasi SERP</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Ketik kata kunci di atas dan tekan tombol "Cek SERP" untuk melihat semua website teratas di Google secara live.
          </p>
        </div>
      )}

    </div>
  );
};
