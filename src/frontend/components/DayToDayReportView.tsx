import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, Search, Filter, Calendar, Sparkles, ExternalLink, Award, Trophy, BookOpen, Edit2, Plus, Trash2
} from 'lucide-react';
import { SerpHistoryItem, ProjectItem, KeywordItem, LogbookItem } from '../types';

interface DayToDayReportViewProps {
  history: SerpHistoryItem[];
  projects: ProjectItem[];
  keywords: KeywordItem[];
  logbooks: LogbookItem[];
  loading: boolean;
  onAddLogbook: (projectId: string, keywordId: string | null, actionType: string, description: string) => Promise<void>;
  onEditLogbook: (id: string, actionType: string, description: string) => Promise<void>;
  onDeleteLogbook: (id: string) => Promise<void>;
}

export const DayToDayReportView: React.FC<DayToDayReportViewProps> = ({
  history,
  projects,
  keywords,
  logbooks,
  loading,
  onAddLogbook,
  onEditLogbook,
  onDeleteLogbook
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMovement, setFilterMovement] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [modalFormData, setModalFormData] = useState({
    projectId: '',
    keywordId: '',
    actionType: 'create_post',
    description: ''
  });

  // Group history per keyword to extract latest check, previous check, and best position ever recorded
  const keywordLatestMap = new Map<string, { latest: SerpHistoryItem; previous?: SerpHistoryItem; historyList: SerpHistoryItem[] }>();

  const dateFilteredHistory = history.filter(item => {
    const itemDate = item.checked_at.substring(0, 10);
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  });

  dateFilteredHistory.forEach((item) => {
    if (!keywordLatestMap.has(item.keyword_id)) {
      keywordLatestMap.set(item.keyword_id, { latest: item, historyList: [item] });
    } else {
      const entry = keywordLatestMap.get(item.keyword_id)!;
      entry.historyList.push(item);
      if (!entry.previous) {
        entry.previous = item;
      }
    }
  });

  const reportItems = Array.from(keywordLatestMap.values()).map(({ latest, previous, historyList }) => {
    const latestPos = latest.position;
    const prevPos = previous ? previous.position : null;

    // Calculate Best Rank Ever Recorded for this keyword
    const validPositions = historyList.map(h => h.position).filter((p): p is number => p !== null && p !== undefined);
    const bestPos = validPositions.length > 0 ? Math.min(...validPositions) : (latestPos || null);

    let delta: number | null = null;
    let status: 'UP' | 'DOWN' | 'SAME' | 'NEW' = 'NEW';

    if (latestPos !== null && prevPos !== null) {
      delta = prevPos - latestPos; // positive means rank got better (e.g. 5 to 2 = +3)
      if (delta > 0) status = 'UP';
      else if (delta < 0) status = 'DOWN';
      else status = 'SAME';
    }

    // Find the latest logbooks for this project on or before the checked_at date
    const relevantLogbooks = logbooks
      .filter(l => l.project_id === latest.project_id && (l.keyword_id === latest.keyword_id || !l.keyword_id) && l.created_at.substring(0, 10) <= latest.checked_at.substring(0, 10))
      .sort((a, b) => {
        // prioritize specific keyword logbooks over project-wide ones
        if (a.keyword_id && !b.keyword_id) return -1;
        if (!a.keyword_id && b.keyword_id) return 1;
        // then sort by date descending
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 1); // Get the most recent one

    return {
      id: latest.id,
      keyword_id: latest.keyword_id,
      keyword: latest.keyword || 'Keyword',
      project_name: latest.project_name || 'Project',
      target_url: latest.target_url || '',
      project_id: latest.project_id,
      latestPos,
      prevPos,
      bestPos,
      delta,
      status,
      pageNumber: latest.page_number,
      foundUrl: latest.found_url,
      apiKeyUsed: latest.api_key_used,
      checkedAt: latest.checked_at,
      logbooks: relevantLogbooks
    };
  });

  // Filter logic
  const filteredItems = reportItems.filter((item) => {
    if (selectedProjectId !== 'ALL' && item.project_id !== selectedProjectId) return false;
    if (searchQuery && !item.keyword.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterMovement === 'UP' && item.status !== 'UP') return false;
    if (filterMovement === 'DOWN' && item.status !== 'DOWN') return false;
    if (filterMovement === 'TOP10' && (item.latestPos === null || item.latestPos > 10)) return false;
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Modal Handlers
  const handleOpenModal = (projectId: string, keywordId: string, existingLog?: LogbookItem) => {
    if (existingLog) {
      setEditingLogId(existingLog.id);
      setModalFormData({
        projectId,
        keywordId,
        actionType: existingLog.action_type,
        description: existingLog.description || ''
      });
    } else {
      setEditingLogId(null);
      setModalFormData({
        projectId,
        keywordId,
        actionType: 'create_post',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalFormData.projectId || !modalFormData.actionType) {
      alert('Project dan jenis aksi harus diisi');
      return;
    }
    try {
      if (editingLogId) {
        await onEditLogbook(editingLogId, modalFormData.actionType, modalFormData.description);
      } else {
        await onAddLogbook(modalFormData.projectId, modalFormData.keywordId, modalFormData.actionType, modalFormData.description);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteLogClick = async (id: string) => {
    if (confirm('Yakin ingin menghapus catatan ini?')) {
      try {
        await onDeleteLogbook(id);
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="glass-panel p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold brand-font text-white flex items-center gap-2">
            Laporan Analitis Day-to-Day SERP
            <Sparkles className="text-cyan-400" size={20} />
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Memantau perubahan delta peringkat dari waktu ke waktu dan rekor posisi tertinggi yang pernah dicapai.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kata kunci..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-9 text-xs w-full"
            />
          </div>

          {/* Project Filter */}
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="input-field text-xs w-full"
            >
              <option value="ALL">Semua Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Movement Status Filter */}
          <div className="relative">
            <select
              value={filterMovement}
              onChange={e => setFilterMovement(e.target.value)}
              className="input-field text-xs w-full"
            >
              <option value="ALL">Semua Pergerakan</option>
              <option value="UP">Peringkat Naik (🟢 Rank Up)</option>
              <option value="DOWN">Peringkat Turun (🔴 Rank Down)</option>
              <option value="TOP10">Top 10 Google Search</option>
            </select>
          </div>

          {/* Start Date Filter */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-field text-xs w-full"
              title="Tanggal Awal"
            />
          </div>

          {/* End Date Filter */}
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-field text-xs w-full"
              title="Tanggal Akhir"
            />
          </div>

        </div>
      </div>

      {/* Main Day to Day Table */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Menampilkan {filteredItems.length} Data Kata Kunci
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Kata Kunci</th>
                <th className="py-3 px-4">Project & Target URL</th>
                <th className="py-3 px-4 text-center">Posisi Terbaru</th>
                <th className="py-3 px-4 text-center">Catatan (Logbook)</th>
                <th className="py-3 px-4 text-center">Posisi Sebelumnya</th>
                <th className="py-3 px-4 text-center">Posisi Tertinggi 🏆</th>
                <th className="py-3 px-4 text-center">Delta (Δ) Pergerakan</th>
                <th className="py-3 px-4 text-center">Halaman Google</th>
                <th className="py-3 px-4 text-right">Terakhir Diperbarui</th>
                <th className="py-3 px-4 text-right">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                    
                    {/* Keyword */}
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      <div>{item.keyword}</div>
                      {item.foundUrl && (
                        <a
                          href={item.foundUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span>{item.foundUrl.replace(/^https?:\/\//, '').substring(0, 32)}...</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </td>

                    {/* Project */}
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      <span className="font-medium text-slate-300 block">{item.project_name}</span>
                      <span className="text-slate-500">{item.target_url}</span>
                    </td>

                    {/* Posisi Terbaru */}
                    <td className="py-3.5 px-4 text-center">
                      {item.latestPos !== null ? (
                        <span className={`badge ${
                          item.latestPos <= 3 ? 'badge-emerald' : item.latestPos <= 10 ? 'badge-indigo' : 'badge-gray'
                        }`}>
                          #{item.latestPos}
                        </span>
                      ) : (
                        <span className="badge badge-rose">Not in Top 100</span>
                      )}
                    </td>

                    {/* Catatan Logbook */}
                    <td className="py-3.5 px-4 text-center">
                      {item.logbooks && item.logbooks.length > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">
                            {item.logbooks[0].action_type.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] text-slate-300 max-w-[120px] truncate" title={item.logbooks[0].description || undefined}>
                            {item.logbooks[0].description || '-'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>

                    {/* Posisi Sebelumnya */}
                    <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                      {item.prevPos !== null ? `#${item.prevPos}` : '-'}
                    </td>

                    {/* Posisi Tertinggi (Best Rank Ever Recorded) */}
                    <td className="py-3.5 px-4 text-center">
                      {item.bestPos !== null ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          item.bestPos <= 3
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                            : item.bestPos <= 10
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          <Trophy size={12} className={item.bestPos <= 3 ? 'text-amber-400' : 'text-emerald-400'} />
                          #{item.bestPos}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>

                    {/* Delta Movement Indicator */}
                    <td className="py-3.5 px-4 text-center">
                      {item.status === 'UP' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <TrendingUp size={12} />
                          +{item.delta} Posisi
                        </span>
                      )}
                      {item.status === 'DOWN' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <TrendingDown size={12} />
                          {item.delta} Posisi
                        </span>
                      )}
                      {item.status === 'SAME' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <Minus size={12} />
                          Tetap (0)
                        </span>
                      )}
                      {item.status === 'NEW' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                          Data Perdana
                        </span>
                      )}
                    </td>

                    {/* Page Number */}
                    <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                      {item.pageNumber ? `Halaman ${item.pageNumber}` : '-'}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                      {new Date(item.checkedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Opsi / CRUD Logbook */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.logbooks && item.logbooks.length > 0 ? (
                          <>
                            <button
                              onClick={() => handleOpenModal(item.project_id, item.keyword_id, item.logbooks[0])}
                              className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition-colors"
                              title="Edit Catatan Logbook"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteLogClick(item.logbooks[0].id)}
                              className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                              title="Hapus Catatan Logbook"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenModal(item.project_id, item.keyword_id)}
                            className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-colors"
                            title="Tambah Catatan Logbook"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500 text-sm">
                    Tidak ada data laporan day-to-day yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/60">
            <span className="text-xs text-slate-500">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} hingga {Math.min(currentPage * itemsPerPage, filteredItems.length)} dari {filteredItems.length} Entri
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded text-xs font-medium bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                Sebelumnya
              </button>
              <span className="text-xs font-semibold text-slate-400">
                Hal {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded text-xs font-medium bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CRUD Logbook Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editingLogId ? 'Edit Catatan Logbook' : 'Tambah Catatan Logbook'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Project</label>
                <select
                  value={modalFormData.projectId}
                  onChange={e => setModalFormData({...modalFormData, projectId: e.target.value})}
                  className="input-field w-full"
                  disabled={true} // Usually we keep it fixed to the project of the row clicked
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Jenis Aksi</label>
                <select
                  value={modalFormData.actionType}
                  onChange={e => setModalFormData({...modalFormData, actionType: e.target.value})}
                  className="input-field w-full"
                  required
                >
                  <option value="create_post">Create Post (Baru)</option>
                  <option value="edit">Edit Post (Pembaruan)</option>
                  <option value="note">Catatan / Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Deskripsi / URL Post / Catatan</label>
                <textarea
                  value={modalFormData.description}
                  onChange={e => setModalFormData({...modalFormData, description: e.target.value})}
                  className="input-field w-full min-h-[100px] resize-y"
                  placeholder="Opsional. Tulis URL atau catatan singkat yang dilakukan..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
