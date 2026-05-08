'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, ShoppingBag, MessageCircle, Package, Truck, Shield } from 'lucide-react';
import type { Product } from '@/lib/types';
import { formatDA } from '@/lib/calculations';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const allImages = product.images?.length
    ? product.images
    : (product.image_url ? [product.image_url] : []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setProduct(data.product);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <PageSkeleton />;
  if (notFound || !product) return <NotFound />;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Je veux commander: ${product.name} - ${formatDA(product.selling_price)}`)}`;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-obsidian-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-obsidian-300 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" /> Retour
            </button>
            <Link href="/shop" className="font-display text-xl text-gold-400 tracking-wider">PRIME WATCHES</Link>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
        <div className="relative">
          <div className="relative h-96 lg:h-[520px] bg-gradient-to-br from-obsidian-50 to-obsidian-100 rounded-3xl overflow-hidden shadow-2xl">
            {allImages[activeImg] ? (
              <Image src={allImages[activeImg]} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Clock className="w-32 h-32 text-obsidian-200" />
              </div>
            )}
            {/* Navigation arrows */}
            {allImages.length > 1 && (
              <>
                <button onClick={() => setActiveImg(i => (i - 1 + allImages.length) % allImages.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setActiveImg(i => (i + 1) % allImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                  {activeImg + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-gold-500' : 'border-obsidian-200'}`}>
                  <Image src={img} alt={`vue ${i+1}`} width={64} height={64} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>
            {/* Stock ribbon */}
            {product.stock > 0 && product.stock <= 5 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-body font-medium px-3 py-1.5 rounded-full shadow-lg">
                Seulement {product.stock} en stock!
              </div>
            )}
          </div>

          {/* ── Details ── */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <p className="text-gold-500 text-sm font-body uppercase tracking-[0.2em] mb-2">Montre de Luxe</p>
              <h1 className="font-display text-4xl lg:text-5xl text-obsidian-900 leading-tight mb-4">{product.name}</h1>
              {product.description && (
                <p className="font-body text-obsidian-500 text-base leading-relaxed">{product.description}</p>
              )}
            </div>

            {/* Price */}
            <div className="border-t border-b border-obsidian-100 py-5">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-4xl text-gold-600 font-semibold">{formatDA(product.selling_price)}</span>
                <span className="text-obsidian-400 text-sm font-body">Prix de vente</span>
              </div>
              <p className="text-sm text-obsidian-400 font-body mt-1 flex items-center gap-1.5">
                <Truck className="w-4 h-4" /> Frais de livraison calculés selon votre wilaya
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Package, label: 'Emballage soigné' },
                { icon: Truck, label: 'Livraison rapide' },
                { icon: Shield, label: 'Paiement livraison' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="bg-obsidian-50 rounded-xl p-3 text-center">
                  <Icon className="w-5 h-5 text-gold-500 mx-auto mb-1" />
                  <p className="text-xs text-obsidian-600 font-body">{label}</p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            {product.stock > 0 ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/checkout/${product.id}`}
                  className="flex-1 bg-obsidian-900 text-white text-center py-4 px-6 rounded-xl font-body font-medium hover:bg-obsidian-700 transition-colors flex items-center justify-center gap-2 shadow-lg">
                  <ShoppingBag className="w-5 h-5" />
                  Commander maintenant
                </Link>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#25D366] py-4 px-6 rounded-xl font-body font-medium hover:bg-[#25D366] hover:text-white transition-all">
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </a>
              </div>
            ) : (
              <button disabled className="w-full bg-obsidian-200 text-obsidian-400 py-4 rounded-xl font-body font-medium cursor-not-allowed">
                Rupture de stock
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#fafaf8] animate-pulse">
      <div className="h-16 bg-obsidian-900" />
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="h-96 bg-obsidian-100 rounded-3xl" />
        <div className="space-y-4">
          <div className="h-4 bg-obsidian-100 rounded w-1/3" />
          <div className="h-10 bg-obsidian-100 rounded w-3/4" />
          <div className="h-20 bg-obsidian-100 rounded" />
          <div className="h-12 bg-obsidian-100 rounded" />
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
      <div className="text-center">
        <Clock className="w-20 h-20 text-obsidian-200 mx-auto mb-4" />
        <h1 className="font-display text-3xl text-obsidian-600 mb-2">Produit introuvable</h1>
        <Link href="/shop" className="text-gold-500 hover:underline font-body">Retour à la boutique</Link>
      </div>
    </div>
  );
}
