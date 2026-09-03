import React from 'react';
import { 
  FolderKanban, KeyRound, Trophy, TrendingUp, TrendingDown, Minus, ArrowUpRight, Search, Activity, Sparkles 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { DashboardData, ActiveTab, FeaturedKeywordStat } from '../types';

interface DashboardViewProps {
  data: DashboardData | null;
  featuredStats?: FeaturedKeywordStat[];
  loading: boolean;
  setActiveTab: (tab: ActiveTab) => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data, featuredStats = [], loading, setActiveTab, onRefresh }) => {
  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <Activity className="animate-spin text-indigo-500" size={36} />
        <p className="text-sm font-medium">Memuat data analitik dashboard...</p>
      </div>
    );
  }

  const { totalProjects, totalKeywords, avgPosition, trackedCount, distribution, movement, recentChecks } = data;

  const pieData = [
    { name: 'Top 1-3', value: distribution.top3, color: '#10b981' },
    { name: 'Top 4-10', value: Math.max(0, distribution.top10 - distribution.top3), color: '#06b6d4' },
    { name: 'Top 11-30', value: Math.max(0, distribution.top30 - distribution.top10), color: '#6366f1' },
    { name: 'Top 31-100', value: Math.max(0, distribution.top100 - distribution.top30), color: '#f59e0b' },
    { name: '> 100 / Non-Top', value: distribution.notInTop100, color: '#64748b' }
  ].filter(d => d.value > 0);

  const barData = [
    { range: 'Top 1-3', jumlah: distribution.top3 },
    { range: 'Top 4-10', jumlah: Math.max(0, distribution.top10 - distribution.top3) },
    { range: 'Top 11-30', jumlah: Math.max(0, distribution.top30 - distribution.top10) },
    { range: 'Top 31-100', jumlah: Math.max(0, distribution.top100 - distribution.top30) },
    { range: 'Not in Top 100', jumlah: distribution.notInTop100 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold brand-font text-white flex items-center gap-2">
            Analisis SERP & Ringkasan Peringkat
            <Sparkles className="text-indigo-400" size={22} />
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Melacak {totalKeywords} kata kunci dari {totalProjects} project dengan rotasi 4 API Key SerpApi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('explorer')}
            className="btn-secondary text-sm"
          >
            <Search size={16} />
            <span>Live SERP Explorer</span>
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className="btn-primary text-sm"
          >
            <FolderKanban size={16} />
            <span>Manajemen Project</span>
          </button>
        </div>
      </div>

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Projects & Keywords */}
        <div className="glass-panel p-5 glass-panel-hover flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Projects & Keywords</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold text-white">{totalProjects}</span>
              <span className="text-xs text-slate-400">Projects</span>
              <span className="text-slate-600">|</span>
              <span className="text-2xl font-extrabold text-indigo-400">{totalKeywords}</span>
              <span className="text-xs text-slate-400">Keywords</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{trackedCount} terverifikasi di SERP</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FolderKanban size={24} />
          </div>
        </div>

        {/* Card 2: Average Position */}
        <div className="glass-panel p-5 glass-panel-hover flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Rata-rata Peringkat</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-white">
                {avgPosition !== null ? `#${avgPosition}` : 'N/A'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <Trophy size={12} />
              Dihitung dari keyword teracak
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Trophy size={24} />
          </div>
        </div>

        {/* Card 3: Top 10 Visibility */}
        <div className="glass-panel p-5 glass-panel-hover flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Top 10 Google Search</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-emerald-400">{distribution.top10}</span>
              <span className="text-xs text-slate-400">
                ({totalKeywords > 0 ? Math.round((distribution.top10 / totalKeywords) * 100) : 0}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Halaman 1 Google: {distribution.top3} di Top 3</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Card 4: Rank Movement */}
        <div className="glass-panel p-5 glass-panel-hover flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pergerakan Rank Harian</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-emerald-400 font-bold">
                <TrendingUp size={16} />
                <span>+{movement.up}</span>
              </div>
              <div className="flex items-center gap-1 text-rose-400 font-bold">
                <TrendingDown size={16} />
                <span>-{movement.down}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400 font-medium text-xs">
                <Minus size={14} />
                <span>{movement.unchanged}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Hari ini vs Kemarin</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Activity size={24} />
          </div>
        </div>

      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Bar Chart breakdown */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Distribusi Posisi Keyword
            </h3>
            <span className="text-xs text-slate-400">Tingkat Halaman Google</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="range" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="jumlah" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Donut Chart breakdown */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">
              Persentase Peringkat
            </h3>
            <span className="text-xs text-indigo-400 font-semibold">{trackedCount} Tracked</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend 
                    formatter={(value) => <span className="text-xs text-slate-300 ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-sm">
                Belum ada data SERP yang tersimpan. Jalankan SERP check di menu Projects.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Featured Keywords Dominance Bar Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 relative z-30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="text-amber-400" size={18} />
              Statistik Dominasi Kata Kunci Unggulan (Top 10)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Daftar kata kunci strategis yang dipantau Super Admin untuk mengukur berapa banyak website project yang menembus Top 10 Google.
            </p>
          </div>
          <span className="text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-full font-semibold shrink-0">
            Realtime DB Stats
          </span>
        </div>

        {featuredStats && featuredStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {featuredStats.map((item, index) => {
              const isBottomRow = index >= 2 || (featuredStats.length > 1 && index === featuredStats.length - 1);

              return (
                <div 
                  key={item.id} 
                  className="group relative z-10 hover:z-50 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-sm text-slate-200 group-hover:text-indigo-300 transition-colors flex items-center gap-1.5 truncate">
                      <Search size={14} className="text-amber-400 shrink-0" />
                      "{item.keyword}"
                    </span>
                    <span className="text-xs font-extrabold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      {item.top10Count} / {item.totalResults || 10} Website ({item.percentage}%)
                    </span>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800/80 relative shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                    <span>
                      {item.last_checked_at ? `Dicek: ${new Date(item.last_checked_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}` : 'Belum pernah dicek'}
                    </span>
                    <span className="text-indigo-400 font-semibold group-hover:underline cursor-pointer flex items-center gap-1">
                      Arahkan kursor / hover untuk 10 besar ℹ️
                    </span>
                  </div>

                  {/* Hover Popover Tooltip: Full Top 10 Google Results with Project Highlighting */}
                  <div className={`opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 absolute left-0 right-0 ${isBottomRow ? 'bottom-full mb-2' : 'top-full mt-2'} z-50 bg-slate-900/98 border border-indigo-500/60 rounded-xl p-4 shadow-2xl shadow-black backdrop-blur-2xl`}>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                      <div>
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Trophy size={15} className="text-amber-400" />
                          Daftar 10 Besar Google SERP
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">Kata Kunci: "{item.keyword}"</span>
                      </div>
                      <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">
                        {item.top10Count} Website Terdaftar
                      </span>
                    </div>

                    {item.top10Results && item.top10Results.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {item.top10Results.map((res, idx) => {
                          const isOurProject = res.is_our_project;
                          return (
                            <div 
                              key={idx} 
                              className={`p-2.5 rounded-lg border text-xs transition-all ${
                                isOurProject 
                                  ? 'bg-gradient-to-r from-emerald-950/70 to-slate-900 border-emerald-500/70 shadow-md shadow-emerald-950/50' 
                                  : 'bg-slate-950/60 border-slate-800/80'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <span className={`w-6 h-6 rounded-md font-black flex items-center justify-center text-[11px] shrink-0 border ${
                                    isOurProject 
                                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm' 
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}>
                                    #{res.position}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <a 
                                        href={res.link} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className={`font-semibold hover:underline truncate ${isOurProject ? 'text-emerald-300' : 'text-slate-200'}`}
                                      >
                                        {res.title || res.link}
                                      </a>
                                      {isOurProject && (
                                        <span className="badge badge-emerald text-[10px] py-0 px-2 flex items-center gap-1 font-bold animate-pulse">
                                          🎯 PROJECT DATABASE: {res.project_name}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 block truncate font-mono mt-0.5">
                                      {res.displayed_link || res.link}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-slate-400 text-xs italic">
                        Belum ada data SERP 10 besar. Super Admin dapat melakukan pengecekan live di tab Manajemen User.
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/50">
            Belum ada kata kunci unggulan yang diset oleh Super Admin. Kata kunci yang dikonfigurasi akan muncul di sini secara real-time.
          </div>
        )}
      </div>

      {/* Recent SERP Checks Activity Table */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Aktivitas Pengecekan SERP Terbaru</h3>
            <p className="text-xs text-slate-400">Riwayat pengecekan real-time dengan rotasi API Key</p>
          </div>
          <button 
            onClick={() => setActiveTab('daytoday')} 
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>Lihat Semua Laporan</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Kata Kunci</th>
                <th className="py-3 px-4">Project / Domain Target</th>
                <th className="py-3 px-4 text-center">Posisi SERP</th>
                <th className="py-3 px-4 text-center">Halaman Google</th>
                <th className="py-3 px-4">API Key Digunakan</th>
                <th className="py-3 px-4 text-right">Waktu Cek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {recentChecks.length > 0 ? (
                recentChecks.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {item.keyword}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      <span className="block font-medium text-slate-300">{item.project_name}</span>
                      <span className="text-slate-500">{item.target_url}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.position !== null ? (
                        <span className={`badge ${
                          item.position <= 3 ? 'badge-emerald' : item.position <= 10 ? 'badge-indigo' : 'badge-gray'
                        }`}>
                          #{item.position}
                        </span>
                      ) : (
                        <span className="badge badge-rose">Not in Top 100</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-medium text-slate-400">
                      {item.page_number ? `Halaman ${item.page_number}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                      {item.api_key_used || 'Key Rotator'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                      {new Date(item.checked_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                    Belum ada riwayat pengecekan SERP. Silakan tambah project dan jalankan SERP Check.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
