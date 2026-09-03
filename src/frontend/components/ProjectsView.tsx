import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Globe, Play, ExternalLink, Tag, RefreshCw, Layers, User, X, Filter,
  ChevronLeft, ChevronRight, ArrowUpDown, Search
} from 'lucide-react';
import { ProjectItem, KeywordItem, CategoryItem, UserItem } from '../types';

interface ProjectsViewProps {
  projects: ProjectItem[];
  keywords: Record<string, KeywordItem[]>;
  categories: CategoryItem[];
  users: UserItem[];
  currentUser: UserItem;
  loading: boolean;
  onAddProject: (name: string, target_url: string, category_id: string | null, country_code: string, keywords: string[]) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onAddKeywords: (projectId: string, keywords: string[]) => Promise<void>;
  onDeleteKeyword: (id: string, projectId: string) => Promise<void>;
  onCheckSerpSingle: (keywordId: string, projectId: string) => Promise<void>;
  onCheckProjectSerp: (projectId: string) => Promise<void>;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  keywords,
  categories,
  users,
  currentUser,
  loading,
  onAddProject,
  onDeleteProject,
  onAddKeywords,
  onDeleteKeyword,
  onCheckSerpSingle,
  onCheckProjectSerp
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddKeywordsModal, setShowAddKeywordsModal] = useState(false);

  // Search & Pagination state
  const [keywordSearchQuery, setKeywordSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Filters
  const [filterCategoryId, setFilterCategoryId] = useState<string>('ALL');
  const [filterUserId, setFilterUserId] = useState<string>('ALL');

  // Form States
  const [newProjectName, setNewProjectName] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<string>(categories[0]?.id || '');
  const [newCountry, setNewCountry] = useState('id');
  const [initialKeywords, setInitialKeywords] = useState('');

  const [bulkKeywordsText, setBulkKeywordsText] = useState('');
  const [checkingKeywordId, setCheckingKeywordId] = useState<string | null>(null);
  const [checkingProject, setCheckingProject] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';

  // Apply filters
  const filteredProjects = projects.filter(p => {
    if (filterCategoryId !== 'ALL' && p.category_id !== filterCategoryId) return false;
    if (isAdmin && filterUserId !== 'ALL' && p.user_id !== filterUserId) return false;
    return true;
  });

  const activeProject = filteredProjects.find(p => p.id === selectedProjectId) || filteredProjects[0] || null;
  const rawKeywords = activeProject ? (keywords[activeProject.id] || []) : [];

  // Reset pagination to page 1 whenever active project, filter, or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProjectId, filterCategoryId, filterUserId, keywordSearchQuery]);

  // Filter keywords by search query
  const searchedKeywords = rawKeywords.filter(k =>
    k.keyword.toLowerCase().includes(keywordSearchQuery.toLowerCase().trim())
  );

  // Sort filtered keywords alphabetically (A-Z)
  const sortedKeywords = [...searchedKeywords].sort((a, b) =>
    a.keyword.toLowerCase().localeCompare(b.keyword.toLowerCase())
  );

  // Calculate paginated keywords
  const totalPages = Math.ceil(sortedKeywords.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const displayedKeywords = sortedKeywords.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName || !newTargetUrl) return;

    const kwList = initialKeywords.split(/\n|,/).map(k => k.trim()).filter(Boolean);
    await onAddProject(newProjectName, newTargetUrl, newCategoryId || null, newCountry, kwList);

    setNewProjectName('');
    setNewTargetUrl('');
    setInitialKeywords('');
    setShowAddProjectModal(false);
  };

  const handleBulkAddKeywords = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !bulkKeywordsText) return;

    const kwList = bulkKeywordsText.split(/\n|,/).map(k => k.trim()).filter(Boolean);
    await onAddKeywords(activeProject.id, kwList);

    setBulkKeywordsText('');
    setShowAddKeywordsModal(false);
  };

  const handleRunSingleCheck = async (kwId: string) => {
    if (!activeProject) return;
    setCheckingKeywordId(kwId);
    setStatusMsg('Engine SERP sedang memeriksa hingga 10 halaman Google...');
    try {
      await onCheckSerpSingle(kwId, activeProject.id);
      setStatusMsg('Pengecekan SERP selesai!');
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setCheckingKeywordId(null);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleRunAllCheck = async () => {
    if (!activeProject) return;
    setCheckingProject(true);
    setStatusMsg('Memulai pengecekan SERP untuk semua kata kunci di project ini...');
    try {
      await onCheckProjectSerp(activeProject.id);
      setStatusMsg('Semua kata kunci berhasil diuji di SERP!');
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setCheckingProject(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold brand-font text-white">Manajemen Project & Kategori Induk</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Kelola URL target website dan kata kunci berdasarkan Kategori Induk.
          </p>
        </div>
        <button
          onClick={() => setShowAddProjectModal(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          <span>Tambah Project Baru</span>
        </button>
      </div>

      {statusMsg && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3.5 text-xs text-indigo-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="animate-spin text-indigo-400" />
            <span>{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Grid: Left Projects List, Right Keywords Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Projects List & Filter (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Category & User Filter Bar */}
          <div className="glass-panel p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Filter size={14} className="text-indigo-400" />
              <span>Filter Project</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Kategori Induk</label>
                <select
                  value={filterCategoryId}
                  onChange={e => setFilterCategoryId(e.target.value)}
                  className="input-field text-xs py-1.5"
                >
                  <option value="ALL">Semua Kategori</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Pemilik Project (Admin Filter)</label>
                  <select
                    value={filterUserId}
                    onChange={e => setFilterUserId(e.target.value)}
                    className="input-field text-xs py-1.5"
                  >
                    <option value="ALL">Semua Pengguna</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredProjects.map((p) => {
              const isSelected = activeProject?.id === p.id;
              const kwCount = keywords[p.id]?.length || p.keyword_count || 0;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    setKeywordSearchQuery('');
                  }}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{p.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Globe size={12} className="text-cyan-400" />
                        <span>{p.target_url}</span>
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Hapus project "${p.name}" beserta semua kata kuncinya?`)) {
                          onDeleteProject(p.id);
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Hapus Project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-xs">
                    <span className="badge badge-indigo text-[10px]">
                      <Layers size={10} /> {p.category_name || 'Umum'}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Tag size={12} className="text-indigo-400" />
                      {kwCount} Keywords
                    </span>
                  </div>

                  {isAdmin && p.user_name && (
                    <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1">
                      <User size={10} className="text-slate-400" />
                      <span>Pemilik: {p.user_name}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="glass-panel p-6 text-center text-slate-500 text-sm">
                Belum ada project yang sesuai dengan filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Keyword Detail & Management (8 cols) */}
        <div className="lg:col-span-8">
          {activeProject ? (
            <div className="glass-panel p-6 space-y-5">
              
              {/* Active Project Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{activeProject.name}</h3>
                    <span className="badge badge-indigo">
                      <Layers size={12} /> {activeProject.category_name || 'Umum'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <a
                      href={`https://${activeProject.target_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>https://{activeProject.target_url}</span>
                      <ExternalLink size={12} />
                    </a>
                    {isAdmin && activeProject.user_name && (
                      <span className="text-xs text-slate-400 border-l border-slate-800 pl-3">
                        Pemilik: <strong className="text-slate-200">{activeProject.user_name}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddKeywordsModal(true)}
                    className="btn-secondary text-xs"
                  >
                    <Plus size={14} />
                    <span>Bulk Keyword</span>
                  </button>
                  <button
                    onClick={handleRunAllCheck}
                    disabled={checkingProject || rawKeywords.length === 0}
                    className="btn-primary text-xs"
                  >
                    {checkingProject ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    <span>Cek SERP Semua Keyword</span>
                  </button>
                </div>
              </div>

              {/* Search Bar with Autofill / Autocomplete & A-Z Badge */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    list="keywords-autofill-list"
                    placeholder="Cari & autofill kata kunci di project ini..."
                    value={keywordSearchQuery}
                    onChange={e => setKeywordSearchQuery(e.target.value)}
                    className="input-field pl-9 pr-8 text-xs py-1.5 w-full"
                  />
                  {keywordSearchQuery && (
                    <button
                      onClick={() => setKeywordSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white p-0.5"
                      title="Bersihkan Pencarian"
                    >
                      <X size={14} />
                    </button>
                  )}

                  {/* HTML5 Datalist for Native Browser Autofill / Autocomplete */}
                  <datalist id="keywords-autofill-list">
                    {rawKeywords.map(k => (
                      <option key={k.id} value={k.keyword} />
                    ))}
                  </datalist>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-400">
                    <ArrowUpDown size={14} />
                    <span>Urut A-Z</span>
                  </div>
                  <div>
                    Tampil <strong>{sortedKeywords.length}</strong> / {rawKeywords.length} Keyword
                  </div>
                </div>
              </div>

              {/* Keywords Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3">Kata Kunci (A-Z)</th>
                      <th className="py-3 px-3 text-center">Posisi Terakhir</th>
                      <th className="py-3 px-3 text-center">Halaman Google</th>
                      <th className="py-3 px-3">Terakhir Didaftar/Cek</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {displayedKeywords.length > 0 ? (
                      displayedKeywords.map((kw) => {
                        const isChecking = checkingKeywordId === kw.id;
                        return (
                          <tr key={kw.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3.5 px-3 font-semibold text-slate-200">
                              {kw.keyword}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              {kw.latest_position !== null && kw.latest_position !== undefined ? (
                                <span className={`badge ${
                                  kw.latest_position <= 3 ? 'badge-emerald' : kw.latest_position <= 10 ? 'badge-indigo' : 'badge-gray'
                                }`}>
                                  #{kw.latest_position}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500 italic">Belum diuji</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center text-xs text-slate-400">
                              {kw.page_number ? `Halaman ${kw.page_number}` : '-'}
                            </td>
                            <td className="py-3.5 px-3 text-xs text-slate-500">
                              {kw.checked_at ? new Date(kw.checked_at).toLocaleDateString('id-ID') : 'Belum diuji'}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleRunSingleCheck(kw.id)}
                                  disabled={isChecking || checkingProject}
                                  className="btn-secondary text-xs py-1 px-2.5"
                                  title="Jalankan SERP Check hingga hal 10"
                                >
                                  {isChecking ? (
                                    <RefreshCw size={12} className="animate-spin text-indigo-400" />
                                  ) : (
                                    <Play size={12} className="text-emerald-400" />
                                  )}
                                  <span>Cek SERP</span>
                                </button>
                                <button
                                  onClick={() => onDeleteKeyword(kw.id, activeProject.id)}
                                  className="text-slate-500 hover:text-rose-400 p-1"
                                  title="Hapus Keyword"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500 text-sm">
                          {keywordSearchQuery ? (
                            <span>Tidak ditemukan kata kunci yang cocok dengan "<strong>{keywordSearchQuery}</strong>".</span>
                          ) : (
                            <span>Belum ada kata kunci di project ini. Klik "Bulk Keyword" untuk memasukkan kata kunci.</span>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls Bar */}
              {sortedKeywords.length > ITEMS_PER_PAGE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs">
                  <div className="text-slate-400">
                    Menampilkan <strong className="text-white">{startIndex + 1}</strong> - <strong className="text-white">{Math.min(startIndex + ITEMS_PER_PAGE, sortedKeywords.length)}</strong> dari <strong className="text-white">{sortedKeywords.length}</strong> kata kunci
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={safePage === 1}
                      className="btn-secondary py-1 px-2.5 text-xs disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                      <span>Sebelumnya</span>
                    </button>

                    <div className="flex items-center gap-1 px-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                            pageNum === safePage
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={safePage === totalPages}
                      className="btn-secondary py-1 px-2.5 text-xs disabled:opacity-40"
                    >
                      <span>Berikutnya</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-panel p-12 text-center text-slate-500">
              Pilih project di sebelah kiri atau tambah project baru.
            </div>
          )}
        </div>

      </div>

      {/* Modal 1: Add New Project */}
      {showAddProjectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Tambah Project Baru</h3>
              <button onClick={() => setShowAddProjectModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Project</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Website Utama E-Commerce"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Induk Project</label>
                <select
                  value={newCategoryId}
                  onChange={e => setNewCategoryId(e.target.value)}
                  className="input-field text-xs"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">URL Target Website (Domain / Path)</label>
                <input
                  type="text"
                  required
                  placeholder="misal: tokoserba.com"
                  value={newTargetUrl}
                  onChange={e => setNewTargetUrl(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Negara Google Search</label>
                <select
                  value={newCountry}
                  onChange={e => setNewCountry(e.target.value)}
                  className="input-field"
                >
                  <option value="id">Indonesia (google.co.id)</option>
                  <option value="us">United States (google.com)</option>
                  <option value="sg">Singapore (google.com.sg)</option>
                  <option value="my">Malaysia (google.com.my)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kata Kunci Awal (Opsional)</label>
                <textarea
                  rows={3}
                  placeholder="sepatu pria online&#10;toko baju grosir"
                  value={initialKeywords}
                  onChange={e => setInitialKeywords(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddProjectModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Simpan Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Bulk Add Keywords */}
      {showAddKeywordsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Tambah Bulk Kata Kunci</h3>
              <button onClick={() => setShowAddKeywordsModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleBulkAddKeywords} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Daftar Kata Kunci (Satu per baris)
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="jasa seo terbaik&#10;layanan web development"
                  value={bulkKeywordsText}
                  onChange={e => setBulkKeywordsText(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddKeywordsModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  Tambahkan Kata Kunci
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
