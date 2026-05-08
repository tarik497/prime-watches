'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Clock, MapPin, User, Home, Building2, Package, ChevronDown, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product, DeliveryPrice, DeliveryType } from '@/lib/types';
import { formatDA, calculateOrderTotal } from '@/lib/calculations';
import { WILAYAS } from '@/lib/wilayas';

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [product, setProduct] = useState<Product | null>(null);
  const [deliveryPrices, setDeliveryPrices] = useState<Record<number, DeliveryPrice>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Read quantity from URL param, default to 1
  const [quantity, setQuantity] = useState(() => {
    const q = parseInt(searchParams.get('qty') || '1', 10);
    return isNaN(q) || q < 1 ? 1 : q;
  });

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    wilaya_code: '',
    delivery_type: 'home' as DeliveryType,
    notes: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const [pRes, dRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch('/api/delivery'),
        ]);
        const [pData, dData] = await Promise.all([pRes.json(), dRes.json()]);
        setProduct(pData.product);
        const indexed: Record<number, DeliveryPrice> = {};
        (dData.prices || [])
          .filter((p: DeliveryPrice) => p.is_active !== false)
          .forEach((p: DeliveryPrice) => { indexed[p.wilaya_code] = p; });
        setDeliveryPrices(indexed);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Clamp quantity to stock once product is loaded
  useEffect(() => {
    if (product) {
      setQuantity(q => Math.min(q, product.stock));
    }
  }, [product]);

  const selectedWilaya = form.wilaya_code ? deliveryPrices[Number(form.wilaya_code)] : null;
  const deliveryCost = selectedWilaya
    ? (form.delivery_type === 'home' ? selectedWilaya.home_price : selectedWilaya.office_price)
    : 0;
  const total = product ? calculateOrderTotal(product.selling_price, deliveryCost, quantity) : 0;

  const maxQty = product ? Math.min(product.stock, 10) : 10;

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    if (!form.wilaya_code) { toast.error('Veuillez choisir votre wilaya'); return; }
    if (!form.customer_name.trim()) { toast.error('Nom requis'); return; }
    if (!form.customer_phone.trim()) { toast.error('Téléphone requis'); return; }
    if (!form.customer_address.trim()) { toast.error('Adresse requise'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          wilaya_code: Number(form.wilaya_code),
          product_id: product.id,
          quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la commande');
      toast.success('Commande passée avec succès!');
      router.push(`/order-success/${data.order.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSkeleton />;
  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
      <div className="text-center">
        <p className="font-display text-2xl text-obsidian-500 mb-4">Produit introuvable</p>
        <Link href="/shop" className="text-gold-500 hover:underline">Retour boutique</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="bg-obsidian-900 text-white shadow-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href={`/product/${product.id}`} className="flex items-center gap-2 text-obsidian-300 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" /> Retour
            </Link>
            <span className="font-display text-xl text-gold-400 tracking-wider">Finaliser la commande</span>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── Form ── */}
            <div className="lg:col-span-3 space-y-6">
              {/* Customer Info */}
              <FormSection title="Vos informations" icon={<User className="w-5 h-5 text-gold-500" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Nom complet *"
                    value={form.customer_name}
                    onChange={v => update('customer_name', v)}
                    placeholder="Votre nom et prénom"
                    required
                  />
                  <InputField
                    label="Numéro de téléphone *"
                    type="tel"
                    value={form.customer_phone}
                    onChange={v => update('customer_phone', v)}
                    placeholder="05XXXXXXXX"
                    required
                  />
                </div>
                <InputField
                  label="Adresse complète *"
                  value={form.customer_address}
                  onChange={v => update('customer_address', v)}
                  placeholder="Rue, quartier, commune..."
                  required
                />
              </FormSection>

              {/* Delivery Info */}
              <FormSection title="Informations de livraison" icon={<MapPin className="w-5 h-5 text-gold-500" />}>
                {/* Wilaya Select */}
                <div>
                  <label className="block text-sm font-body font-medium text-obsidian-700 mb-1.5">
                    Wilaya <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.wilaya_code}
                      onChange={e => update('wilaya_code', e.target.value)}
                      required
                      className="w-full appearance-none bg-white border border-obsidian-200 rounded-xl px-4 py-3 pr-10 font-body text-obsidian-700 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent">
                      <option value="">-- Choisissez votre wilaya --</option>
                      {WILAYAS.map(w => (
                        <option key={w.code} value={w.code}>
                          {w.code} - {w.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-obsidian-400 pointer-events-none" />
                  </div>
                </div>

                {/* Delivery Type */}
                <div>
                  <label className="block text-sm font-body font-medium text-obsidian-700 mb-2">
                    Type de livraison <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'home',   icon: Home,      label: 'À domicile',          sub: selectedWilaya ? formatDA(selectedWilaya.home_price)   : '—' },
                      { value: 'office', icon: Building2, label: 'Bureau / Point relais', sub: selectedWilaya ? formatDA(selectedWilaya.office_price) : '—' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('delivery_type', opt.value)}
                        className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all font-body ${
                          form.delivery_type === opt.value
                            ? 'border-gold-500 bg-gold-50 text-obsidian-800'
                            : 'border-obsidian-200 bg-white text-obsidian-500 hover:border-obsidian-300'
                        }`}>
                        <opt.icon className={`w-6 h-6 mb-1 ${form.delivery_type === opt.value ? 'text-gold-500' : 'text-obsidian-400'}`} />
                        <span className="text-sm font-medium">{opt.label}</span>
                        <span className={`text-xs mt-0.5 ${form.delivery_type === opt.value ? 'text-gold-600 font-semibold' : 'text-obsidian-400'}`}>
                          {opt.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-body font-medium text-obsidian-700 mb-1.5">Notes (optionnel)</label>
                  <textarea
                    value={form.notes}
                    onChange={e => update('notes', e.target.value)}
                    rows={2}
                    placeholder="Instructions de livraison, commentaires..."
                    className="w-full bg-white border border-obsidian-200 rounded-xl px-4 py-3 font-body text-obsidian-700 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
                  />
                </div>
              </FormSection>
            </div>

            {/* ── Order Summary ── */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-obsidian-100 overflow-hidden">
                {/* Product image */}
                <div className="relative h-48 bg-gradient-to-br from-obsidian-50 to-obsidian-100">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Clock className="w-16 h-16 text-obsidian-300" />
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-xs text-gold-500 font-body uppercase tracking-wider mb-1">Votre commande</p>
                    <h3 className="font-display text-xl text-obsidian-800">{product.name}</h3>
                  </div>

                  {/* Quantity selector inside summary */}
                  <div>
                    <label className="block text-xs font-body font-medium text-obsidian-500 mb-2 uppercase tracking-wider">
                      Quantité
                    </label>
                    <div className="flex items-center gap-0 w-fit border border-obsidian-200 rounded-xl overflow-hidden bg-obsidian-50">
                      <button
                        type="button"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-10 flex items-center justify-center text-obsidian-600 hover:bg-obsidian-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-12 h-10 flex items-center justify-center font-display text-lg text-obsidian-900 border-x border-obsidian-200 select-none">
                        {quantity}
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                        disabled={quantity >= maxQty}
                        className="w-10 h-10 flex items-center justify-center text-obsidian-600 hover:bg-obsidian-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="space-y-2 border-t border-obsidian-100 pt-4">
                    <div className="flex justify-between text-sm font-body text-obsidian-600">
                      <span>Prix unitaire</span>
                      <span>{formatDA(product.selling_price)}</span>
                    </div>
                    {quantity > 1 && (
                      <div className="flex justify-between text-sm font-body text-obsidian-600">
                        <span>Sous-total ({quantity} articles)</span>
                        <span>{formatDA(product.selling_price * quantity)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-body text-obsidian-600">
                      <span>Livraison ({form.delivery_type === 'home' ? 'Domicile' : 'Bureau'})</span>
                      <span className={deliveryCost > 0 ? 'text-obsidian-700' : 'text-obsidian-400'}>
                        {form.wilaya_code ? formatDA(deliveryCost) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between font-body font-semibold text-lg text-obsidian-900 border-t border-obsidian-100 pt-2">
                      <span>Total</span>
                      <span className="text-gold-600">{form.wilaya_code ? formatDA(total) : '—'}</span>
                    </div>
                  </div>

                  {/* Cash on delivery badge */}
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                    <Package className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-xs text-green-700 font-body">Paiement à la livraison — aucun paiement en ligne requis</p>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting || !form.wilaya_code}
                    className="w-full btn-gold py-4 rounded-xl font-body font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:shadow-lg">
                    {submitting ? 'Envoi en cours...' : `Confirmer la commande${quantity > 1 ? ` (${quantity} articles)` : ''}`}
                  </button>

                  <p className="text-xs text-center text-obsidian-400 font-body">
                    En commandant, vous acceptez nos conditions de vente
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-obsidian-100 p-6">
      <h2 className="font-display text-xl text-obsidian-800 mb-5 flex items-center gap-2">
        {icon} {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function InputField({
  label, value, onChange, placeholder, required = false, type = 'text'
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-body font-medium text-obsidian-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-white border border-obsidian-200 rounded-xl px-4 py-3 font-body text-obsidian-700 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent placeholder-obsidian-300"
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#fafaf8] animate-pulse">
      <div className="h-16 bg-obsidian-900" />
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="h-48 bg-obsidian-100 rounded-2xl" />
          <div className="h-64 bg-obsidian-100 rounded-2xl" />
        </div>
        <div className="lg:col-span-2">
          <div className="h-96 bg-obsidian-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
