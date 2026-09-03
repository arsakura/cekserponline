import React, { useState } from 'react';
import { Layers, Plus, Trash2, X, FolderKanban, Sparkles } from 'lucide-react';
import { CategoryItem } from '../types';

interface CategoriesViewProps {
  categories: CategoryItem[];
  loading: boolean;
  onAddCategory: (name: string, description: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  loading,
  onAddCategory,
  onDeleteCategory
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await onAddCategory(name, description);
      setName('');
      setDescription('');
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold brand-font text-white flex items-center gap-2">
            Kategori Induk Project
            <Layers className="text-cyan-400" size={24} />
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Kelompokkan project website Anda berdasarkan Kategori Induk (misal: E-Commerce, Klien Agency, Affiliates).
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary whitespace-nowrap"
        >
          <Plus size={18} />
          <span>Tambah Kategori Induk</span>
        </button>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="glass-panel p-5 glass-panel-hover flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers size={18} className="text-indigo-400 shrink-0" />
                  <span>{cat.name}</span>
                </h3>
                {cat.user_id !== 'admin-01' && (
                  <button
                    onClick={() => {
                      if (confirm(`Hapus kategori "${cat.name}"?`)) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Hapus Kategori"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {cat.description || 'Tidak ada deskripsi'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <FolderKanban size={14} className="text-cyan-400" />
                {cat.project_count || 0} Projects Terhubung
              </span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase">
                {cat.user_name || 'System'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Category */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers size={20} className="text-cyan-400" />
                Tambah Kategori Induk Baru
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Kategori Induk</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Klien SEO Agency, E-Commerce, Blog Affiliates"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Kategori (Opsional)</label>
                <textarea
                  rows={3}
                  placeholder="Daftar website optimasi untuk proyek..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
