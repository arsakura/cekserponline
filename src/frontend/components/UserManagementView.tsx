import React, { useState } from 'react';
import { UserPlus, Shield, User, Trash2, X, Sparkles, CheckCircle2, AlertTriangle, Edit3, Key, Megaphone, Plus, ToggleLeft, ToggleRight, Trophy, Search, Activity, RefreshCw } from 'lucide-react';
import { UserItem, NewsTickerItem, FeaturedKeywordItem } from '../types';
import { apiGateway } from '../utils/apiGateway';

interface UserManagementViewProps {
  users: UserItem[];
  newsTickers: NewsTickerItem[];
  featuredKeywords?: FeaturedKeywordItem[];
  currentUser: UserItem;
  loading: boolean;
  onAddUser: (email: string, pass: string, name: string, role: 'admin' | 'user') => Promise<void>;
  onEditUser: (id: string, email: string, name: string, role: 'admin' | 'user', newPassword?: string) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onAddNewsTicker: (content: string, is_active: number) => Promise<void>;
  onEditNewsTicker: (id: string, content: string, is_active: number) => Promise<void>;
  onDeleteNewsTicker: (id: string) => Promise<void>;
  onAddFeaturedKeyword?: (keyword: string, is_active: number) => Promise<void>;
  onEditFeaturedKeyword?: (id: string, keyword: string, is_active: number) => Promise<void>;
  onDeleteFeaturedKeyword?: (id: string) => Promise<void>;
  onCheckFeaturedKeywordSerp?: (id: string) => Promise<void>;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  newsTickers,
  featuredKeywords = [],
  currentUser,
  loading,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onAddNewsTicker,
  onEditNewsTicker,
  onDeleteNewsTicker,
  onAddFeaturedKeyword,
  onEditFeaturedKeyword,
  onDeleteFeaturedKeyword,
  onCheckFeaturedKeywordSerp
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // News Ticker States
  const [showAddTickerModal, setShowAddTickerModal] = useState(false);
  const [showEditTickerModal, setShowEditTickerModal] = useState(false);
  const [editingTicker, setEditingTicker] = useState<NewsTickerItem | null>(null);

  const [tickerContent, setTickerContent] = useState('');
  const [tickerIsActive, setTickerIsActive] = useState<number>(1);

  // Featured Keyword States
  const [showAddFeaturedModal, setShowAddFeaturedModal] = useState(false);
  const [showEditFeaturedModal, setShowEditFeaturedModal] = useState(false);
  const [editingFeatured, setEditingFeatured] = useState<FeaturedKeywordItem | null>(null);
  const [checkingFeaturedId, setCheckingFeaturedId] = useState<string | null>(null);

  const [featuredText, setFeaturedText] = useState('');
  const [featuredIsActive, setFeaturedIsActive] = useState<number>(1);

  // Form states for Add
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');

