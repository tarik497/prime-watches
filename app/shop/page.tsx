'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Clock, ShoppingBag, Star, ChevronRight, Zap, ShoppingCart } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatDA, getEffectivePrice, getPromoPrice } from '@/lib/calculations';
import { useCartContext } from '@/lib/CartContext';
import toast from 'react-hot-toast';

export default function ShopPage() {
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { totalItems }                = useCartContext();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const url = debouncedSearch
        ? `/api/products?search=${encodeURIComponent(debouncedSearch)}`
        : '/api/products';
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-obsidian-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/shop" className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-gold-500" />
              <span className="font-display text-2xl font-semibold tracking-wider text-gold-400">PRIME WATCHES</span>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gold-500 font-body hidden sm:block">Livraison partout en Algérie</span>
              <Link href="/cart" className="relative flex items-center gap-2 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-400 px-4 py-2 rounded-xl transition-all font-body text-sm font-medium">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Panier</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-body font-bold">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-obsidian-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #c9a84c 0%, transparent 50%), radial-gradient(circle at 80% 20%, #c9a84c 0%, transparent 40%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <p className="font-body text-gold-400 text-sm uppercase tracking-[0.3em] mb-3">Collection Exclusive</p>
          <h1 className="font-display text-5xl sm:text-7xl font-light leading-tight mb-4">
            L&apos;Art du<br />
            <span className="text-gold-400 italic">Temps Précieux</span>
          </h1>
          <p className="font-body text-obsidian-200 text-lg mb-8 max-w-xl mx-auto">
            Montres de luxe authentiques — Paiement à la livraison — Livraison dans toute l&apos;Algérie
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-obsidian-300">
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-gold-400" /> Livraison rapide</span>
            <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-gold-400" /> Qualité garantie</span>
            <span className="flex items-center gap-1.5"><ShoppingBag className="w-4 h-4 text-gold-400" /> Paiement à la livraison</span>
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-4 border border-gold-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-obsidian-400" />
            <input
              type="text"
              placeholder="Rechercher une montre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-obsidian-700 bg-obsidian-50 rounded-xl border border-obsidian-100 focus:outline-none focus:ring-2 focus:ring-gold-400 font-body"
            />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-obsidian-100 animate-pulse">
                <div className="h-56 bg-obsidian-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-obsidian-100 rounded w-3/4" />
                  <div className="h-4 bg-obsidian-100 rounded w-1/2" />
                  <div className="h-10 bg-obsidian-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <Clock className="w-16 h-16 text-obsidian-200 mx-auto mb-4" />
            <h3 className="font-display text-2xl text-obsidian-400 mb-2">Aucune montre trouvée</h3>
            <p className="font-body text-obsidian-300">Essayez une autre recherche</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-3xl text-obsidian-800">
                {debouncedSearch ? `Résultats pour "${debouncedSearch}"` : 'Notre Collection'}
              </h2>
              <span className="text-sm text-obsidian-400 font-body">{products.length} montres</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Floating cart button on mobile */}
      {totalItems > 0 && (
        <Link href="/cart"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gold-500 text-obsidian-900 px-5 py-3 rounded-2xl shadow-2xl font-body font-bold text-sm hover:bg-gold-400 transition-all sm:hidden">
          <ShoppingCart className="w-5 h-5" />
          Panier · {totalItems}
        </Link>
      )}

      {/* Footer */}
      <footer className="bg-obsidian-900 text-obsidian-300 py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Clock className="w-8 h-8 text-gold-400 mx-auto mb-3" />
          <p className="font-display text-xl text-gold-400 mb-1">PRIME WATCHES</p>
          <p className="text-sm font-body">Paiement à la livraison · Livraison dans les 58 wilayas</p>
          <p className="text-xs text-obsidian-500 font-body mt-4">
            © {new Date().getFullYear()} Prime Watches. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { addItem } = useCartContext();
  const promoPrice    = getPromoPrice(product);
  const effectivePrice = getEffectivePrice(product);
  const hasPromo      = promoPrice !== null;
  const hasColors     = (product.color_options?.length ?? 0) > 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (hasColors) return; // redirect to product page to choose color
    addItem({
      productId:      product.id,
      name:           product.name,
      image_url:      product.image_url,
      selling_price:  effectivePrice,
      original_price: product.selling_price,
      purchase_price: product.purchase_price,
      promo_type:     product.promo_type,
      promo_value:    product.promo_value,
      color_options:  product.color_options,
    });
    toast.success(`${product.name} ajouté au panier!`);
  }

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-obsidian-100 hover:shadow-xl hover:border-gold-300 transition-all duration-300"
      style={{ animationDelay: `${index * 50}ms` }}>

      <Link href={`/product/${product.id}`} className="block">
        <div className="relative h-56 bg-gradient-to-br from-obsidian-50 to-obsidian-100 overflow-hidden">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Clock className="w-16 h-16 text-obsidian-300" />
            </div>
          )}
          {hasPromo && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-body font-bold px-2.5 py-1 rounded-full shadow-md">
              {product.promo_type === 'percentage' ? `-${product.promo_value}%` : `-${formatDA(product.promo_value!)}`}
            </div>
          )}
          {product.stock <= 3 && product.stock > 0 && !hasPromo && (
            <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-body font-medium px-2 py-1 rounded-full">
              Plus que {product.stock}!
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-obsidian-900/60 flex items-center justify-center">
              <span className="text-white font-body text-sm bg-obsidian-700 px-4 py-2 rounded-full">Rupture de stock</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-display text-lg text-obsidian-800 mb-1 line-clamp-2 group-hover:text-gold-600 transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-obsidian-400 font-body line-clamp-2 mb-3">{product.description}</p>
          )}
        </Link>

        <div className="flex items-center justify-between mt-3 mb-3">
          <div className="flex items-baseline gap-2">
            <span className={`font-display text-xl font-semibold ${hasPromo ? 'text-red-500' : 'text-gold-600'}`}>
              {formatDA(effectivePrice)}
            </span>
            {hasPromo && (
              <span className="text-sm text-obsidian-400 line-through font-body">
                {formatDA(product.selling_price)}
              </span>
            )}
          </div>
          <Link href={`/product/${product.id}`} className="flex items-center gap-1 text-xs text-obsidian-400 hover:text-gold-500 transition-colors font-body">
            Voir <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Add to cart or go to product */}
        {product.stock === 0 ? (
          <button disabled className="w-full py-2.5 rounded-xl bg-obsidian-100 text-obsidian-400 text-sm font-body font-medium cursor-not-allowed">
            Rupture de stock
          </button>
        ) : hasColors ? (
          <Link href={`/product/${product.id}`}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-gold text-sm font-body font-medium">
            <ShoppingCart className="w-4 h-4" /> Choisir les options
          </Link>
        ) : (
          <button onClick={handleAddToCart}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-gold text-sm font-body font-medium hover:shadow-md transition-all">
            <ShoppingCart className="w-4 h-4" /> Ajouter au panier
          </button>
        )}
      </div>
    </div>
  );
}
