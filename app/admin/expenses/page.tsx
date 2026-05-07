'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Receipt, Fuel, Package, HelpCircle, TrendingDown, Filter, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Expense, ExpenseType } from '@/lib/types';
import { formatDA, sumExpenses } from '@/lib/calculations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchApi } from '@/lib/fetchApi';

const TYPES: { value: ExpenseType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'packaging', label: 'Emballage', icon: Package, color: 'text-purple-400' },
  { value: 'fuel',      label: 'Carburant', icon: Fuel,    color: 'text-orange-400' },
  { value: 'other',     label: 'Autre',     icon: HelpCircle, color: 'text-blue-400' },
];

const EMPTY = { type: 'packaging' as ExpenseType, amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] };

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  async function load() {
    setLoading(true);
    const res = await fetchApi('/api/expenses');
    const data = await res.json();
    setExpenses(data.expenses || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Montant requis'); return; }
    setSaving(true);
    try {
      const res = await fetchApi('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Dépense ajoutée!');
      setModalOpen(false);
      setForm({ ...EMPTY });
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetchApi(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Dépense supprimée');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erreur suppression');
    }
  }

  const filtered = typeFilter === 'all' ? expenses : expenses.filter(e => e.type === typeFilter);
  const totalAll = sumExpenses(expenses);
  const byType = TYPES.map(t => ({
    ...t,
    total: sumExpenses(expenses.filter(e => e.type === t.value)),
    count: expenses.filter(e => e.type === t.value).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white">Dépenses</h1>
          <p className="text-obsidian-400 font-body text-sm mt-0.5">Suivi de toutes les dépenses opérationnelles</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 btn-gold px-5 py-2.5 rounded-xl font-body font-medium text-sm">
          <Plus className="w-4 h-4" /> Ajouter une dépense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-obsidian-800 border border-red-500/20 rounded-2xl p-5">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center mb-3">
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-xs text-obsidian-400 font-body uppercase tracking-wider mb-1">Total dépenses</p>
          <p className="font-display text-2xl text-red-400">{formatDA(totalAll)}</p>
        </div>
        {byType.map(t => (
          <div key={t.value} className="bg-obsidian-800 border border-obsidian-700 rounded-2xl p-5">
            <div className="w-10 h-10 bg-obsidian-700 rounded-xl flex items-center justify-center mb-3">
              <t.icon className={`w-5 h-5 ${t.color}`} />
            </div>
            <p className="text-xs text-obsidian-400 font-body uppercase tracking-wider mb-1">{t.label}</p>
            <p className={`font-display text-2xl ${t.color}`}>{formatDA(t.total)}</p>
            <p className="text-xs text-obsidian-500 font-body mt-0.5">{t.count} entrée{t.count !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-obsidian-400" />
        <div className="flex gap-2 flex-wrap">
          {[{ value: 'all', label: 'Toutes' }, ...TYPES.map(t => ({ value: t.value, label: t.label }))].map(f => (
            <button key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-body transition-all ${
                typeFilter === f.value
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                  : 'bg-obsidian-800 text-obsidian-400 border border-obsidian-700 hover:border-obsidian-500'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-obsidian-800 rounded-2xl border border-obsidian-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-obsidian-700">
                {['Type', 'Description', 'Montant', 'Date', 'Ajouté par', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-body font-medium text-obsidian-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-700/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-obsidian-700 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center">
                  <Receipt className="w-10 h-10 text-obsidian-600 mx-auto mb-3" />
                  <p className="text-obsidian-500 font-body">Aucune dépense enregistrée</p>
                </td></tr>
              ) : (
                filtered.map(exp => {
                  const typeInfo = TYPES.find(t => t.value === exp.type);
                  return (
                    <tr key={exp.id} className="hover:bg-obsidian-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {typeInfo && <typeInfo.icon className={`w-4 h-4 ${typeInfo.color}`} />}
                          <span className={`text-sm font-body font-medium ${typeInfo?.color || 'text-white'}`}>
                            {typeInfo?.label || exp.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-obsidian-300 font-body max-w-[200px] truncate">
                        {exp.description || <span className="text-obsidian-600 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-400 font-body font-semibold">{formatDA(exp.amount)}</td>
                      <td className="px-4 py-3 text-sm text-obsidian-400 font-body whitespace-nowrap">
                        {format(new Date(exp.expense_date), 'd MMM yyyy', { locale: fr })}
                      </td>
                      <td className="px-4 py-3 text-sm text-obsidian-400 font-body">{exp.admin_name || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setDeleteId(exp.id)}
                          className="p-1.5 rounded-lg text-obsidian-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Expense Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-obsidian-800 rounded-2xl border border-obsidian-700 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-obsidian-700">
              <h2 className="font-display text-2xl text-white">Nouvelle dépense</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg text-obsidian-400 hover:text-white hover:bg-obsidian-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Type */}
              <div>
                <label className="block text-sm font-body font-medium text-obsidian-300 mb-2">Type de dépense</label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setForm(p => ({ ...p, type: t.value }))}
                      className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                        form.type === t.value
                          ? 'border-gold-500 bg-gold-500/10'
                          : 'border-obsidian-600 hover:border-obsidian-500'
                      }`}>
                      <t.icon className={`w-5 h-5 mb-1 ${form.type === t.value ? t.color : 'text-obsidian-400'}`} />
                      <span className={`text-xs font-body ${form.type === t.value ? 'text-white' : 'text-obsidian-400'}`}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-body font-medium text-obsidian-300 mb-1.5">Montant (DA) *</label>
                <input
                  type="number" min="0" step="1"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="1500"
                  className="w-full bg-obsidian-700 border border-obsidian-600 text-white placeholder-obsidian-500 rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-body font-medium text-obsidian-300 mb-1.5">Description (optionnel)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Détails de la dépense..."
                  className="w-full bg-obsidian-700 border border-obsidian-600 text-white placeholder-obsidian-500 rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-body font-medium text-obsidian-300 mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={e => setForm(p => ({ ...p, expense_date: e.target.value }))}
                  className="w-full bg-obsidian-700 border border-obsidian-600 text-white rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <button onClick={handleSave} disabled={saving}
                className="flex items-center justify-center gap-2 w-full btn-gold py-3.5 rounded-xl font-body font-semibold disabled:opacity-60">
                {saving ? 'Enregistrement...' : 'Ajouter la dépense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-obsidian-800 rounded-2xl border border-obsidian-700 p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-display text-xl text-white mb-2">Supprimer cette dépense?</h3>
            <p className="text-obsidian-400 font-body text-sm mb-6">Action irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-obsidian-600 text-obsidian-300 font-body text-sm hover:bg-obsidian-700 transition-colors">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-body text-sm hover:bg-red-600 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