  // Form states for Edit
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [editPassword, setEditPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onAddUser(email, password, name, role);
      setSuccessMsg(`User baru "${name}" berhasil ditambahkan!`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
      setShowAddModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan user baru');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword('');
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editName || !editEmail) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onEditUser(editingUser.id, editEmail, editName, editRole, editPassword || undefined);
      setSuccessMsg(`Data akun "${editName}" berhasil diperbarui!`);
      setShowEditModal(false);
      setEditingUser(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengedit user');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // --- NEWSTICKER HANDLERS ---
  const handleCreateTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerContent.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onAddNewsTicker(tickerContent.trim(), tickerIsActive);
      setSuccessMsg('News Ticker baru berhasil ditambahkan!');
      setTickerContent('');
      setTickerIsActive(1);
      setShowAddTickerModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan News Ticker');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const openEditTickerModal = (ticker: NewsTickerItem) => {
    setEditingTicker(ticker);
    setTickerContent(ticker.content);
    setTickerIsActive(Number(ticker.is_active));
    setShowEditTickerModal(true);
  };

  const handleUpdateTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicker || !tickerContent.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onEditNewsTicker(editingTicker.id, tickerContent.trim(), tickerIsActive);
      setSuccessMsg('News Ticker berhasil diperbarui!');
      setShowEditTickerModal(false);
      setEditingTicker(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui News Ticker');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleToggleTickerStatus = async (ticker: NewsTickerItem) => {
    const newStatus = Number(ticker.is_active) === 1 ? 0 : 1;
    try {
      await onEditNewsTicker(ticker.id, ticker.content, newStatus);
      setSuccessMsg(`Status News Ticker "${newStatus === 1 ? 'Aktif' : 'Nonaktif'}"!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengubah status News Ticker');
    } finally {
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // --- FEATURED KEYWORDS HANDLERS ---
  const handleCreateFeatured = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featuredText.trim() || !onAddFeaturedKeyword) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onAddFeaturedKeyword(featuredText.trim(), featuredIsActive);
      setSuccessMsg(`Kata kunci unggulan "${featuredText.trim()}" berhasil ditambahkan!`);
      setFeaturedText('');
      setFeaturedIsActive(1);
      setShowAddFeaturedModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan kata kunci unggulan');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const openEditFeaturedModal = (item: FeaturedKeywordItem) => {
    setEditingFeatured(item);
    setFeaturedText(item.keyword);
    setFeaturedIsActive(Number(item.is_active));
    setShowEditFeaturedModal(true);
  };

  const handleUpdateFeatured = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeatured || !featuredText.trim() || !onEditFeaturedKeyword) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onEditFeaturedKeyword(editingFeatured.id, featuredText.trim(), featuredIsActive);
      setSuccessMsg('Kata kunci unggulan berhasil diperbarui!');
      setShowEditFeaturedModal(false);
      setEditingFeatured(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui kata kunci unggulan');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleToggleFeaturedStatus = async (item: FeaturedKeywordItem) => {
    if (!onEditFeaturedKeyword) return;
    const newStatus = Number(item.is_active) === 1 ? 0 : 1;
    try {
      await onEditFeaturedKeyword(item.id, item.keyword, newStatus);
      setSuccessMsg(`Status Kata Kunci Unggulan "${newStatus === 1 ? 'Aktif' : 'Nonaktif'}"!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengubah status kata kunci unggulan');
    } finally {
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleRunFeaturedSerpCheck = async (item: FeaturedKeywordItem) => {
    if (!onCheckFeaturedKeywordSerp) return;
    setCheckingFeaturedId(item.id);
    setErrorMsg(null);
    try {
      await onCheckFeaturedKeywordSerp(item.id);
      setSuccessMsg(`Berhasil mengecek SERP live 10 besar Google untuk "${item.keyword}"!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengecek SERP live');
    } finally {
      setCheckingFeaturedId(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const [importingLegacy, setImportingLegacy] = useState(false);

  const handleImportLegacyData = async () => {
    if (!window.confirm('Apakah Anda yakin ingin mengimpor/sinkronkan data dari Server Legacy (muhammad.ardyan@gmail.com)?')) return;
    setImportingLegacy(true);
    setErrorMsg(null);
    try {
      const res = await apiGateway.fetchWithFailover('/api/admin/import-from-legacy', { method: 'POST' }, currentUser.id);
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);

      setSuccessMsg(`🎉 Impor berhasil! Ringkasan: ${json.summary.categories} Kategori, ${json.summary.projects} Proyek, ${json.summary.keywords} Kata Kunci, ${json.summary.newstickers} News Ticker, ${json.summary.featured_keywords} Kata Kunci Unggulan.`);
      setTimeout(() => window.location.reload(), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal impor dari server legacy. Pastikan server legacy tidak dalam keadaan error D1.');
    } finally {
      setImportingLegacy(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold brand-font text-white flex items-center gap-2">
            Manajemen User & Hak Akses (Super Admin)
            <Shield className="text-indigo-400" size={24} />
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Sebagai Administrator, Anda berhak menambahkan, mengedit data user, meriset password, dan menetapkan role.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleImportLegacyData}
            disabled={importingLegacy}
            className="px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            title="Tarik & Sinkronkan Seluruh Data dari Server Legacy (muhammad.ardyan@gmail.com)"
          >
            <RefreshCw size={15} className={importingLegacy ? 'animate-spin' : ''} />
            <span>{importingLegacy ? 'Mengimpor...' : '⚡ Impor Data Server Legacy'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary whitespace-nowrap"
          >
            <UserPlus size={18} />
            <span>Tambah User Baru</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Daftar Pengguna Terdaftar ({users.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Nama Pengguna</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-center">Role / Peran</th>
                <th className="py-3 px-4 text-center">Tanggal Dibuat</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {users.map((u) => {
                const isAdmin = u.role === 'admin';
                const isSelf = u.id === currentUser.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                    
                    {/* Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-200 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div>{u.name}</div>
                        {isSelf && <span className="text-[10px] text-indigo-400 font-bold">(Akun Anda)</span>}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-300">
                      {u.email}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 text-center">
                      {isAdmin ? (
                        <span className="badge badge-indigo">
                          <Shield size={12} /> ADMIN
                        </span>
                      ) : (
                        <span className="badge badge-gray">
                          <User size={12} /> USER BIASA
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleDateString('id-ID')}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="text-slate-400 hover:text-indigo-400 p-1.5 transition-colors"
                          title="Edit Data User"
                        >
                          <Edit3 size={16} />
                        </button>

                        {!isSelf && (
                          <button
                            onClick={() => {
                              if (confirm(`Hapus user "${u.name}" (${u.email})?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                            title="Hapus User"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* News Ticker Management Section */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Megaphone className="text-amber-400" size={18} />
              Manajemen News Ticker / Running Text Pengumuman
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Pesan pengumuman di sini akan secara otomatis berjalan di bagian atas semua halaman untuk semua pengguna.
            </p>
          </div>
          <button
            onClick={() => {
              setTickerContent('');
              setTickerIsActive(1);
              setShowAddTickerModal(true);
            }}
            className="btn-primary text-xs whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Tambah Running Text</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Pesan Pengumuman (Teks)</th>
                <th className="py-3 px-4 text-center">Status Tayang</th>
                <th className="py-3 px-4 text-center">Tanggal Dibuat</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {newsTickers.length > 0 ? (
                newsTickers.map((t) => {
                  const isActive = Number(t.is_active) === 1;

                  return (
                    <tr key={t.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-amber-300">
                        {t.content}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleTickerStatus(t)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {isActive ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} />}
                          <span>{isActive ? 'AKTIF (TAYANG)' : 'NONAKTIF'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                        {new Date(t.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditTickerModal(t)}
                            className="text-slate-400 hover:text-amber-400 p-1.5 transition-colors"
                            title="Edit News Ticker"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Hapus news ticker ini?')) {
                                onDeleteNewsTicker(t.id);
                              }
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                            title="Hapus News Ticker"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                    Belum ada pengumuman running text. Klik "Tambah Running Text" untuk membuat pengumuman pertama.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Featured Keywords Management Section */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="text-amber-400" size={18} />
              Pengaturan Kata Kunci Unggulan Dashboard (Top 10 Stats)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Super Admin dapat menambah/menghapus kata kunci yang statistik dominasinya akan ditampilkan di Dashboard seluruh user.
            </p>
          </div>
          <button
            onClick={() => {
              setFeaturedText('');
              setFeaturedIsActive(1);
              setShowAddFeaturedModal(true);
            }}
            className="btn-primary text-xs whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Tambah Kata Kunci Unggulan</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Kata Kunci Strategis</th>
                <th className="py-3 px-4 text-center">Status Pemantauan</th>
                <th className="py-3 px-4 text-center">Tanggal Dibuat</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {featuredKeywords.length > 0 ? (
                featuredKeywords.map((item) => {
                  const isActive = Number(item.is_active) === 1;

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-indigo-300 flex items-center gap-2">
                        <Search size={15} className="text-amber-400 shrink-0" />
                        "{item.keyword}"
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleFeaturedStatus(item)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {isActive ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} />}
                          <span>{isActive ? 'AKTIF (TAYANG)' : 'NONAKTIF'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                        {item.last_checked_at ? (
                          <div>
                            <span className="font-semibold text-emerald-400 block">
                              {item.top10_count || 0} / 10 Website
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(item.last_checked_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Belum dicek</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRunFeaturedSerpCheck(item)}
                            disabled={checkingFeaturedId === item.id}
                            className="btn-primary py-1 px-3 text-xs flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-indigo-600/30"
                            title="Jalankan SERP Check Live untuk 10 Besar Google"
                          >
                            {checkingFeaturedId === item.id ? (
                              <>
                                <Activity size={13} className="animate-spin text-amber-300" />
                                <span>Mengecek...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw size={13} />
                                <span>Cek SERP Live</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => openEditFeaturedModal(item)}
                            className="text-slate-400 hover:text-indigo-400 p-1.5 transition-colors"
                            title="Edit Kata Kunci Unggulan"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus kata kunci unggulan "${item.keyword}"?`)) {
                                onDeleteFeaturedKeyword && onDeleteFeaturedKeyword(item.id);
                              }
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                            title="Hapus Kata Kunci Unggulan"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                    Belum ada kata kunci unggulan yang didaftarkan. Klik "Tambah Kata Kunci Unggulan" di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add New User */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus size={20} className="text-indigo-400" />
                Tambah User Baru
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap User</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Andi Wijaya (Client Agency)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Pengguna</label>
                <input
                  type="email"
                  required
                  placeholder="andi@klienagency.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password Initial</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role / Hak Akses</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="input-field text-xs"
                >
                  <option value="user">User Biasa (Hanya akses website/project sendiri)</option>
                  <option value="admin">Administrator (Akses penuh seluruh website & user)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Menyimpan...' : 'Simpan User Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit User */}
      {showEditModal && editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 size={20} className="text-indigo-400" />
                Edit Akun User ({editingUser.name})
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap User</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Pengguna</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role / Hak Akses</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as any)}
                  className="input-field text-xs"
                >
                  <option value="user">User Biasa (Hanya akses website/project sendiri)</option>
                  <option value="admin">Administrator (Akses penuh seluruh website & user)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1">
                  <Key size={12} /> Password Baru (Kosongkan jika tidak ingin diubah)
                </label>
                <input
                  type="password"
                  placeholder="Ketik password baru jika ingin meriset..."
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Memperbarui...' : 'Simpan Perubahan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add News Ticker */}
      {showAddTickerModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone size={20} className="text-amber-400" />
                Tambah Running Text / News Ticker Baru
              </h3>
              <button onClick={() => setShowAddTickerModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicker} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teks Pengumuman / Running Text</label>
                <textarea
                  required
                  placeholder="Ketik teks pengumuman yang ingin ditampilkan ke semua user di semua halaman..."
                  value={tickerContent}
                  onChange={e => setTickerContent(e.target.value)}
                  className="input-field min-h-[90px] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status Tayang</label>
                <select
                  value={tickerIsActive}
                  onChange={e => setTickerIsActive(Number(e.target.value))}
                  className="input-field text-xs"
                >
                  <option value={1}>Aktif (Tampilkan di Running Text)</option>
                  <option value={0}>Nonaktif (Sembunyikan)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddTickerModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Menyimpan...' : 'Simpan Running Text'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Edit News Ticker */}
      {showEditTickerModal && editingTicker && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 size={20} className="text-amber-400" />
                Edit Running Text / News Ticker
              </h3>
              <button onClick={() => setShowEditTickerModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateTicker} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teks Pengumuman / Running Text</label>
                <textarea
                  required
                  value={tickerContent}
                  onChange={e => setTickerContent(e.target.value)}
                  className="input-field min-h-[90px] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status Tayang</label>
                <select
                  value={tickerIsActive}
                  onChange={e => setTickerIsActive(Number(e.target.value))}
                  className="input-field text-xs"
                >
                  <option value={1}>Aktif (Tampilkan di Running Text)</option>
                  <option value={0}>Nonaktif (Sembunyikan)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEditTickerModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Add Featured Keyword */}
      {showAddFeaturedModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy size={20} className="text-amber-400" />
                Tambah Kata Kunci Unggulan Baru
              </h3>
              <button onClick={() => setShowAddFeaturedModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFeatured} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kata Kunci Strategis</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: jasa pengaspalan jakarta"
                  value={featuredText}
                  onChange={e => setFeaturedText(e.target.value)}
                  className="input-field text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Sistem akan secara otomatis mencocokkan kata kunci ini dengan seluruh project yang terdaftar di database.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status Pemantauan</label>
                <select
                  value={featuredIsActive}
                  onChange={e => setFeaturedIsActive(Number(e.target.value))}
                  className="input-field text-xs"
                >
                  <option value={1}>Aktif (Tampilkan di Dashboard)</option>
                  <option value={0}>Nonaktif (Sembunyikan dari Dashboard)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddFeaturedModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Menyimpan...' : 'Simpan Kata Kunci'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Edit Featured Keyword */}
      {showEditFeaturedModal && editingFeatured && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 size={20} className="text-indigo-400" />
                Edit Kata Kunci Unggulan
              </h3>
              <button onClick={() => setShowEditFeaturedModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateFeatured} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kata Kunci Strategis</label>
                <input
                  type="text"
                  required
                  value={featuredText}
                  onChange={e => setFeaturedText(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status Pemantauan</label>
                <select
                  value={featuredIsActive}
                  onChange={e => setFeaturedIsActive(Number(e.target.value))}
                  className="input-field text-xs"
                >
                  <option value={1}>Aktif (Tampilkan di Dashboard)</option>
                  <option value={0}>Nonaktif (Sembunyikan dari Dashboard)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEditFeaturedModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
