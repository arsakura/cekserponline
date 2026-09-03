import React, { useState, useMemo } from 'react';
import { 
  BarChart3, PieChart as PieChartIcon, TrendingUp, Sparkles, Filter, Activity, Target, Award, Search
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { SerpHistoryItem, ProjectItem, KeywordItem } from '../types';

interface AnalyticsViewProps {
  history: SerpHistoryItem[];
  projects: ProjectItem[];
  keywords: KeywordItem[];
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  history,
  projects,
  keywords
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedKeywordId, setSelectedKeywordId] = useState<string>('NONE');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filter Data
  const availableKeywords = useMemo(() => {
    if (selectedProjectId === 'ALL') return keywords;
    return keywords.filter(k => k.project_id === selectedProjectId);
  }, [keywords, selectedProjectId]);
  const filteredHistory = useMemo(() => {
    let result = history;
    if (selectedProjectId !== 'ALL') {
      result = result.filter(h => h.project_id === selectedProjectId);
    }
    if (startDate) {
      result = result.filter(h => h.checked_at.substring(0, 10) >= startDate);
    }
    if (endDate) {
      result = result.filter(h => h.checked_at.substring(0, 10) <= endDate);
    }
    return result;
  }, [history, selectedProjectId, startDate, endDate]);

  // Analytics Calculations
  const analyticsData = useMemo(() => {
    // 1. Get Latest Position per Keyword for Distribution
    const latestMap = new Map<string, { latest: SerpHistoryItem; previous?: SerpHistoryItem }>();
    
    // History is assumed to be sorted DESC by checked_at
    filteredHistory.forEach(item => {
      if (!latestMap.has(item.keyword_id)) {
        latestMap.set(item.keyword_id, { latest: item });
      } else {
        const entry = latestMap.get(item.keyword_id)!;
        if (!entry.previous) {
          entry.previous = item;
        }
      }
    });

    const activeKeywords = Array.from(latestMap.values());
    
    // KPI Data
    let totalKeywords = activeKeywords.length;
    let upCount = 0;
    let downCount = 0;
    let sumPositions = 0;
    let validPosCount = 0;

    // Distribution Buckets
    let top3 = 0;
    let top10 = 0;
    let top50 = 0;
    let notFound = 0;

    activeKeywords.forEach(({ latest, previous }) => {
      // Calculate changes
      if (latest.position !== null && previous?.position !== null && previous !== undefined) {
        if (latest.position < previous.position) upCount++;
        else if (latest.position > previous.position) downCount++;
      }

      // Calculate distribution and average
      if (latest.position !== null) {
        sumPositions += latest.position;
        validPosCount++;
        
        if (latest.position <= 3) top3++;
        else if (latest.position <= 10) top10++;
        else if (latest.position <= 50) top50++;
        else notFound++;
      } else {
        notFound++;
      }
    });

    const avgPosition = validPosCount > 0 ? (sumPositions / validPosCount).toFixed(1) : '-';

    const distributionData = [
      { name: 'Top 3', value: top3 },
      { name: 'Top 4 - 10', value: top10 },
      { name: 'Top 11 - 50', value: top50 },
      { name: '> 50 / Not Found', value: notFound }
    ].filter(item => item.value > 0);

    // 2. Trend Data (Average position per day)
    const dailyMap = new Map<string, { sum: number; count: number }>();
    
    // Sort ascending for chronological trend
    const chronHistory = [...filteredHistory].sort((a, b) => 
      new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime()
    );

    chronHistory.forEach(item => {
      if (item.position !== null) {
        // Extract YYYY-MM-DD local
        const dateObj = new Date(item.checked_at);
        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        
        const existing = dailyMap.get(dateStr) || { sum: 0, count: 0 };
        existing.sum += item.position;
        existing.count += 1;
        dailyMap.set(dateStr, existing);
      }
    });

    const trendData = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      avgPos: parseFloat((stats.sum / stats.count).toFixed(1))
    })).slice(-14); // Limit to last 14 days of data for cleanliness

    return {
      kpi: { totalKeywords, avgPosition, upCount, downCount },
      distribution: distributionData,
      trend: trendData
    };
  }, [filteredHistory]);

  const { kpi, distribution, trend } = analyticsData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="text-slate-300 font-semibold mb-1">{label}</p>
          <p className="text-cyan-400">
            Rata-rata Posisi: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="text-slate-300 font-semibold mb-1">{payload[0].name}</p>
          <p className="text-indigo-400">
            Jumlah Keyword: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const keywordTrendData = useMemo(() => {
    if (selectedKeywordId === 'NONE') return [];
    
    const kwHistory = history.filter(h => h.keyword_id === selectedKeywordId);
    
    const chron = [...kwHistory].sort((a, b) => 
      new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime()
    );

    return chron.map(item => {
      const dateObj = new Date(item.checked_at);
      const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
      return {
        date: dateStr,
        fullDate: dateObj.toLocaleString(),
        position: item.position || 100 // Not found mapped to 100
      };
    });
  }, [history, selectedKeywordId]);

  const CustomKwTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="text-slate-300 font-semibold mb-1">{payload[0].payload.fullDate}</p>
          <p className="text-indigo-400">
            Posisi SERP: <span className="font-bold">{payload[0].value === 100 ? '> 100 / Not Found' : payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold brand-font text-white flex items-center gap-2">
            Dasbor Analitik & Laporan
            <BarChart3 className="text-indigo-400" size={24} />
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Visualisasi performa peringkat kata kunci dan pertumbuhan visibilitas website Anda.
          </p>
        </div>

        {/* Project & Date Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
          {/* Start Date */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-field text-xs w-full sm:w-auto"
              title="Tanggal Awal"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-field text-xs w-full sm:w-auto"
              title="Tanggal Akhir"
            />
          </div>
          
          <div className="relative min-w-[200px]">
            <Filter size={16} className="absolute left-3 top-3 text-slate-400" />
            <select
              value={selectedProjectId}
              onChange={e => {
                setSelectedProjectId(e.target.value);
                setSelectedKeywordId('NONE');
              }}
              className="input-field pl-9 text-xs w-full"
            >
              <option value="ALL">Semua Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
            <Target size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Keyword Dilacak</p>
            <p className="text-2xl font-bold text-white mt-1">{kpi.totalKeywords}</p>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Rata-rata Peringkat</p>
            <p className="text-2xl font-bold text-white mt-1">{kpi.avgPosition}</p>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Keyword Naik</p>
            <p className="text-2xl font-bold text-white mt-1">+{kpi.upCount}</p>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Keyword Turun</p>
            <p className="text-2xl font-bold text-white mt-1">-{kpi.downCount}</p>
          </div>
        </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Line Chart: Trend */}
        <div className="lg:col-span-8 glass-panel p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              Tren Rata-rata Posisi (14 Hari Terakhir)
            </h3>
            <p className="text-xs text-slate-400">Menunjukkan pergerakan posisi rata-rata dari seluruh keyword yang valid. Semakin rendah angkanya, semakin baik performanya.</p>
          </div>
          
          <div className="h-[300px] w-full">
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    reversed={true} // Reverse so rank 1 is at the top
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="avgPos" 
                    stroke="#38bdf8" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }} 
                    activeDot={{ r: 6, strokeWidth: 0 }} 
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <Activity size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Belum ada data tren yang cukup.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart: Distribution */}
        <div className="lg:col-span-4 glass-panel p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PieChartIcon size={18} className="text-indigo-400" />
              Distribusi Peringkat
            </h3>
            <p className="text-xs text-slate-400">Sebaran posisi keyword terbaru berdasarkan pengecekan terakhir.</p>
          </div>
          
          <div className="h-[250px] w-full">
            {distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <PieChartIcon size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Belum ada data distribusi.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Keyword Deep Dive */}
      <div className="glass-panel p-6 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Search size={18} className="text-cyan-400" />
              Analitik Posisi Per Kata Kunci
            </h3>
            <p className="text-xs text-slate-400">Pilih kata kunci spesifik untuk melihat grafik historis pergerakan posisi SERP-nya.</p>
          </div>
          <div className="relative min-w-[250px]">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <select
              value={selectedKeywordId}
              onChange={e => setSelectedKeywordId(e.target.value)}
              className="input-field pl-9 text-xs w-full"
            >
              <option value="NONE">-- Pilih Kata Kunci --</option>
              {availableKeywords.map(k => (
                <option key={k.id} value={k.id}>{k.keyword}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedKeywordId !== 'NONE' ? (
          <div className="h-[300px] w-full">
            {keywordTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={keywordTrendData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    reversed={true}
                    domain={[1, 100]}
                  />
                  <RechartsTooltip content={<CustomKwTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="position" 
                    stroke="#8b5cf6" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#6d28d9', strokeWidth: 0 }} 
                    activeDot={{ r: 6, strokeWidth: 0 }} 
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <Activity size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Belum ada data historis untuk kata kunci ini.</p>
              </div>
            )}
          </div>
        ) : (
           <div className="w-full h-[150px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700/50 rounded-xl">
             <Search size={24} className="mb-2 opacity-50" />
             <p className="text-sm">Silakan pilih kata kunci pada dropdown di atas.</p>
           </div>
        )}
      </div>

    </div>
  );
};
