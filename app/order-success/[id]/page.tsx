'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle, Clock, Package, Truck, Phone, MessageCircle } from 'lucide-react';
import type { Order } from '@/lib/types';
import { formatDA } from '@/lib/calculations';

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [oRes, sRes] = await Promise.all([
          fetch(`/api/orders/${id}`),
          fetch('/api/settings'),
        ]);
        const [oData, sData] = await Promise.all([oRes.json(), sRes.json()]);
        setOrder(oData.order);
        setWhatsapp(sData.settings?.whatsapp_number || '');
      } catch {}
    }
    load();
  }, [id]);

  const waMsg = order
    ? `Bonjour, j'ai passé une commande #${order.id.slice(0, 8)} pour ${order.product_name}. Pouvez-vous confirmer?`
    : '';
  const waUrl = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(waMsg)}` : '#';

  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gold-100">
          {/* Top Banner */}
          <div className="bg-obsidian-900 px-8 py-10 text-center">
            <div className="w-20 h-20 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-gold-400" />
            </div>
            <h1 className="font-display text-3xl text-white mb-2">Commande Confirmée!</h1>
            <p className="font-body text-obsidian-300 text-sm">
              Merci pour votre confiance. Nous vous contacterons bientôt.
            </p>
          </div>

          <div className="p-8 space-y-6">
            {order ? (
              <>
                {/* Order details */}
                <div className="bg-obsidian-50 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-gold-500" />
                    <p className="text-xs text-obsidian-400 font-body font-medium uppercase tracking-wider">
                      Commande #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  {[
                    { label: 'Produit', value: order.product_name },
                    { label: 'Client', value: order.customer_name },
                    { label: 'Téléphone', value: order.customer_phone, icon: <Phone className="w-3 h-3" /> },
                    { label: 'Wilaya', value: `${order.wilaya_name} (${order.delivery_type === 'home' ? 'Domicile' : 'Bureau'})` },
                    { label: 'Livraison', value: formatDA(order.delivery_cost) },
                    { label: 'Total à payer', value: formatDA(order.total_price), bold: true },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center text-sm font-body">
                      <span className="text-obsidian-500">{row.label}</span>
                      <span className={row.bold ? 'font-semibold text-gold-600 text-base' : 'text-obsidian-700 font-medium'}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  <p className="text-sm font-body font-medium text-obsidian-600 uppercase tracking-wider">Prochaines étapes</p>
                  {[
                    { icon: Phone, text: 'Notre équipe vous appellera pour confirmer la commande', color: 'text-blue-500' },
                    { icon: Package, text: 'Votre montre sera emballée soigneusement', color: 'text-purple-500' },
                    { icon: Truck, text: 'Livraison à votre adresse — payez à la réception!', color: 'text-green-500' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 bg-obsidian-50 rounded-xl p-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-white shadow-sm flex-shrink-0`}>
                        <step.icon className={`w-4 h-4 ${step.color}`} />
                      </div>
                      <p className="text-sm text-obsidian-600 font-body">{step.text}</p>
                    </div>
                  ))}
                </div>

                {/* WhatsApp CTA */}
                {whatsapp && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border-2 border-[#25D366] text-[#25D366] font-body font-medium hover:bg-[#25D366] hover:text-white transition-all">
                    <MessageCircle className="w-5 h-5" />
                    Contacter via WhatsApp
                  </a>
                )}
              </>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-obsidian-400 font-body text-sm">Chargement des détails...</p>
              </div>
            )}

            <Link href="/shop"
              className="block w-full text-center py-3.5 bg-obsidian-900 text-white rounded-xl font-body font-medium hover:bg-obsidian-700 transition-colors">
              Continuer vos achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
