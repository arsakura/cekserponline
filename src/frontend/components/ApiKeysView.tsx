import React, { useState } from 'react';
import { 
  Key, Plus, Trash2, ShieldCheck, Sparkles, RefreshCw, AlertTriangle, Lock, Gauge, CheckCircle2 
} from 'lucide-react';
import { ApiKeyItem, UserItem } from '../types';

interface ApiKeysViewProps {
  apiKeys: ApiKeyItem[];
  currentUser: UserItem;
  loading: boolean;
  onAddApiKey: (key: string, label: string) => Promise<void>;
  onDeleteApiKey: (id: string) => Promise<void>;
  onToggleApiKey: (id: string, is_active: boolean) => Promise<void>;
  onCheckQuota: (id: string) => Promise<void>;
  onCheckAllQuotas: () => Promise<void>;
}

export const ApiKeysView: React.FC<ApiKeysViewProps> = ({
  apiKeys,
  currentUser,
  loading,
  onAddApiKey,
  onDeleteApiKey,
  onToggleApiKey,
  onCheckQuota,
  onCheckAllQuotas
}) => {
  const maxKeys = currentUser.role === 'admin' ? 9 : 6;

  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingQuotaId, setCheckingQuotaId] = useState<string | null>(null);
  const [checkingAll, setCheckingAll] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    if (apiKeys.length >= maxKeys) {
      setErrorMsg(`Maksimal ${maxKeys} API Key SerpApi per akun yang dapat ditambahkan.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onAddApiKey(newKey, newLabel);
      setNewKey('');
      setNewLabel('');
      setSuccessMsg('API Key baru berhasil disimpan!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan API Key');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleAddDemoKey = async () => {
    if (apiKeys.length >= maxKeys) {
      setErrorMsg(`Maksimal ${maxKeys} API Key SerpApi per akun yang dapat ditambahkan.`);
      return;
    }
    const index = apiKeys.length + 1;
    const demoKeyValue = `demo_key_serpapi_${currentUser.id.substring(0, 4)}_${index}`;
    await onAddApiKey(demoKeyValue, `Demo Key (${currentUser.name}) #${index}`);
    setSuccessMsg('Demo Key simulasi berhasil ditambahkan!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleCheckSingleQuota = async (id: string) => {
    setCheckingQuotaId(id);
    setErrorMsg(null);
    try {
      await onCheckQuota(id);
      setSuccessMsg('Pemeriksaan kuota API Key berhasil!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memeriksa kuota API');
    } finally {
      setCheckingQuotaId(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleCheckAllQuotas = async () => {
    setCheckingAll(true);
    setErrorMsg(null);
    try {
      await onCheckAllQuotas();
      setSuccessMsg('Pemeriksaan kuota seluruh API Key berhasil!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memeriksa kuota seluruh API');
    } finally {
      setCheckingAll(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold brand-font text-white flex items-center gap-2">
            Rotasi API Key SerpApi Akun ({apiKeys.length}/{maxKeys} Key)
            <ShieldCheck className="text-indigo-400" size={24} />
          </h2>
          <p className="text-sm text-slate-400">
            API Key yang Anda tambahkan disimpan secara privat untuk akun Anda (<strong className="text-slate-200">{currentUser.name}</strong>). Backend Cloudflare Worker merotasi hingga {maxKeys} API Key pribadi Anda saat melakukan pengecekan SERP.
          </p>
          <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg w-fit mt-2">
            <Lock size={14} />
            <span>Keamanan Terjamin: API Key Anda tidak dapat diakses atau digunakan oleh pengguna lain.</span>
          </div>
        </div>

        {apiKeys.length > 0 && (
          <button
            onClick={handleCheckAllQuotas}
            disabled={checkingAll}
            className="btn-primary text-xs whitespace-nowrap py-2.5 px-4 shadow-lg shadow-indigo-500/20"
          >
            <Gauge size={15} className={checkingAll ? 'animate-spin text-white' : 'text-white'} />
            <span>{checkingAll ? 'Memeriksa Kuota...' : 'Cek Semua Kuota API'}</span>
          </button>
        )}
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

      {/* Main Grid: Form + Key List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Add API Key (5 cols) */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus size={18} className="text-indigo-400" />
              Tambah API Key Pribadi ({apiKeys.length}/{maxKeys})
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Label API Key (Pengenal)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Key SerpApi Pribadi 1"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  SerpApi Key (64 karakter hex)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Pastekan API key dari serpapi.com..."
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  className="input-field text-xs font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Dapatkan API Key gratis di <a href="https://serpapi.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">serpapi.com</a>
                </span>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={submitting || apiKeys.length >= maxKeys}
                  className="btn-primary w-full justify-center text-xs"
                >
                  {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
                  <span>Simpan API Key Akun</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddDemoKey}
                  disabled={apiKeys.length >= maxKeys}
                  className="btn-secondary w-full justify-center text-xs text-indigo-300 border-indigo-500/30"
                >
                  <Sparkles size={14} className="text-indigo-400" />
                  <span>Tambah Key Simulasi / Demo</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right List: Active Keys & Quota Gauge (7 cols) */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span>Daftar API Key Akun Anda</span>
              <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                {apiKeys.filter(k => k.is_active === 1).length} Aktif
              </span>
            </h3>

            <div className="space-y-3.5">
              {apiKeys.map((item, idx) => {
                const isActive = item.is_active === 1;
                const isCheckingThis = checkingQuotaId === item.id;
                const isLiveSynced = item.remaining_quota !== undefined && item.remaining_quota !== null;

                const total = item.total_quota || 100;
                const remaining = isLiveSynced
                  ? item.remaining_quota!
                  : Math.max(0, total - (item.usage_count || 0));

                const percent = Math.min(100, Math.max(0, (remaining / total) * 100));

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      isActive
                        ? 'bg-slate-900/60 border-slate-800'
                        : 'bg-slate-900/20 border-slate-900 opacity-60'
                    }`}
                  >
                    {/* Top Row: Title, Key, Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                          <h4 className="font-bold text-white text-sm">{item.label}</h4>
                          {item.api_key.startsWith('demo_') && (
                            <span className="badge badge-indigo text-[10px]">Demo Mode</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          {item.api_key.substring(0, 10)}****************
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCheckSingleQuota(item.id)}
                          disabled={isCheckingThis || checkingAll}
                          className="btn-secondary text-[11px] py-1 px-2.5 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/10"
                          title="Cek Kuota Terakhir dari SerpApi"
                        >
                          <Gauge size={13} className={isCheckingThis ? 'animate-spin text-cyan-400' : 'text-cyan-400'} />
                          <span>{isCheckingThis ? 'Memeriksa...' : 'Cek Kuota API'}</span>
                        </button>

                        <button
                          onClick={() => onToggleApiKey(item.id, !isActive)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {isActive ? 'Aktif' : 'Non-Aktif'}
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Hapus API Key "${item.label}"?`)) {
                              onDeleteApiKey(item.id);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1.5"
                          title="Hapus Key"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* ALWAYS-VISIBLE Quota Progress Bar & Details */}
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                          <Gauge size={14} className="text-cyan-400" />
                          <span>Sisa Kuota Pemakaian API:</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {!isLiveSynced && (
                            <span className="text-[10px] text-slate-400 font-medium bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">
                              Estimasi
                            </span>
                          )}
                          <span className="font-extrabold text-white">
                            {remaining} / {total} Search ({percent.toFixed(0)}%)
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar Visual */}
                      <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percent > 30 ? 'bg-emerald-400 shadow-sm shadow-emerald-400/30' : percent > 10 ? 'bg-amber-400 shadow-sm shadow-amber-400/30' : 'bg-rose-500 shadow-sm shadow-rose-500/30'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 gap-1 pt-0.5 border-t border-slate-900">
                        <span>Plan: <strong className="text-slate-200">{item.plan_name || 'Free (100 Search/Bulan)'}</strong></span>
                        <div className="flex items-center gap-3">
                          <span>Terpakai: <strong className="text-slate-200">{item.usage_count} search</strong></span>
                          {item.quota_updated_at ? (
                            <span>• Sync: <strong className="text-cyan-400">{new Date(item.quota_updated_at).toLocaleTimeString('id-ID')}</strong></span>
                          ) : (
                            <span 
                              onClick={() => handleCheckSingleQuota(item.id)}
                              className="text-indigo-400 font-semibold cursor-pointer hover:underline flex items-center gap-1"
                            >
                              • Klik "Cek Kuota API" untuk sync
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}

              {apiKeys.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Anda belum memiliki API Key SerpApi. Klik tombol "Tambah Key Simulasi/Demo" atau masukkan API key asli Anda di atas.
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
