'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, ShoppingBag, DollarSign,
  Receipt, BarChart3, ArrowRight, Package, Clock
} from 'lucide-react';
import { formatDA, getStatusColor, getStatusLabel } from '@/lib/calculations';
import type { DashboardStats, Order } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchApi } from '@/lib/fetchApi';

interface DashboardData extends DashboardStats {
  recentOrders: Order[];
  revenueByDay: { date: string; revenue: number; profit: number }[];
  ordersByStatus: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending:   '#fbbf24',
  confirmed: '#60a5fa',
  shipped:   '#a78bfa',
  delivered: '#34d399',
  cancelled: '#f87171',
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/api/dashboard', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <div className="text-obsidian-400 font-body">Erreur de chargement</div>;

  const statCards = [
    { label: "Chiffre d'affaires", value: formatDA(data.totalRevenue), icon: DollarSign, color: 'text-gold-400', bg: 'border-gold-500/20 bg-gold-500/5', trend: null },
    { label: 'Profit brut', value: formatDA(data.totalProfit), icon: TrendingUp, color: 'text-green-400', bg: 'border-green-500/20 bg-green-500/5', trend: data.totalProfit >= 0 ? 'up' : 'down' },
    { label: 'Dépenses totales', value: formatDA(data.totalExpenses), icon: Receipt, color: 'text-red-400', bg: 'border-red-500/20 bg-red-500/5', trend: 'down' },
    { label: 'PROFIT RÉEL', value: formatDA(data.realProfit), icon: BarChart3, color: data.realProfit >= 0 ? 'text-emerald-400' : 'text-red-400', bg: data.realProfit >= 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5', trend: data.realProfit >= 0 ? 'up' : 'down', highlight: true },
    { label: 'Total commandes', value: data.totalOrders.toString(), icon: ShoppingBag, color: 'text-blue-400', bg: 'border-blue-500/20 bg-blue-500/5', trend: null },
    { label: 'En attente', value: data.pendingOrders.toString(), icon: Clock, color: 'text-yellow-400', bg: 'border-yellow-500/20 bg-yellow-500/5', trend: null },
  ];

  // Max revenue for bar chart scaling
  const maxRevenue = Math.max(...data.revenueByDay.map(d => d.revenue), 1);
  const last14Days = data.revenueByDay.slice(-14);

  // Total for pie chart
  const totalOrders = data.ordersByStatus.reduce((s, o) => s + o.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-white">Tableau de bord</h1>
        <p className="text-obsidian-400 font-body text-sm mt-1">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`bg-obsidian-800 rounded-2xl border p-5 ${card.bg} ${'highlight' in card && card.highlight ? 'ring-1 ring-emerald-500/30' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-obsidian-700`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              {card.trend && (
                <span className={`flex items-center gap-1 text-xs font-body ${card.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {card.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                </span>
              )}
            </div>
            <p className="text-obsidian-400 text-xs font-body uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`font-display ${'highlight' in card && card.highlight ? 'text-3xl' : 'text-2xl'} ${card.color}`}>{card.value}</p>
            {'highlight' in card && card.highlight && (
              <p className="text-xs text-obsidian-500 font-body mt-1">Après déduction des dépenses</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Bar Chart */}
        <div className="xl:col-span-2 bg-obsidian-800 rounded-2xl border border-obsidian-700 p-6">
          <h2 className="font-display text-xl text-white mb-1">Revenus & Profits — 14 derniers jours</h2>
          <div className="flex items-center gap-4 mb-5">
            <span className="flex items-center gap-1.5 text-xs text-obsidian-400 font-body"><span className="w-3 h-2 rounded-sm bg-gold-500 inline-block" /> Revenu</span>
            <span className="flex items-center gap-1.5 text-xs text-obsidian-400 font-body"><span className="w-3 h-2 rounded-sm bg-emerald-500 inline-block" /> Profit</span>
          </div>
          {last14Days.every(d => d.revenue === 0) ? (
            <div className="h-44 flex items-center justify-center text-obsidian-500 font-body text-sm">Aucune donnée disponible</div>
          ) : (
            <div className="flex items-end gap-1.5 h-44">
              {last14Days.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex flex-col items-center justify-end gap-0.5" style={{ height: '160px' }}>
                    <div
                      className="w-full rounded-t bg-emerald-500/70 transition-all"
                      style={{ height: `${day.profit > 0 ? Math.max((day.profit / maxRevenue) * 140, 2) : 0}px` }}
                      title={`Profit: ${formatDA(day.profit)}`}
                    />
                    <div
                      className="w-full rounded-t bg-gold-500/70 transition-all"
                      style={{ height: `${Math.max((day.revenue / maxRevenue) * 140, day.revenue > 0 ? 2 : 0)}px` }}
                      title={`Revenu: ${formatDA(day.revenue)}`}
                    />
                  </div>
                  <span className="text-[9px] text-obsidian-500 font-body whitespace-nowrap">{day.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders by Status */}
        <div className="bg-obsidian-800 rounded-2xl border border-obsidian-700 p-6">
          <h2 className="font-display text-xl text-white mb-1">Statuts commandes</h2>
          <p className="text-obsidian-400 text-xs font-body mb-5">{totalOrders} commandes au total</p>
          {data.ordersByStatus.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-obsidian-500 font-body text-sm">Aucune commande</div>
          ) : (
            <div className="space-y-3">
              {data.ordersByStatus.map(s => (
                <div key={s.status}>
                  <div className="flex justify-between text-sm font-body mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[s.status] || '#6b6b6b' }} />
                      <span className="text-obsidian-300">{getStatusLabel(s.status)}</span>
                    </div>
                    <span className="text-white font-medium">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-obsidian-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${totalOrders > 0 ? (s.count / totalOrders) * 100 : 0}%`, background: STATUS_COLORS[s.status] || '#6b6b6b' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-obsidian-800 rounded-2xl border border-obsidian-700 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-obsidian-700">
          <h2 className="font-display text-xl text-white">Commandes récentes</h2>
          <Link href="/admin/orders" className="flex items-center gap-1.5 text-gold-400 text-sm font-body hover:text-gold-300 transition-colors">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-obsidian-700">
                {['#', 'Client', 'Produit', 'Wilaya', 'Total', 'Profit', 'Statut'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-body font-medium text-obsidian-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-700/50">
              {data.recentOrders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center">
                  <Package className="w-8 h-8 text-obsidian-600 mx-auto mb-2" />
                  <p className="text-obsidian-500 font-body text-sm">Aucune commande</p>
                </td></tr>
              ) : data.recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-obsidian-700/30 transition-colors">
                  <td className="px-4 py-3 text-xs text-obsidian-500 font-mono">#{order.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-body">{order.customer_name}</p>
                    <p className="text-xs text-obsidian-400">{order.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-obsidian-300 font-body max-w-[140px] truncate">{order.product_name}</td>
                  <td className="px-4 py-3 text-sm text-obsidian-300 font-body">{order.wilaya_name}</td>
                  <td className="px-4 py-3 text-sm text-gold-400 font-body font-medium">{formatDA(order.total_price)}</td>
                  <td className="px-4 py-3 text-sm font-body font-medium">
                    <span className={order.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatDA(order.profit)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-body font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-obsidian-700 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-obsidian-800 rounded-2xl border border-obsidian-700" />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 h-72 bg-obsidian-800 rounded-2xl border border-obsidian-700" />
        <div className="h-72 bg-obsidian-800 rounded-2xl border border-obsidian-700" />
      </div>
    </div>
  );
}
