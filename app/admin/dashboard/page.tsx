'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, ShoppingBag, DollarSign,
  Receipt, BarChart3, ArrowRight, Package, Clock,
  RefreshCw, AlertCircle
} from 'lucide-react';
import { formatDA, getStatusColor, getStatusLabel } from '@/lib/calculations';
import type { Order } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardData {
  totalRevenue:    number;
  totalProfit:     number;
  totalExpenses:   number;
  realProfit:      number;
  totalOrders:     number;
  pendingOrders:   number;
  confirmedOrders: number;
  deliveredOrders: number;
  recentOrders:    Order[];
  revenueByDay:    { date: string; revenue: number; profit: number }[];
  ordersByStatus:  { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending:   '#fbbf24',
  confirmed: '#60a5fa',
  shipped:   '#a78bfa',
  delivered: '#34d399',
  cancelled: '#f87171',
};

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg]   = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErrMsg(null);
    try {
      const res  = await fetch('/api/dashboard', { credentials: 'include' });
      const json = await res.json();

      if (!res.ok) {
        setErrMsg(`API ${res.status}: ${JSON.stringify(json)}`);
        setLoading(false);
        return;
      }

      setData({
        totalRevenue:    Number(json.totalRevenue)    || 0,
        totalProfit:     Number(json.totalProfit)     || 0,
        totalExpenses:   Number(json.totalExpenses)   || 0,
        realProfit:      Number(json.realProfit)      || 0,
        totalOrders:     Number(json.totalOrders)     || 0,
        pendingOrders:   Number(json.pendingOrders)   || 0,
        confirmedOrders: Number(json.confirmedOrders) || 0,
        deliveredOrders: Number(json.deliveredOrders) || 0,
        recentOrders:    Array.isArray(json.recentOrders)   ? json.recentOrders   : [],
        revenueByDay:    Array.isArray(json.revenueByDay)   ? json.revenueByDay   : [],
        ordersByStatus:  Array.isArray(json.ordersByStatus) ? json.ordersByStatus : [],
      });
    } catch (e) {
      setErrMsg(`Erreur: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <DashboardSkeleton />;

  if (errMsg) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="text-red-300 font-body text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 max-w-lg text-center break-all">
        {errMsg}
      </p>
      <button onClick={load}
        className="flex items-center gap-2 px-4 py-2 bg-obsidian-700 hover:bg-obsidian-600 text-white rounded-xl font-body text-sm">
        <RefreshCw className="w-4 h-4" /> Réessayer
      </button>
    </div>
  );

  if (!data) return null;

  const statCards = [
    { label: "Chiffre d'affaires", value: formatDA(data.totalRevenue),  icon: DollarSign, color: 'text-gold-400',    bg: 'border-gold-500/20 bg-gold-500/5' },
    { label: 'Profit brut',        value: formatDA(data.totalProfit),   icon: TrendingUp, color: 'text-green-400',   bg: 'border-green-500/20 bg-green-500/5',   trend: data.totalProfit >= 0 ? 'up' : 'down' },
    { label: 'Dépenses totales',   value: formatDA(data.totalExpenses), icon: Receipt,    color: 'text-red-400',     bg: 'border-red-500/20 bg-red-500/5' },
    { label: 'PROFIT RÉEL',        value: formatDA(data.realProfit),    icon: BarChart3,  color: data.realProfit >= 0 ? 'text-emerald-400' : 'text-red-400', bg: data.realProfit >= 0 ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5', trend: data.realProfit >= 0 ? 'up' : 'down', highlight: true, sub: 'Après déduction des dépenses' },
    { label: 'Total commandes',    value: String(data.totalOrders),     icon: ShoppingBag, color: 'text-blue-400',  bg: 'border-blue-500/20 bg-blue-500/5' },
    { label: 'En attente',         value: String(data.pendingOrders),   icon: Clock,      color: 'text-yellow-400', bg: 'border-yellow-500/20 bg-yellow-500/5' },
  ];

  const maxRevenue = Math.max(...data.revenueByDay.map(d => d.revenue), 1);
  const last14Days = data.revenueByDay.slice(-14);
  const totalStatusCount = data.ordersByStatus.reduce((s, o) => s + o.count, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white">Tableau de bord</h1>
          <p className="text-obsidian-400 font-body text-sm mt-1">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-1.5 text-obsidian-400 hover:text-white transition-colors font-body text-sm">
          <RefreshCw className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map(card => (
          <div key={card.label}
            className={`bg-obsidian-800 rounded-2xl border p-5 ${card.bg} ${'highlight' in card && card.highlight ? 'ring-1 ring-emerald-500/30' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-obsidian-700">
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              {'trend' in card && card.trend && (
                <span className={`flex items-center gap-1 text-xs font-body ${card.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {card.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                </span>
              )}
            </div>
            <p className="text-obsidian-400 text-xs font-body uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`font-display ${'highlight' in card && card.highlight ? 'text-3xl' : 'text-2xl'} ${card.color}`}>
              {card.value}
            </p>
            {'sub' in card && card.sub && (
              <p className="text-xs text-obsidian-500 font-body mt-1">{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar Chart */}
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
              {last14Days.map(day => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full flex flex-col items-center justify-end gap-0.5" style={{ height: '160px' }}>
                    <div className="w-full rounded-t bg-emerald-500/70 transition-all"
                      style={{ height: `${day.profit > 0 ? Math.max((day.profit / maxRevenue) * 140, 2) : 0}px` }} />
                    <div className="w-full rounded-t bg-gold-500/70 transition-all"
                      style={{ height: `${Math.max((day.revenue / maxRevenue) * 140, day.revenue > 0 ? 2 : 0)}px` }} />
                  </div>
                  <span className="text-[9px] text-obsidian-500 font-body whitespace-nowrap">{day.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="bg-obsidian-800 rounded-2xl border border-obsidian-700 p-6">
          <h2 className="font-display text-xl text-white mb-1">Statuts commandes</h2>
          <p className="text-obsidian-400 text-xs font-body mb-5">{totalStatusCount} commandes au total</p>
          {data.ordersByStatus.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-obsidian-500 font-body text-sm">Aucune commande</div>
          ) : (
            <div className="space-y-3">
              {data.ordersByStatus.map(s => (
                <div key={s.status}>
                  <div className="flex justify-between text-sm font-body mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[s.status] || '#6b6b6b' }} />
                      <span className="text-obsidian-300">{getStatusLabel(s.status)}</span>
                    </div>
                    <span className="text-white font-medium">{s.count}</span>
                  </div>
                  <div className="h-1.5 bg-obsidian-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${totalStatusCount > 0 ? (s.count / totalStatusCount) * 100 : 0}%`, background: STATUS_COLORS[s.status] || '#6b6b6b' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
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
                {['Client', 'Produit', 'Wilaya', 'Total', 'Profit', 'Statut'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-body font-medium text-obsidian-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-700/50">
              {data.recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center">
                  <Package className="w-8 h-8 text-obsidian-600 mx-auto mb-2" />
                  <p className="text-obsidian-500 font-body text-sm">Aucune commande récente</p>
                </td></tr>
              ) : data.recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-obsidian-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-body">{order.customer_name}</p>
                    <p className="text-xs text-obsidian-400">{order.customer_phone}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-obsidian-300 font-body max-w-[140px] truncate">{order.product_name}</td>
                  <td className="px-4 py-3 text-sm text-obsidian-300 font-body">{order.wilaya_name}</td>
                  <td className="px-4 py-3 text-sm text-gold-400 font-body font-medium">{formatDA(Number(order.total_price) || 0)}</td>
                  <td className="px-4 py-3 text-sm font-body font-medium">
                    <span className={Number(order.profit) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {formatDA(Number(order.profit) || 0)}
                    </span>
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
      <div className="h-64 bg-obsidian-800 rounded-2xl border border-obsidian-700" />
    </div>
  );
}
