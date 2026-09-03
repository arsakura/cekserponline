import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, Trash2, Edit2, Search, Filter } from 'lucide-react';
import { LogbookItem, ProjectItem, UserItem } from '../types';

interface LogbookViewProps {
  logbooks: LogbookItem[];
  projects: ProjectItem[];
  currentUser: UserItem;
  onAdd: (projectId: string, keywordId: string | null, actionType: string, description: string) => Promise<void>;
  onEdit: (id: string, actionType: string, description: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const LogbookView: React.FC<LogbookViewProps> = ({
  logbooks,
  projects,
  currentUser,
  onAdd,
  onEdit,
  onDelete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    projectId: '',
    actionType: 'create_post',
    description: ''
  });

  const [filterProject, setFilterProject] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

  const isAdmin = currentUser.role === 'admin';

  const filteredLogbooks = useMemo(() => {
    let result = logbooks;
    if (filterProject !== 'ALL') result = result.filter(l => l.project_id === filterProject);
    if (filterDate) result = result.filter(l => l.created_at.substring(0, 10) === filterDate);
    return result;
  }, [logbooks, filterProject, filterDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.actionType) {
      alert('Project dan jenis aksi harus diisi');
      return;
    }
    
    try {
      if (editingId) {
        await onEdit(editingId, formData.actionType, formData.description);
      } else {
        await onAdd(formData.projectId, null, formData.actionType, formData.description);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ projectId: '', actionType: 'create_post', description: '' });
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleEditClick = (log: LogbookItem) => {
    setEditingId(log.id);
    setFormData({
      projectId: log.project_id,
      actionType: log.action_type,
      description: log.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('Yakin ingin menghapus catatan ini?')) {
      try {
        await onDelete(id);
      } catch (err: any) {
        alert('Error: ' + err.message);
      }
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create_post': return <span className="badge badge-emerald">Create Post</span>;
      case 'edit': return <span className="badge badge-indigo">Edit Post</span>;
      case 'note': return <span className="badge badge-gray">Catatan</span>;
      default: return <span className="badge badge-gray">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold brand-font text-white flex items-center gap-2">
            <BookOpen className="text-indigo-400" size={24} />
            Lembar Kerja & Logbook
          </h2>
          <p className="text-sm text-slate-400 mt-1">Catat dan pantau aktivitas pekerjaan harian untuk setiap project.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ projectId: projects[0]?.id || '', actionType: 'create_post', description: '' });
            setIsModalOpen(true);
          }}
          className="btn-primary whitespace-nowrap"
        >
          <Plus size={16} />
          Catat Aktivitas
        </button>
      </div>

      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Filter size={16} className="absolute left-3 top-3 text-slate-400" />
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="input-field pl-9 text-xs w-full"
            >
              <option value="ALL">Semua Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="relative flex-1">
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="input-field text-xs w-full"
              title="Filter Tanggal"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Tanggal & Waktu</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Deskripsi / Catatan</th>
                {isAdmin && <th className="px-4 py-3">User</th>}
                <th className="px-4 py-3 text-right">Opsi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogbooks.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-slate-500">
                    Belum ada catatan aktivitas.
                  </td>
                </tr>
              ) : (
                filteredLogbooks.map(log => (
                  <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 text-slate-300">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{log.project_name}</td>
                    <td className="px-4 py-3">{getActionLabel(log.action_type)}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate" title={log.description || ''}>
                      {log.description || '-'}
                    </td>
                    {isAdmin && <td className="px-4 py-3 text-slate-300">{log.user_name}</td>}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(log)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(log.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingId ? 'Edit Aktivitas' : 'Catat Aktivitas Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Pilih Project</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                  className="input-field w-full text-sm"
                  disabled={!!editingId} // Disable changing project when editing
                >
                  <option value="" disabled>-- Pilih Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Jenis Aksi</label>
                <select
                  required
                  value={formData.actionType}
                  onChange={e => setFormData({ ...formData, actionType: e.target.value })}
                  className="input-field w-full text-sm"
                >
                  <option value="create_post">Create Post</option>
                  <option value="edit">Edit Post</option>
                  <option value="note">Catatan Tambahan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Deskripsi / URL Post</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Masukkan link post atau catatan..."
                  className="input-field w-full text-sm min-h-[80px]"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary text-sm justify-center"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
