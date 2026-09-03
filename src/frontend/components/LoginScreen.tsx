import React, { useState } from 'react';
import { Search, Lock, Mail, ShieldAlert } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, pass: string) => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
      
      {/* Background Subtle Gradient Glow */}
      <div className="absolute w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -top-20 -left-20"></div>
      <div className="absolute w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Search size={28} className="text-cyan-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold brand-font text-white tracking-wide">
            CEK<span className="text-indigo-400">SERP</span>
          </h1>
          <p className="text-xs text-slate-400">
            Platform Pelacak Peringkat SERP Google & Rotasi API Key Multi-User
          </p>
        </div>

        {/* Login Box */}
        <div className="glass-panel p-8 space-y-6">
          
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Masuk ke Akun Anda</h2>
            <p className="text-xs text-slate-400">
              Gunakan email & password yang telah didaftarkan oleh Administrator.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3.5 text-xs text-rose-300 flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Pengguna</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="Masukkan email Anda..."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kata Sandi (Password)</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-9 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center text-sm py-2.5 mt-2"
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
            </button>
          </form>

        </div>

        {/* Footer Info */}
        <p className="text-center text-[11px] text-slate-500">
          Pendaftaran user baru ditutup untuk umum dan hanya dapat diproses oleh Administrator.
        </p>

      </div>
    </div>
  );
};
