'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, ShoppingBag, Star, Zap, Package, Minus, Plus, Palette, ShoppingCart } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatDA, getPromoPrice, getEffectivePrice } from '@/lib/calculations';
import { useCartContext } from '@/lib/CartContext';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { id }          = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity]     = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const { addItem, totalItems }     = useCartContext();

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => {
        setProduct(d.product);
        if (d.product?.color_options?.length) setSelectedColor(d.product.color_options[0]);
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

  const images        = product.images?.length ? product.images : (product.image_url ? [product.image_url] : []);
  const outOfStock    = product.stock === 0;
  const maxQty        = Math.min(product.stock, 10);
  const promoPrice    = getPromoPrice(product);
  const effectivePrice = getEffectivePrice(product);
  const hasPromo      = promoPrice !== null;
  const hasColors     = (product.color_options?.length ?? 0) > 0;
  const canAdd        = !outOfStock && (!hasColors || !!selectedColor);

  function handleAddToCart() {
    if (!canAdd) return;
    addItem({
      productId:      product!.id,
      name:           product!.name,
      image_url:      product!.image_url,
      selling_price:  effectivePrice,
      original_price: product!.selling_price,
      purchase_price: product!.purchase_price,
      quantity,
      selectedColor:  selectedColor || undefined,
      promo_type:     product!.promo_type,
      promo_value:    product!.promo_value,
      color_options:  product!.color_options,
    });
    toast.success(`${product!.name} ajouté au panier!`);
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="sticky top-0 z-50 bg-obsidian-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/shop" className="flex items-center gap-2 text-obsidian-300 hover:text-white transition-colors font-body text-sm">
              <ArrowLeft className="w-4 h-4" /> Retour
            </Link>
            <Link href="/shop" className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold-500" />
              <span className="font-display text-xl text-gold-400 tracking-wider">PRIME WATCHES</span>
            </Link>
            <Link href="/cart" className="relative flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 text-gold-400 px-3 py-1.5 rounded-xl text-sm font-body">
              <ShoppingCart className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
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
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />)}
              <span className="text-sm text-obsidian-400 font-body ml-1">Qualité garantie</span>
            </div>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className={`font-display text-4xl font-semibold ${hasPromo ? 'text-red-500' : 'text-gold-600'}`}>
                  {formatDA(effectivePrice * quantity)}
                </span>
                {hasPromo && (
                  <span className="font-display text-xl text-obsidian-400 line-through">{formatDA(product.selling_price * quantity)}</span>
                )}
                {quantity > 1 && <span className="text-sm text-obsidian-400 font-body">({formatDA(effectivePrice)} × {quantity})</span>}
              </div>
              {hasPromo && <p className="text-sm text-red-500 font-body font-medium">🎉 Vous économisez {formatDA((product.selling_price - effectivePrice) * quantity)}</p>}
            </div>

            {product.description && <p className="text-obsidian-600 font-body leading-relaxed">{product.description}</p>}

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

            {/* Color Selector */}
            {hasColors && !outOfStock && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-obsidian-600" />
                  <label className="text-sm font-body font-medium text-obsidian-700">
                    Couleur {selectedColor && <span className="ml-2 text-gold-600 font-semibold">{selectedColor}</span>}
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.color_options!.map(color => (
                    <button key={color} onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-xl text-sm font-body font-medium border-2 transition-all ${
                        selectedColor === color
                          ? 'border-gold-500 bg-gold-50 text-obsidian-800 shadow-md'
                          : 'border-obsidian-200 bg-white text-obsidian-600 hover:border-obsidian-400'
                      }`}>
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {!outOfStock && (
              <div>
                <label className="block text-sm font-body font-medium text-obsidian-700 mb-2">Quantité</label>
                <div className="flex items-center gap-0 w-fit border border-obsidian-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}
                    className="w-12 h-12 flex items-center justify-center text-obsidian-600 hover:bg-obsidian-50 transition-colors disabled:opacity-30">
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="w-14 h-12 flex items-center justify-center font-display text-xl text-obsidian-900 border-x border-obsidian-200 select-none">
                    {quantity}
                  </div>
                  <button onClick={() => setQuantity(q => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty}
                    className="w-12 h-12 flex items-center justify-center text-obsidian-600 hover:bg-obsidian-50 transition-colors disabled:opacity-30">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* CTAs */}
            {outOfStock ? (
              <button disabled className="w-full py-4 rounded-xl bg-obsidian-100 text-obsidian-400 font-body font-semibold text-lg cursor-not-allowed">
                Rupture de stock
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Add to cart */}
                <button onClick={handleAddToCart} disabled={!canAdd}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-body font-semibold text-lg transition-all ${
                    !canAdd ? 'bg-obsidian-100 text-obsidian-400 cursor-not-allowed'
                    : hasPromo ? 'bg-red-500 hover:bg-red-600 text-white hover:shadow-xl'
                    : 'btn-gold hover:shadow-xl'
                  }`}>
                  <ShoppingCart className="w-5 h-5" />
                  Ajouter au panier
                </button>
                {/* Go to cart if items */}
                {totalItems > 0 && (
                  <Link href="/cart"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-obsidian-200 text-obsidian-700 font-body font-medium text-base hover:border-gold-400 transition-all">
                    <ShoppingBag className="w-4 h-4" />
                    Voir le panier ({totalItems})
                  </Link>
                )}
              </div>
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
          {[1/4, 3/4, 1/3, 1, 40/100, 56/100].map((w, i) => (
            <div key={i} className="h-8 bg-obsidian-100 rounded" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
