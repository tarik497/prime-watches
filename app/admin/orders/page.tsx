'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Search, Filter, ChevronDown, Eye, X, Phone, MapPin,
  Package, TrendingUp, Clock, Trash2, AlertTriangle, ShoppingCart
} from 'lucide-react';
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

// Group of orders from the same cart
interface OrderGroup {
  groupId: string | null;       // null = single-item order (no group_id)
  representativeId: string;     // first order id — used for status updates
  orders: Order[];
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  wilaya_name: string;
  delivery_type: string;
  delivery_cost: number;
  status: OrderStatus;
  total_price: number;
  profit: number;
  created_at: string;
  notes?: string;
}

function groupOrders(orders: Order[]): OrderGroup[] {
  const map = new Map<string, Order[]>();
  const singles: Order[] = [];

  orders.forEach(o => {
    const gid = (o as Order & { order_group_id?: string }).order_group_id;
    if (gid) {
      if (!map.has(gid)) map.set(gid, []);
      map.get(gid)!.push(o);
    } else {
      singles.push(o);
    }
  });

  const groups: OrderGroup[] = [];

  // Grouped cart orders
  map.forEach((grpOrders, groupId) => {
    const first = grpOrders[0];
    groups.push({
      groupId,
      representativeId: first.id,
      orders: grpOrders,
      customer_name:    first.customer_name,
      customer_phone:   first.customer_phone,
      customer_address: first.customer_address,
      wilaya_name:      first.wilaya_name,
      delivery_type:    first.delivery_type,
      delivery_cost:    grpOrders.reduce((s, o) => s + o.delivery_cost, 0),
      status:           first.status,
      total_price:      grpOrders.reduce((s, o) => s + o.total_price, 0),
      profit:           grpOrders.reduce((s, o) => s + o.profit, 0),
      created_at:       first.created_at,
      notes:            first.notes,
    });
  });

  // Single-item orders
  singles.forEach(o => {
    groups.push({
      groupId:          null,
      representativeId: o.id,
      orders:           [o],
      customer_name:    o.customer_name,
      customer_phone:   o.customer_phone,
      customer_address: o.customer_address,
      wilaya_name:      o.wilaya_name,
      delivery_type:    o.delivery_type,
      delivery_cost:    o.delivery_cost,
      status:           o.status,
      total_price:      o.total_price,
      profit:           o.profit,
      created_at:       o.created_at,
      notes:            o.notes,
    });
  });

  // Sort by date desc
  return groups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function AdminOrdersPage() {
  const [orders, setOrders]             = useState<Order[]>([]);
  const [groups, setGroups]             = useState<OrderGroup[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected]         = useState<OrderGroup | null>(null);
  const [updatingId, setUpdatingId]     = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<OrderGroup | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    const res  = await fetchApi(`/api/orders?${params}`);
    const data = await res.json();
    const raw: Order[] = data.orders || [];
    setOrders(raw);
    setGroups(groupOrders(raw));
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(group: OrderGroup, status: OrderStatus) {
    setUpdatingId(group.representativeId);
    try {
      // Update ALL orders in the group
      await Promise.all(
        group.orders.map(o =>
          fetchApi(`/api/orders/${o.id}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ status }),
          })
        )
      );
      toast.success(`Statut: ${getStatusLabel(status)}`);
      setOrders(prev => prev.map(o =>
        group.orders.some(go => go.id === o.id) ? { ...o, status } : o
      ));
      setGroups(prev => prev.map(g =>
        g.representativeId === group.representativeId ? { ...g, status } : g
      ));
      if (selected?.representativeId === group.representativeId)
        setSelected(prev => prev ? { ...prev, status } : null);
    } catch {
      toast.error('Erreur mise à jour');
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteGroup(group: OrderGroup) {
    setDeletingId(group.representativeId);
    try {
      await Promise.all(
        group.orders.map(o => fetchApi(`/api/orders/${o.id}`, { method: 'DELETE' }))
      );
      toast.success('Commande supprimée');
      setOrders(prev => prev.filter(o => !group.orders.some(go => go.id === o.id)));
      setGroups(prev => prev.filter(g => g.representativeId !== group.representativeId));
      if (selected?.representativeId === group.representativeId) setSelected(null);
    } catch {
      toast.error('Erreur suppression');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  const totalRevenue = groups.filter(g => g.status !== 'cancelled').reduce((s, g) => s + g.total_price, 0);
  const totalProfit  = groups.filter(g => g.status !== 'cancelled').reduce((s, g) => s + g.profit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white">Commandes</h1>
          <p className="text-obsidian-400 font-body text-sm mt-0.5">{groups.length} commande{groups.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-obsidian-800 border border-obsidian-700 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-obsidian-400 font-body">Revenu</p>
            <p className="text-gold-400 font-display text-lg">{formatDA(totalRevenue)}</p>
          </div>
          <div className="bg-obsidian-800 border border-obsidian-700 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-obsidian-400 font-body">Profit</p>
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
                {['Client', 'Articles', 'Wilaya', 'Total', 'Profit', 'Date', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-body font-medium text-obsidian-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-700/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-obsidian-700 rounded w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : groups.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center">
                  <Package className="w-10 h-10 text-obsidian-600 mx-auto mb-3" />
                  <p className="text-obsidian-500 font-body">Aucune commande</p>
                </td></tr>
              ) : (
                groups.map(group => (
                  <tr key={group.representativeId} className="hover:bg-obsidian-700/30 transition-colors">

                    {/* Client */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-white font-body font-medium">{group.customer_name}</p>
                      <p className="text-xs text-obsidian-400">{group.customer_phone}</p>
                    </td>

                    {/* Articles — key column */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2 min-w-[200px] max-w-[280px]">
                        {group.orders.map(o => (
                          <div key={o.id} className="flex items-center gap-2">
                            {/* Product image */}
                            <div className="relative w-9 h-9 flex-shrink-0 rounded-lg overflow-hidden bg-obsidian-700">
                              {o.product_image ? (
                                <Image src={o.product_image} alt={o.product_name} fill className="object-cover" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Clock className="w-3.5 h-3.5 text-obsidian-500" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-white font-body font-medium truncate max-w-[160px]">{o.product_name}</p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs text-obsidian-400">×{o.quantity}</span>
                                {(o as Order & { selected_color?: string }).selected_color && (
                                  <span className="text-xs bg-obsidian-600 text-obsidian-200 px-1.5 py-0.5 rounded-full">
                                    {(o as Order & { selected_color?: string }).selected_color}
                                  </span>
                                )}
                                <span className="text-xs text-gold-400 font-body">{formatDA(o.selling_price * o.quantity)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {group.orders.length > 1 && (
                          <span className="flex items-center gap-1 text-xs text-obsidian-400 font-body">
                            <ShoppingCart className="w-3 h-3" /> {group.orders.length} articles
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-obsidian-300 font-body whitespace-nowrap">{group.wilaya_name}</td>
                    <td className="px-4 py-3 text-sm text-gold-400 font-body font-medium whitespace-nowrap">{formatDA(group.total_price)}</td>
                    <td className="px-4 py-3 text-sm font-body font-medium whitespace-nowrap">
                      <span className={group.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatDA(group.profit)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-obsidian-400 font-body whitespace-nowrap">
                      {format(new Date(group.created_at), 'dd/MM/yy HH:mm')}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {updatingId === group.representativeId ? (
                        <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="relative">
                          <select value={group.status}
                            onChange={e => updateStatus(group, e.target.value as OrderStatus)}
                            className={`appearance-none text-xs font-body font-medium px-3 py-1.5 pr-7 rounded-full cursor-pointer focus:outline-none ${getStatusColor(group.status)}`}>
                            {STATUS_FLOW.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
                            <option value="cancelled">Annulée</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-70" />
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelected(group)}
                          className="p-1.5 rounded-lg text-obsidian-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(group)}
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

      {/* ── Delete Confirm Modal ── */}
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
            <p className="text-obsidian-400 font-body text-xs mb-2">
              {confirmDelete.orders.length} article{confirmDelete.orders.length > 1 ? 's' : ''} · {formatDA(confirmDelete.total_price)}
            </p>
            <p className="text-xs text-red-400/80 font-body mb-5 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              ⚠️ Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-obsidian-600 text-obsidian-300 font-body text-sm hover:bg-obsidian-700 transition-colors">
                Annuler
              </button>
              <button onClick={() => deleteGroup(confirmDelete)}
                disabled={deletingId === confirmDelete.representativeId}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-body font-medium text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {deletingId === confirmDelete.representativeId
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Trash2 className="w-4 h-4" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}>
          <div className="relative bg-obsidian-800 border-l border-obsidian-700 w-full max-w-md h-full overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>

            {/* Drawer header */}
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
              {/* Date */}
              <div>
                <p className="text-xs text-obsidian-400 font-body mb-1">Date</p>
                <p className="text-white font-body text-sm">
                  {format(new Date(selected.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-obsidian-400 font-body mb-2 uppercase tracking-wider">Statut</p>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-body font-medium ${getStatusColor(selected.status)}`}>
                  {getStatusLabel(selected.status)}
                </span>
              </div>

              {/* Change status */}
              <div>
                <p className="text-xs text-obsidian-400 font-body mb-2 uppercase tracking-wider">Changer le statut</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FLOW.map(s => (
                    <button key={s} onClick={() => updateStatus(selected, s)}
                      disabled={selected.status === s || updatingId === selected.representativeId}
                      className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all disabled:opacity-50 ${
                        selected.status === s
                          ? getStatusColor(s)
                          : 'border border-obsidian-600 text-obsidian-400 hover:border-gold-500 hover:text-gold-400'
                      }`}>
                      {getStatusLabel(s)}
                    </button>
                  ))}
                  <button onClick={() => updateStatus(selected, 'cancelled')}
                    disabled={selected.status === 'cancelled' || updatingId === selected.representativeId}
                    className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all disabled:opacity-50 ${
                      selected.status === 'cancelled'
                        ? getStatusColor('cancelled')
                        : 'border border-red-500/30 text-red-400 hover:bg-red-500/10'
                    }`}>
                    Annuler
                  </button>
                </div>
              </div>

              {/* ── Articles ── */}
              <div className="bg-obsidian-700/40 rounded-xl border border-obsidian-600 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-obsidian-600">
                  <ShoppingCart className="w-4 h-4 text-gold-400" />
                  <p className="text-sm font-body font-semibold text-white">
                    Articles ({selected.orders.length})
                  </p>
                </div>
                <div className="divide-y divide-obsidian-600">
                  {selected.orders.map(o => (
                    <div key={o.id} className="p-4 flex gap-3">
                      {/* Image */}
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-obsidian-700">
                        {o.product_image ? (
                          <Image src={o.product_image} alt={o.product_name} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-obsidian-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm text-white font-body font-medium">{o.product_name}</p>
                        <div className="flex flex-wrap gap-2 text-xs font-body">
                          <span className="text-obsidian-400">Qté : <span className="text-obsidian-200">×{o.quantity}</span></span>
                          {(o as Order & { selected_color?: string }).selected_color && (
                            <span className="bg-obsidian-600 text-obsidian-200 px-2 py-0.5 rounded-full">
                              {(o as Order & { selected_color?: string }).selected_color}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between text-xs font-body">
                          <span className="text-obsidian-400">Prix unit.</span>
                          <span className="text-gold-400">{formatDA(o.selling_price)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-body">
                          <span className="text-obsidian-400">Sous-total</span>
                          <span className="text-white font-medium">{formatDA(o.selling_price * o.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Client */}
              <InfoSection title="Client" icon={<Phone className="w-4 h-4 text-gold-400" />}>
                <InfoRow label="Nom"       value={selected.customer_name} />
                <InfoRow label="Téléphone" value={selected.customer_phone} />
                <InfoRow label="Adresse"   value={selected.customer_address} />
              </InfoSection>

              {/* Delivery */}
              <InfoSection title="Livraison" icon={<MapPin className="w-4 h-4 text-gold-400" />}>
                <InfoRow label="Wilaya" value={selected.wilaya_name} />
                <InfoRow label="Type"   value={selected.delivery_type === 'home' ? 'À domicile' : 'Bureau / Relais'} />
                <InfoRow label="Coût"   value={formatDA(selected.delivery_cost)} />
              </InfoSection>

              {/* Financier */}
              <InfoSection title="Financier" icon={<TrendingUp className="w-4 h-4 text-gold-400" />}>
                <InfoRow label="Total client" value={formatDA(selected.total_price)} bold />
                <InfoRow label="Profit"       value={formatDA(selected.profit)}
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

function InfoRow({ label, value, bold, valueClass }: {
  label: string; value: string; bold?: boolean; valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-start text-sm font-body gap-4">
      <span className="text-obsidian-400 flex-shrink-0">{label}</span>
      <span className={`${bold ? 'font-semibold' : 'font-medium'} ${valueClass || 'text-white'} text-right break-words`}>
        {value}
      </span>
    </div>
  );
}
