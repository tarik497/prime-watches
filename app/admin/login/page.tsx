'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchApi } from '@/lib/fetchApi';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await fetchApi('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',    // ← this is important
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Identifiants incorrects');
    toast.success(`Bienvenue, ${data.admin.name}!`);
    setTimeout(() => {
      window.location.replace('/admin/dashboard');
    }, 500);
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : 'Erreur de connexion');
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="min-h-screen bg-obsidian-900 flex items-center justify-center px-4"
      style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,168,76,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(201,168,76,0.05) 0%, transparent 40%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gold-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gold-500/30">
            <Clock className="w-8 h-8 text-gold-400" />
          </div>
          <h1 className="font-display text-3xl text-white tracking-wider">PRIME WATCHES</h1>
          <p className="text-obsidian-400 font-body text-sm mt-1">Panneau d&apos;administration</p>
        </div>

        {/* Card */}
        <div className="bg-obsidian-800 rounded-2xl border border-obsidian-700 p-8 shadow-2xl">
          <h2 className="font-display text-2xl text-white mb-6">Connexion Admin</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-body font-medium text-obsidian-300 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="admin@primewatches.dz"
                  required
                  className="w-full bg-obsidian-700 border border-obsidian-600 text-white placeholder-obsidian-500 rounded-xl pl-10 pr-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-body font-medium text-obsidian-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className="w-full bg-obsidian-700 border border-obsidian-600 text-white placeholder-obsidian-500 rounded-xl pl-10 pr-12 py-3 font-body focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-obsidian-400 hover:text-white transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-gold py-3.5 rounded-xl font-body font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-obsidian-700 border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : 'Se connecter'}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-6 p-4 bg-obsidian-700/50 rounded-xl border border-obsidian-600">
            <p className="text-xs text-obsidian-400 font-body text-center">
              Comptes par défaut (changer en production):<br />
              <span className="text-obsidian-300">admin1@primewatches.dz</span> — Admin@1234<br />
              <span className="text-obsidian-300">admin2@primewatches.dz</span> — Admin@5678
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
