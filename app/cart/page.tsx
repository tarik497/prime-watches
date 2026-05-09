'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Clock, ShoppingCart, Trash2, Minus, Plus,
  User, Phone, MapPin, Home, Building2, ChevronDown, Package, ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartContext } from '@/lib/CartContext';
import type { DeliveryPrice, DeliveryType } from '@/lib/types';
import { formatDA } from '@/lib/calculations';
import { WILAYAS } from '@/lib/wilayas';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCartContext();

  const [deliveryPrices, setDeliveryPrices] = useState<Record<number, DeliveryPrice>>({});
  const [submitting, setSubmitting]         = useState(false);
  const [step, setStep]                     = useState<'cart' | 'checkout'>('cart');

  const [form, setForm] = useState({
    customer_name:    '',
    customer_phone:   '',
    customer_address: '',
    wilaya_code:      '',
    delivery_type:    'home' as DeliveryType,
    notes:            '',
  });

  useEffect(() => {
    fetch('/api/delivery')
      .then(r => r.json())
      .then(d => {
        const indexed: Record<number, DeliveryPrice> = {};
        (d.prices || [])
          .filter((p: DeliveryPrice) => p.is_active !== false)
          .forEach((p: DeliveryPrice) => { indexed[p.wilaya_code] = p; });
        setDeliveryPrices(indexed);
      });
  }, []);

  const selectedWilaya  = form.wilaya_code ? deliveryPrices[Number(form.wilaya_code)] : null;
  const deliveryCost    = selectedWilaya
    ? (form.delivery_type === 'home' ? selectedWilaya.home_price : selectedWilaya.office_price)
    : 0;
  const orderTotal      = totalPrice + deliveryCost;

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.wilaya_code)      { toast.error('Choisissez votre wilaya'); return; }
    if (!form.customer_name)    { toast.error('Nom requis'); return; }
    if (!form.customer_phone)   { toast.error('Téléphone requis'); return; }
    if (!form.customer_address) { toast.error('Adresse requise'); return; }
    if (items.length === 0)     { toast.error('Panier vide'); return; }

    setSubmitting(true);
    try {
      // Submit each cart item as a separate order
      const orderIds: string[] = [];
      for (const item of items) {
        const res = await fetch('/api/orders', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name:    form.customer_name,
            customer_phone:   form.customer_phone,
            customer_address: form.customer_address,
            wilaya_code:      Number(form.wilaya_code),
            delivery_type:    form.delivery_type,
            notes:            form.notes || undefined,
            product_id:       item.productId,
            quantity:         item.quantity,
            selected_color:   item.selectedColor || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur commande');
        orderIds.push(data.order.id);
      }

      clearCart();
      toast.success('Commande passée avec succès!');
      // Redirect to success page with first order id
      router.push(`/order-success/${orderIds[0]}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0 && step === 'cart') {
    return (
      <div className="min-h-screen bg-[#fafaf8]">
        <Header totalItems={0} />
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <ShoppingCart className="w-20 h-20 text-obsidian-200 mx-auto mb-6" />
          <h2 className="font-display text-3xl text-obsidian-600 mb-3">Votre panier est vide</h2>
          <p className="text-obsidian-400 font-body mb-8">Ajoutez des montres à votre panier pour continuer.</p>
          <Link href="/shop" className="btn-gold px-8 py-3 rounded-xl font-body font-semibold inline-flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" /> Voir la boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <Header totalItems={totalItems} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Steps */}
        <div className="flex items-center gap-3 mb-8 font-body text-sm">
          <button onClick={() => setStep('cart')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${step === 'cart' ? 'bg-obsidian-800 text-white' : 'text-obsidian-400 hover:text-obsidian-700'}`}>
            <ShoppingCart className="w-4 h-4" /> Panier ({totalItems})
          </button>
          <span className="text-obsidian-300">→</span>
          <button onClick={() => items.length > 0 && setStep('checkout')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${step === 'checkout' ? 'bg-obsidian-800 text-white' : 'text-obsidian-400 hover:text-obsidian-700'}`}>
            <Package className="w-4 h-4" /> Commander
          </button>
        </div>

        {step === 'cart' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <div key={`${item.productId}-${item.selectedColor}`}
                  className="bg-white rounded-2xl border border-obsidian-100 shadow-sm p-4 flex gap-4">
                  {/* Image */}
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-obsidian-50">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Clock className="w-8 h-8 text-obsidian-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg text-obsidian-800 truncate">{item.name}</h3>
                    {item.selectedColor && (
                      <span className="inline-block text-xs bg-obsidian-100 text-obsidian-600 px-2.5 py-1 rounded-full font-body mt-1">
                        {item.selectedColor}
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`font-body font-semibold ${item.selling_price < item.original_price ? 'text-red-500' : 'text-gold-600'}`}>
                        {formatDA(item.selling_price)}
                      </span>
                      {item.selling_price < item.original_price && (
                        <span className="text-xs text-obsidian-400 line-through font-body">{formatDA(item.original_price)}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Qty */}
                      <div className="flex items-center gap-0 border border-obsidian-200 rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.productId, item.selectedColor, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-obsidian-500 hover:bg-obsidian-50 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center text-obsidian-800 font-body text-sm border-x border-obsidian-200">
                          {item.quantity}
                        </span>
                        <button onClick={() => updateQuantity(item.productId, item.selectedColor, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-obsidian-500 hover:bg-obsidian-50 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-body font-semibold text-obsidian-800">
                          {formatDA(item.selling_price * item.quantity)}
                        </span>
                        <button onClick={() => removeItem(item.productId, item.selectedColor)}
                          className="text-obsidian-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={clearCart}
                className="text-sm text-obsidian-400 hover:text-red-500 font-body flex items-center gap-1.5 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Vider le panier
              </button>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-obsidian-100 shadow-sm p-5 sticky top-24">
                <h3 className="font-display text-xl text-obsidian-800 mb-4">Récapitulatif</h3>
                <div className="space-y-2 mb-4">
                  {items.map(item => (
                    <div key={`${item.productId}-${item.selectedColor}`} className="flex justify-between text-sm font-body text-obsidian-600">
                      <span className="truncate flex-1 mr-2">{item.name}{item.selectedColor ? ` (${item.selectedColor})` : ''} ×{item.quantity}</span>
                      <span className="flex-shrink-0">{formatDA(item.selling_price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-obsidian-100 pt-2 flex justify-between font-body font-semibold text-obsidian-800">
                    <span>Sous-total</span>
                    <span>{formatDA(totalPrice)}</span>
                  </div>
                  <p className="text-xs text-obsidian-400 font-body">+ Livraison calculée à l&apos;étape suivante</p>
                </div>
                <button onClick={() => setStep('checkout')}
                  className="w-full btn-gold py-3.5 rounded-xl font-body font-semibold flex items-center justify-center gap-2">
                  <Package className="w-4 h-4" /> Passer la commande
                </button>
              </div>
            </div>
          </div>

        ) : (
          /* ── CHECKOUT STEP ── */
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

              {/* Form */}
              <div className="lg:col-span-3 space-y-6">

                {/* Customer info */}
                <FormSection title="Vos informations" icon={<User className="w-5 h-5 text-gold-500" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Nom complet *" value={form.customer_name} onChange={v => update('customer_name', v)} placeholder="Votre nom et prénom" required />
                    <InputField label="Téléphone *" type="tel" value={form.customer_phone} onChange={v => update('customer_phone', v)} placeholder="05XXXXXXXX" required />
                  </div>
                  <InputField label="Adresse *" value={form.customer_address} onChange={v => update('customer_address', v)} placeholder="Rue, quartier, commune..." required />
                </FormSection>

                {/* Delivery */}
                <FormSection title="Livraison" icon={<MapPin className="w-5 h-5 text-gold-500" />}>
                  <div>
                    <label className="block text-sm font-body font-medium text-obsidian-700 mb-1.5">Wilaya *</label>
                    <div className="relative">
                      <select value={form.wilaya_code} onChange={e => update('wilaya_code', e.target.value)} required
                        className="w-full appearance-none bg-white border border-obsidian-200 rounded-xl px-4 py-3 pr-10 font-body text-obsidian-700 focus:outline-none focus:ring-2 focus:ring-gold-400">
                        <option value="">-- Choisissez votre wilaya --</option>
                        {Object.values(deliveryPrices)
                          .sort((a, b) => a.wilaya_code - b.wilaya_code)
                          .map(w => (
                            <option key={w.wilaya_code} value={w.wilaya_code}>
                              {w.wilaya_code} - {w.wilaya_name}
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-obsidian-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-body font-medium text-obsidian-700 mb-2">Type de livraison *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'home',   icon: Home,      label: 'À domicile',           sub: selectedWilaya ? formatDA(selectedWilaya.home_price)   : '—' },
                        { value: 'office', icon: Building2, label: 'Bureau / Point relais', sub: selectedWilaya ? formatDA(selectedWilaya.office_price) : '—' },
                      ].map(opt => (
                        <button key={opt.value} type="button" onClick={() => update('delivery_type', opt.value)}
                          className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all font-body ${
                            form.delivery_type === opt.value
                              ? 'border-gold-500 bg-gold-50 text-obsidian-800'
                              : 'border-obsidian-200 bg-white text-obsidian-500 hover:border-obsidian-300'
                          }`}>
                          <opt.icon className={`w-6 h-6 mb-1 ${form.delivery_type === opt.value ? 'text-gold-500' : 'text-obsidian-400'}`} />
                          <span className="text-sm font-medium">{opt.label}</span>
                          <span className={`text-xs mt-0.5 ${form.delivery_type === opt.value ? 'text-gold-600 font-semibold' : 'text-obsidian-400'}`}>{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-body font-medium text-obsidian-700 mb-1.5">Notes (optionnel)</label>
                    <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2}
                      placeholder="Instructions de livraison..."
                      className="w-full bg-white border border-obsidian-200 rounded-xl px-4 py-3 font-body text-obsidian-700 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none" />
                  </div>
                </FormSection>
              </div>

              {/* Order summary */}
              <div className="lg:col-span-2">
                <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-obsidian-100 p-5 space-y-4">
                  <h3 className="font-display text-xl text-obsidian-800">Votre commande</h3>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {items.map(item => (
                      <div key={`${item.productId}-${item.selectedColor}`} className="flex gap-3">
                        <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-obsidian-50">
                          {item.image_url ? (
                            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-obsidian-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body font-medium text-obsidian-700 truncate">{item.name}</p>
                          {item.selectedColor && <p className="text-xs text-obsidian-400 font-body">{item.selectedColor}</p>}
                          <p className="text-xs text-obsidian-500 font-body">×{item.quantity} · {formatDA(item.selling_price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 border-t border-obsidian-100 pt-3">
                    <div className="flex justify-between text-sm font-body text-obsidian-600">
                      <span>Sous-total articles</span><span>{formatDA(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-body text-obsidian-600">
                      <span>Livraison</span>
                      <span>{form.wilaya_code ? formatDA(deliveryCost) : '—'}</span>
                    </div>
                    <div className="flex justify-between font-body font-semibold text-lg text-obsidian-900 border-t border-obsidian-100 pt-2">
                      <span>Total</span>
                      <span className="text-gold-600">{form.wilaya_code ? formatDA(orderTotal) : '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                    <Package className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-xs text-green-700 font-body">Paiement à la livraison — aucun paiement en ligne</p>
                  </div>

                  <button type="submit" disabled={submitting || !form.wilaya_code}
                    className="w-full btn-gold py-4 rounded-xl font-body font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {submitting
                      ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Envoi...</>
                      : <><ShoppingBag className="w-5 h-5" /> Confirmer la commande</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

function Header({ totalItems }: { totalItems: number }) {
  return (
    <header className="sticky top-0 z-50 bg-obsidian-900 text-white shadow-2xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/shop" className="flex items-center gap-2 text-obsidian-300 hover:text-white transition-colors font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Boutique
          </Link>
          <Link href="/shop" className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-500" />
            <span className="font-display text-xl text-gold-400 tracking-wider">PRIME WATCHES</span>
          </Link>
          <div className="flex items-center gap-1 text-gold-400 font-body text-sm">
            <ShoppingCart className="w-4 h-4" />
            <span>{totalItems}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-obsidian-100 p-6">
      <h2 className="font-display text-xl text-obsidian-800 mb-5 flex items-center gap-2">{icon} {title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, required, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-body font-medium text-obsidian-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full bg-white border border-obsidian-200 rounded-xl px-4 py-3 font-body text-obsidian-700 focus:outline-none focus:ring-2 focus:ring-gold-400 placeholder-obsidian-300" />
    </div>
  );
}
