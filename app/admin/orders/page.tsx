'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Search, Filter, ChevronDown, Eye, X, Phone, MapPin, Package, TrendingUp, Clock, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order, OrderStatus } from '@/lib/types';
import { formatDA, getStatusColor, getStatusLabel } from '@/lib/calculations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchApi } from '@/lib/fetchApi';

const STATUSES = [
  { value: 'all',       label: 'Toutes' },
  { value: 'pending',   label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'shipped',   label: 'Expédiées' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
];

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function AdminOrdersPage() {
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected]       = useState<Order | null>(null);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    const res = await fetchApi(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: OrderStatus) {
    setUpdatingId(id);
    try {
      const res = await fetchApi(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Statut: ${getStatusLabel(status)}`);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
    } catch {
      toast.error('Erreur mise à jour');
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteOrder(order: Order) {
    setDeletingId(order.id);
    try {
      const res = await fetchApi(`/api/orders/${order.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Commande supprimée');
      setOrders(prev => prev.filter(o => o.id !== order.id));
      if (selected?.id === order.id) setSelected(null);
    } catch {
      toast.error('Erreur suppression');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_price, 0);
  const totalProfit  = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.profit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white">Commandes</h1>
          <p className="text-obsidian-400 font-body text-sm mt-0.5">{orders.length} commandes affichées</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-obsidian-800 border border-obsidian-700 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-obsidian-400 font-body">Revenu filtré</p>
            <p className="text-gold-400 font-display text-lg">{formatDA(totalRevenue)}</p>
          </div>
          <div className="bg-obsidian-800 border border-obsidian-700 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-obsidian-400 font-body">Profit filtré</p>
            <p className={`font-display text-lg ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatDA(totalProfit)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par client..."
            className="w-full bg-obsidian-800 border border-obsidian-700 text-white placeholder-obsidian-500 rounded-xl pl-10 pr-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none bg-obsidian-800 border border-obsidian-700 text-white rounded-xl pl-10 pr-10 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500">
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-obsidian-800 rounded-2xl border border-obsidian-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-obsidian-700">
                {['#', 'Client', 'Produit', 'Wilaya', 'Total', 'Profit', 'Date', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-body font-medium text-obsidian-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-700/50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-obsidian-700 rounded w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center">
                  <Package className="w-10 h-10 text-obsidian-600 mx-auto mb-3" />
                  <p className="text-obsidian-500 font-body">Aucune commande</p>
                </td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-obsidian-700/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-obsidian-500 font-mono">#{order.id.slice(0, 8)}</td>

                    <td className="px-4 py-3">
                      <p className="text-sm text-white font-body font-medium">{order.customer_name}</p>
                      <p className="text-xs text-obsidian-400">{order.customer_phone}</p>
                    </td>

                    {/* Product with image */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-obsidian-700 flex-shrink-0">
                          {order.product_image ? (
                            <Image src={order.product_image} alt={order.product_name} fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Clock className="w-4 h-4 text-obsidian-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-obsidian-300 font-body max-w-[100px] truncate">{order.product_name}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-obsidian-500">×{order.quantity}</span>
                            {order.selected_color && (
                              <span className="text-xs bg-obsidian-600 text-obsidian-200 px-1.5 py-0.5 rounded-full">
                                {order.selected_color}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-obsidian-300 font-body whitespace-nowrap">{order.wilaya_name}</td>
                    <td className="px-4 py-3 text-sm text-gold-400 font-body font-medium whitespace-nowrap">{formatDA(order.total_price)}</td>
                    <td className="px-4 py-3 text-sm font-body font-medium whitespace-nowrap">
                      <span className={order.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatDA(order.profit)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-obsidian-400 font-body whitespace-nowrap">
                      {format(new Date(order.created_at), 'dd/MM/yy HH:mm')}
                    </td>

                    <td className="px-4 py-3">
                      <StatusSelector
                        currentStatus={order.status as OrderStatus}
                        loading={updatingId === order.id}
                        onChange={s => updateStatus(order.id, s)}
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelected(order)}
                          className="p-1.5 rounded-lg text-obsidian-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(order)}
                          className="p-1.5 rounded-lg text-obsidian-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
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

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setConfirmDelete(null)}>
          <div className="bg-obsidian-800 border border-obsidian-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-display text-xl text-white">Supprimer la commande ?</h3>
            </div>
            <p className="text-obsidian-300 font-body text-sm mb-1">
              Commande de <span className="text-white font-medium">{confirmDelete.customer_name}</span>
            </p>
            <p className="text-obsidian-400 font-body text-xs mb-6">
              {confirmDelete.product_name} · {formatDA(confirmDelete.total_price)}
            </p>
            <p className="text-xs text-red-400/80 font-body mb-5 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              ⚠️ Cette action est irréversible. La commande sera définitivement supprimée.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-obsidian-600 text-obsidian-300 font-body text-sm hover:bg-obsidian-700 transition-colors">
                Annuler
              </button>
              <button
                onClick={() => deleteOrder(confirmDelete)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-body font-medium text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {deletingId === confirmDelete.id ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Order Detail Drawer ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="relative bg-obsidian-800 border-l border-obsidian-700 w-full max-w-md h-full overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-obsidian-800 border-b border-obsidian-700 px-6 py-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-white">Détail commande</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => { setConfirmDelete(selected); setSelected(null); }}
                  className="p-2 rounded-lg text-obsidian-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelected(null)}
                  className="p-2 rounded-lg text-obsidian-400 hover:text-white hover:bg-obsidian-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* ID + Date */}
              <div>
                <p className="text-xs text-obsidian-400 font-body mb-1">Commande</p>
                <p className="text-white font-mono text-sm">#{selected.id}</p>
                <p className="text-obsidian-400 text-xs font-body mt-1">
                  {format(new Date(selected.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-obsidian-400 font-body mb-2 uppercase tracking-wider">Statut actuel</p>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-body font-medium ${getStatusColor(selected.status)}`}>
                  {getStatusLabel(selected.status)}
                </span>
              </div>

              <div>
                <p className="text-xs text-obsidian-400 font-body mb-2 uppercase tracking-wider">Changer le statut</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FLOW.map(s => (
                    <button key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      disabled={selected.status === s || updatingId === selected.id}
                      className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all disabled:opacity-50 ${
                        selected.status === s
                          ? getStatusColor(s)
                          : 'border border-obsidian-600 text-obsidian-400 hover:border-gold-500 hover:text-gold-400'
                      }`}>
                      {getStatusLabel(s)}
                    </button>
                  ))}
                  <button onClick={() => updateStatus(selected.id, 'cancelled')}
                    disabled={selected.status === 'cancelled' || updatingId === selected.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all disabled:opacity-50 ${
                      selected.status === 'cancelled'
                        ? getStatusColor('cancelled')
                        : 'border border-red-500/30 text-red-400 hover:bg-red-500/10'
                    }`}>
                    Annuler
                  </button>
                </div>
              </div>

              {/* Product with image */}
              <InfoSection title="Produit" icon={<Clock className="w-4 h-4 text-gold-400" />}>
                {selected.product_image && (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-obsidian-700">
                    <Image src={selected.product_image} alt={selected.product_name} fill className="object-cover" />
                  </div>
                )}
                <InfoRow label="Nom" value={selected.product_name} />
                <InfoRow label="Quantité" value={`×${selected.quantity}`} />
                {selected.selected_color && (
                  <InfoRow label="Couleur" value={selected.selected_color} />
                )}
                <InfoRow label="Prix vente" value={formatDA(selected.selling_price)} />
                <InfoRow label="Prix achat" value={formatDA(selected.purchase_price)} />
              </InfoSection>

              {/* Customer */}
              <InfoSection title="Client" icon={<Phone className="w-4 h-4 text-gold-400" />}>
                <InfoRow label="Nom" value={selected.customer_name} />
                <InfoRow label="Téléphone" value={selected.customer_phone} />
                <InfoRow label="Adresse" value={selected.customer_address} />
              </InfoSection>

              {/* Delivery */}
              <InfoSection title="Livraison" icon={<MapPin className="w-4 h-4 text-gold-400" />}>
                <InfoRow label="Wilaya" value={`${selected.wilaya_name} (${selected.wilaya_code})`} />
                <InfoRow label="Type" value={selected.delivery_type === 'home' ? 'À domicile' : 'Bureau / Relais'} />
                <InfoRow label="Coût livraison" value={formatDA(selected.delivery_cost)} />
              </InfoSection>

              {/* Financials */}
              <InfoSection title="Financier" icon={<TrendingUp className="w-4 h-4 text-gold-400" />}>
                <InfoRow label="Total client" value={formatDA(selected.total_price)} bold />
                <InfoRow label="Emballage" value={formatDA(selected.packaging_cost)} />
                <InfoRow label="Profit" value={formatDA(selected.profit)}
                  valueClass={selected.profit >= 0 ? 'text-emerald-400' : 'text-red-400'} bold />
              </InfoSection>

              {selected.notes && (
                <div className="bg-obsidian-700/50 rounded-xl p-4 border border-obsidian-600">
                  <p className="text-xs text-obsidian-400 font-body uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-obsidian-200 font-body">{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────

function StatusSelector({ currentStatus, loading, onChange }: {
  currentStatus: OrderStatus; loading: boolean; onChange: (s: OrderStatus) => void;
}) {
  return (
    <div className="relative">
      {loading ? (
        <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        <div className="relative">
          <select
            value={currentStatus}
            onChange={e => onChange(e.target.value as OrderStatus)}
            className={`appearance-none text-xs font-body font-medium px-3 py-1.5 pr-7 rounded-full cursor-pointer focus:outline-none ${getStatusColor(currentStatus)}`}>
            {STATUS_FLOW.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
            <option value="cancelled">Annulée</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-70" />
        </div>
      )}
    </div>
  );
}

function InfoSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-obsidian-700/40 rounded-xl p-4 border border-obsidian-600 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-sm font-body font-semibold text-white">{title}</p>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, bold, valueClass }: { label: string; value: string; bold?: boolean; valueClass?: string }) {
  return (
    <div className="flex justify-between items-start text-sm font-body gap-4">
      <span className="text-obsidian-400 flex-shrink-0">{label}</span>
      <span className={`${bold ? 'font-semibold' : 'font-medium'} ${valueClass || 'text-white'} text-right break-words`}>
        {value}
      </span>
    </div>
  );
}
