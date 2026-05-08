'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Clock, ShoppingBag, Star, ChevronRight, Zap } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatDA } from '@/lib/calculations';

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
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
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-obsidian-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/shop" className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-gold-500" />
              <span className="font-display text-2xl font-semibold tracking-wider text-gold-400">
                PRIME WATCHES
              </span>
            </Link>
            <div className="text-sm text-gold-500 font-body hidden sm:block">
              Livraison partout en Algérie
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
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

      {/* ── Search Bar ── */}
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

      {/* ── Product Grid ── */}
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

      {/* ── Footer ── */}
      {/* ── Footer ── */}
<footer className="bg-obsidian-900 text-obsidian-300 py-10 mt-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Logo */}
    <div className="text-center mb-8">
      <Clock className="w-8 h-8 text-gold-400 mx-auto mb-3" />
      <p className="font-display text-xl text-gold-400 mb-1">PRIME WATCHES</p>
      <p className="text-sm font-body">Paiement à la livraison · Livraison dans les 58 wilayas</p>
    </div>

    {/* WhatsApp Numbers */}
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
      <a href="https://wa.me/213561985935" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] px-5 py-2.5 rounded-xl hover:bg-[#25D366]/20 transition-all font-body text-sm">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        +213 561985935
      </a>
      <a href="https://wa.me/213556349158" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] px-5 py-2.5 rounded-xl hover:bg-[#25D366]/20 transition-all font-body text-sm">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        +213 556349158
      </a>
    </div>

    {/* Social Icons */}
    <div className="flex items-center justify-center gap-5 mb-8">
      {/* Facebook */}
      <a href="https://www.facebook.com/profile.php?id=61588814234463" target="_blank" rel="noopener noreferrer"
        className="w-10 h-10 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/30 flex items-center justify-center hover:bg-[#1877F2]/20 transition-all">
        <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </a>
      {/* Instagram */}
      <a href="https://www.instagram.com/primewatches752026/" target="_blank" rel="noopener noreferrer"
        className="w-10 h-10 rounded-xl bg-[#E4405F]/10 border border-[#E4405F]/30 flex items-center justify-center hover:bg-[#E4405F]/20 transition-all">
        <svg className="w-5 h-5 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      </a>
      {/* TikTok */}
      <a href="https://www.tiktok.com/@prime_watches_dz" target="_blank" rel="noopener noreferrer"
        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z"/>
        </svg>
      </a>
    </div>

    <p className="text-xs text-center text-obsidian-500 font-body">
      © {new Date().getFullYear()} Prime Watches. Tous droits réservés.
    </p>
  </div>
</footer>
    </div>
  );
}

// ── Product Card Component ──────────────────────────────────
function ProductCard({ product, index }: { product: Product; index: number }) {
  const margin = Math.round(((product.selling_price - product.purchase_price) / product.selling_price) * 100);

  return (
    <Link href={`/product/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-obsidian-100 hover:shadow-xl hover:border-gold-300 transition-all duration-300"
      style={{ animationDelay: `${index * 50}ms` }}>
      {/* Image */}
      <div className="relative h-56 bg-gradient-to-br from-obsidian-50 to-obsidian-100 overflow-hidden">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Clock className="w-16 h-16 text-obsidian-300" />
          </div>
        )}
        {/* Stock badge */}
        {product.stock <= 3 && product.stock > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-body font-medium px-2 py-1 rounded-full">
            Plus que {product.stock}!
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-obsidian-900/60 flex items-center justify-center">
            <span className="text-white font-body text-sm bg-obsidian-700 px-4 py-2 rounded-full">Rupture de stock</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        <h3 className="font-display text-lg text-obsidian-800 mb-1 line-clamp-2 group-hover:text-gold-600 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-obsidian-400 font-body line-clamp-2 mb-3">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="font-display text-xl font-semibold text-gold-600">{formatDA(product.selling_price)}</span>
          <span className="flex items-center gap-1 text-xs text-obsidian-500 font-body group-hover:text-gold-500 transition-colors">
            Commander <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
