'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, ShoppingBag, Star, Zap, ChevronRight, Package, Minus, Plus, Palette } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatDA, getPromoPrice, getEffectivePrice } from '@/lib/calculations';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct]       = useState<Product | null>(null);
  const [loading, setLoading]       = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity]     = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => {
        setProduct(d.product);
        // Pre-select first color if available
        if (d.product?.color_options?.length) {
          setSelectedColor(d.product.color_options[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
      <div className="text-center">
        <Clock className="w-16 h-16 text-obsidian-200 mx-auto mb-4" />
        <p className="font-display text-2xl text-obsidian-500 mb-4">Produit introuvable</p>
        <Link href="/shop" className="text-gold-500 hover:underline font-body">← Retour boutique</Link>
      </div>
    </div>
  );

  const images = product.images?.length ? product.images : (product.image_url ? [product.image_url] : []);
  const outOfStock  = product.stock === 0;
  const maxQty      = Math.min(product.stock, 10);
  const promoPrice  = getPromoPrice(product);
  const effectivePrice = getEffectivePrice(product);
  const hasPromo    = promoPrice !== null;
  const hasColors   = (product.color_options?.length ?? 0) > 0;
  const colorChosen = !hasColors || !!selectedColor;

  // Build checkout URL
  const checkoutUrl = `/checkout/${product.id}?qty=${quantity}${selectedColor ? `&color=${encodeURIComponent(selectedColor)}` : ''}`;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="sticky top-0 z-50 bg-obsidian-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/shop" className="flex items-center gap-2 text-obsidian-300 hover:text-white transition-colors font-body text-sm">
              <ArrowLeft className="w-4 h-4" /> Retour boutique
            </Link>
            <Link href="/shop" className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold-500" />
              <span className="font-display text-xl text-gold-400 tracking-wider">PRIME WATCHES</span>
            </Link>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gradient-to-br from-obsidian-50 to-obsidian-100 rounded-2xl overflow-hidden shadow-lg">
              {images[selectedImage] ? (
                <Image src={images[selectedImage]} alt={product.name} fill className="object-cover" priority />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Clock className="w-24 h-24 text-obsidian-200" />
                </div>
              )}
              {hasPromo && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-body font-bold px-3 py-1.5 rounded-full shadow-lg">
                  {product.promo_type === 'percentage' ? `-${product.promo_value}%` : `-${formatDA(product.promo_value!)}`}
                </div>
              )}
              {outOfStock && (
                <div className="absolute inset-0 bg-obsidian-900/60 flex items-center justify-center">
                  <span className="text-white font-body text-lg bg-obsidian-700 px-6 py-3 rounded-full">Rupture de stock</span>
                </div>
              )}
              {!outOfStock && product.stock <= 3 && (
                <span className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-body font-medium px-3 py-1.5 rounded-full">
                  Plus que {product.stock}!
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-gold-500 shadow-md' : 'border-obsidian-200 opacity-60 hover:opacity-100'
                    }`}>
                    <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-start space-y-6">
            {product.category && (
              <p className="text-gold-500 font-body text-sm uppercase tracking-[0.2em]">{product.category}</p>
            )}

            <h1 className="font-display text-4xl text-obsidian-900 leading-tight">{product.name}</h1>

            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />
              ))}
              <span className="text-sm text-obsidian-400 font-body ml-1">Qualité garantie</span>
            </div>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className={`font-display text-4xl font-semibold ${hasPromo ? 'text-red-500' : 'text-gold-600'}`}>
                  {formatDA(effectivePrice * quantity)}
                </span>
                {hasPromo && (
                  <span className="font-display text-xl text-obsidian-400 line-through">
                    {formatDA(product.selling_price * quantity)}
                  </span>
                )}
                {quantity > 1 && (
                  <span className="text-sm text-obsidian-400 font-body">
                    ({formatDA(effectivePrice)} × {quantity})
                  </span>
                )}
              </div>
              {hasPromo && (
                <p className="text-sm text-red-500 font-body font-medium">
                  🎉 Vous économisez {formatDA((product.selling_price - effectivePrice) * quantity)}
                </p>
              )}
            </div>

            {product.description && (
              <p className="text-obsidian-600 font-body leading-relaxed text-base">{product.description}</p>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Zap,     label: 'Livraison rapide',   sub: 'Partout en Algérie' },
                { icon: Package, label: 'Paiement livraison', sub: 'Aucun risque' },
                { icon: Star,    label: 'Qualité garantie',   sub: 'Authentique' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-obsidian-50 border border-obsidian-100 rounded-xl p-3 text-center">
                  <Icon className="w-5 h-5 text-gold-500 mx-auto mb-1" />
                  <p className="text-xs font-body font-semibold text-obsidian-700">{label}</p>
                  <p className="text-xs font-body text-obsidian-400">{sub}</p>
                </div>
              ))}
            </div>

            {/* ── Color Selector ── */}
            {hasColors && !outOfStock && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-obsidian-600" />
                  <label className="text-sm font-body font-medium text-obsidian-700">
                    Couleur
                    {selectedColor && <span className="ml-2 text-gold-600 font-semibold">{selectedColor}</span>}
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.color_options!.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-xl text-sm font-body font-medium border-2 transition-all ${
                        selectedColor === color
                          ? 'border-gold-500 bg-gold-50 text-obsidian-800 shadow-md'
                          : 'border-obsidian-200 bg-white text-obsidian-600 hover:border-obsidian-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
                {!selectedColor && (
                  <p className="text-xs text-red-500 font-body mt-2">Veuillez choisir une couleur</p>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            {!outOfStock && (
              <div>
                <label className="block text-sm font-body font-medium text-obsidian-700 mb-2">Quantité</label>
                <div className="flex items-center gap-0 w-fit border border-obsidian-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}
                    className="w-12 h-12 flex items-center justify-center text-obsidian-600 hover:bg-obsidian-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="w-14 h-12 flex items-center justify-center font-display text-xl text-obsidian-900 border-x border-obsidian-200 select-none">
                    {quantity}
                  </div>
                  <button onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty}
                    className="w-12 h-12 flex items-center justify-center text-obsidian-600 hover:bg-obsidian-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {product.stock <= 10 && (
                  <p className="text-xs text-obsidian-400 font-body mt-1.5">
                    {product.stock} unité{product.stock > 1 ? 's' : ''} disponible{product.stock > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            {outOfStock ? (
              <button disabled className="w-full py-4 rounded-xl bg-obsidian-100 text-obsidian-400 font-body font-semibold text-lg cursor-not-allowed">
                Rupture de stock
              </button>
            ) : (
              <Link
                href={colorChosen ? checkoutUrl : '#'}
                onClick={e => { if (!colorChosen) { e.preventDefault(); } }}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-body font-semibold text-lg transition-all ${
                  !colorChosen
                    ? 'bg-obsidian-200 text-obsidian-400 cursor-not-allowed'
                    : hasPromo
                      ? 'bg-red-500 hover:bg-red-600 text-white hover:shadow-xl'
                      : 'btn-gold hover:shadow-xl'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                Commander {quantity > 1 ? `(${quantity} articles)` : 'maintenant'}
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}

            {!outOfStock && product.stock > 10 && (
              <p className="text-center text-sm text-obsidian-400 font-body">✓ En stock — Expédition rapide</p>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-obsidian-900 text-obsidian-400 text-center py-6 mt-16 font-body text-sm">
        © {new Date().getFullYear()} Prime Watches · Paiement à la livraison · Livraison dans les 58 wilayas
      </footer>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#fafaf8] animate-pulse">
      <div className="h-16 bg-obsidian-900" />
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-square bg-obsidian-100 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-4 bg-obsidian-100 rounded w-1/4" />
          <div className="h-10 bg-obsidian-100 rounded w-3/4" />
          <div className="h-8 bg-obsidian-100 rounded w-1/3" />
          <div className="h-24 bg-obsidian-100 rounded" />
          <div className="h-12 bg-obsidian-100 rounded w-40" />
          <div className="h-14 bg-obsidian-100 rounded" />
        </div>
      </div>
    </div>
  );
}
