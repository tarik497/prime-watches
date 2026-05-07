'use client';

import { useState, useEffect } from 'react';
import { Save, Settings, Package, Truck, Phone, RefreshCw, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DeliveryPrice } from '@/lib/types';
import { formatDA } from '@/lib/calculations';
import { WILAYAS } from '@/lib/wilayas';
import { fetchApi } from '@/lib/fetchApi';

export default function AdminSettingsPage() {
  const [packagingCost, setPackagingCost] = useState('200');
  const [whatsapp, setWhatsapp] = useState('');
  const [storeName, setStoreName] = useState('Prime Watches');
  const [savingGlobal, setSavingGlobal] = useState(false);

  const [deliveryPrices, setDeliveryPrices] = useState<DeliveryPrice[]>([]);
  const [loadingDelivery, setLoadingDelivery] = useState(true);
  const [savingDelivery, setSavingDelivery] = useState<string | null>(null);
  const [editedPrices, setEditedPrices] = useState<Record<number, { home: number; office: number }>>({});
  const [searchWilaya, setSearchWilaya] = useState('');

  useEffect(() => {
    // Load settings
    fetchApi('/api/settings').then(r => r.json()).then(d => {
      setPackagingCost(d.settings?.packaging_cost || '200');
      setWhatsapp(d.settings?.whatsapp_number || '');
      setStoreName(d.settings?.store_name || 'Prime Watches');
    });

    // Load delivery prices
    fetchApi('/api/delivery').then(r => r.json()).then(d => {
      setDeliveryPrices(d.prices || []);
      setLoadingDelivery(false);
    });
  }, []);

  async function saveGlobalSettings() {
    setSavingGlobal(true);
    try {
      const res = await fetchApi('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packaging_cost: packagingCost, whatsapp_number: whatsapp, store_name: storeName }),
      });
      if (!res.ok) throw new Error();
      toast.success('Paramètres sauvegardés!');
    } catch {
      toast.error('Erreur sauvegarde');
    } finally {
      setSavingGlobal(false);
    }
  }

  function updateLocalPrice(code: number, type: 'home' | 'office', value: string) {
    setEditedPrices(prev => ({
      ...prev,
      [code]: {
        home: type === 'home' ? parseFloat(value) || 0 : (prev[code]?.home ?? getPriceForWilaya(code, 'home')),
        office: type === 'office' ? parseFloat(value) || 0 : (prev[code]?.office ?? getPriceForWilaya(code, 'office')),
      },
    }));
  }

  function getPriceForWilaya(code: number, type: 'home' | 'office'): number {
    const dp = deliveryPrices.find(p => p.wilaya_code === code);
    return type === 'home' ? (dp?.home_price || 400) : (dp?.office_price || 300);
  }

  async function saveWilayaPrice(code: number) {
    setSavingDelivery(code.toString());
    try {
      const edited = editedPrices[code];
      const home = edited?.home ?? getPriceForWilaya(code, 'home');
      const office = edited?.office ?? getPriceForWilaya(code, 'office');
      const wilaya = WILAYAS.find(w => w.code === code);

      const res = await fetchApi('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wilaya_code: code, wilaya_name: wilaya?.name, home_price: home, office_price: office }),
      });
      if (!res.ok) throw new Error();
      // Update local state
      setDeliveryPrices(prev => prev.map(p =>
        p.wilaya_code === code ? { ...p, home_price: home, office_price: office } : p
      ));
      // Clear edited entry
      setEditedPrices(prev => { const n = { ...prev }; delete n[code]; return n; });
      toast.success(`Prix wilaya ${code} mis à jour!`);
    } catch {
      toast.error('Erreur mise à jour');
    } finally {
      setSavingDelivery(null);
    }
  }

  const filteredWilayas = WILAYAS.filter(w =>
    w.name.toLowerCase().includes(searchWilaya.toLowerCase()) ||
    w.code.toString().includes(searchWilaya)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-white">Paramètres</h1>
        <p className="text-obsidian-400 font-body text-sm mt-0.5">Configuration globale de la boutique</p>
      </div>

      {/* ── Global Settings ── */}
      <div className="bg-obsidian-800 rounded-2xl border border-obsidian-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-gold-500/10 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-gold-400" />
          </div>
          <h2 className="font-display text-xl text-white">Paramètres généraux</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Store name */}
          <div>
            <label className="block text-sm font-body font-medium text-obsidian-300 mb-1.5">Nom de la boutique</label>
            <input value={storeName} onChange={e => setStoreName(e.target.value)}
              className="w-full bg-obsidian-700 border border-obsidian-600 text-white rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-body font-medium text-obsidian-300 mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1.5 text-green-400" />
              Numéro WhatsApp
            </label>
            <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
              placeholder="213XXXXXXXXX"
              className="w-full bg-obsidian-700 border border-obsidian-600 text-white placeholder-obsidian-500 rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
            <p className="text-xs text-obsidian-500 mt-1 font-body">Format: 213XXXXXXXXX (sans +)</p>
          </div>

          {/* Packaging cost */}
          <div>
            <label className="block text-sm font-body font-medium text-obsidian-300 mb-1.5">
              <Package className="w-3.5 h-3.5 inline mr-1.5 text-purple-400" />
              Coût emballage par commande (DA)
            </label>
            <input type="number" min="0" value={packagingCost}
              onChange={e => setPackagingCost(e.target.value)}
              className="w-full bg-obsidian-700 border border-obsidian-600 text-white rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
            <p className="text-xs text-obsidian-500 mt-1 font-body">Utilisé pour calculer le profit par commande</p>
          </div>
        </div>

        <button onClick={saveGlobalSettings} disabled={savingGlobal}
          className="flex items-center gap-2 mt-6 btn-gold px-6 py-2.5 rounded-xl font-body font-medium text-sm disabled:opacity-60">
          <Save className="w-4 h-4" />
          {savingGlobal ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </button>
      </div>

      {/* ── Delivery Prices ── */}
      <div className="bg-obsidian-800 rounded-2xl border border-obsidian-700 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 border-b border-obsidian-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-display text-xl text-white">Prix de livraison par wilaya</h2>
              <p className="text-obsidian-400 text-xs font-body">69 wilayas d&apos;Algérie</p>
            </div>
          </div>
          <input
            value={searchWilaya}
            onChange={e => setSearchWilaya(e.target.value)}
            placeholder="Rechercher wilaya..."
            className="bg-obsidian-700 border border-obsidian-600 text-white placeholder-obsidian-500 rounded-xl px-4 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-obsidian-700">
                {['#', 'Wilaya', 'Domicile (DA)', 'Bureau (DA)', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-body font-medium text-obsidian-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-700/50">
              {loadingDelivery ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-obsidian-700 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : (
                filteredWilayas.slice(0, 69).map(wilaya => {
                  const dp = deliveryPrices.find(p => p.wilaya_code === wilaya.code);
                  const edited = editedPrices[wilaya.code];
                  const homeVal = edited?.home ?? dp?.home_price ?? 400;
                  const officeVal = edited?.office ?? dp?.office_price ?? 300;
                  const isDirty = edited !== undefined;

                  return (
                    <tr key={wilaya.code} className={`hover:bg-obsidian-700/30 transition-colors ${isDirty ? 'bg-gold-500/5' : ''}`}>
                      <td className="px-4 py-3 text-sm text-obsidian-500 font-body">{wilaya.code}</td>
                      <td className="px-4 py-3 text-sm text-white font-body font-medium">{wilaya.name}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number" min="0"
                          value={homeVal}
                          onChange={e => updateLocalPrice(wilaya.code, 'home', e.target.value)}
                          className="w-28 bg-obsidian-700 border border-obsidian-600 text-white rounded-lg px-3 py-1.5 font-body text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number" min="0"
                          value={officeVal}
                          onChange={e => updateLocalPrice(wilaya.code, 'office', e.target.value)}
                          className="w-28 bg-obsidian-700 border border-obsidian-600 text-white rounded-lg px-3 py-1.5 font-body text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {isDirty && (
                          <button
                            onClick={() => saveWilayaPrice(wilaya.code)}
                            disabled={savingDelivery === wilaya.code.toString()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/20 text-gold-400 border border-gold-500/30 rounded-lg text-xs font-body hover:bg-gold-500/30 transition-colors disabled:opacity-50">
                            {savingDelivery === wilaya.code.toString()
                              ? <RefreshCw className="w-3 h-3 animate-spin" />
                              : <Save className="w-3 h-3" />}
                            Sauv.
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
