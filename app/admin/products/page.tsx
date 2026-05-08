'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Plus, Search, Edit2, Trash2, X, Upload, Clock,
  Package, TrendingUp, Eye, EyeOff, Save, ChevronLeft,
  ChevronRight, ImagePlus, Trash
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '@/lib/types';
import { formatDA } from '@/lib/calculations';

const EMPTY = {
  name: '', description: '', purchase_price: 0, selling_price: 0,
  stock: 0, images: [] as string[], category: 'watch', is_active: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (q = '') => {
    setLoading(true);
    const url = q
      ? `/api/products?all=true&search=${encodeURIComponent(q)}`
      : '/api/products?all=true';
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
  }, [search, load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setPreviewIndex(0);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      purchase_price: p.purchase_price,
      selling_price: p.selling_price,
      stock: p.stock,
      images: p.images?.length ? p.images : (p.image_url ? [p.image_url] : []),
      category: p.category || 'watch',
      is_active: p.is_active,
    });
    setPreviewIndex(0);
    setModalOpen(true);
  }

  async function handleUpload(files: FileList) {
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur upload');
        uploaded.push(data.url);
      }
      setForm(p => ({ ...p, images: [...p.images, ...uploaded] }));
      toast.success(`${uploaded.length} image(s) uploadée(s)!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur upload');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setForm(p => {
      const newImages = p.images.filter((_, i) => i !== index);
      return { ...p, images: newImages };
    });
    setPreviewIndex(0);
  }

  function addImageUrl(url: string) {
    if (!url.trim()) return;
    setForm(p => ({ ...p, images: [...p.images, url.trim()] }));
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Nom requis'); return; }
    if (form.selling_price <= 0) { toast.error('Prix de vente requis'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        image_url: form.images[0] || '',  // première image comme principale
      };
      const method = editing ? 'PUT' : 'POST';
      const url    = editing ? `/api/products/${editing.id}` : '/api/products';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(editing ? 'Produit modifié!' : 'Produit ajouté!');
      setModalOpen(false);
      load(search);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      toast.success('Produit supprimé');
      setDeleteId(null);
      load(search);
    } catch {
      toast.error('Erreur suppression');
    }
  }

  const margin = (p: Product) =>
    p.selling_price > 0
      ? Math.round(((p.selling_price - p.purchase_price) / p.selling_price) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-white">Produits</h1>
          <p className="text-obsidian-400 font-body text-sm mt-0.5">{products.length} produits</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 btn-gold px-5 py-2.5 rounded-xl font-body font-medium text-sm">
          <Plus className="w-4 h-4" /> Ajouter un produit
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="w-full bg-obsidian-800 border border-obsidian-700 text-white placeholder-obsidian-500 rounded-xl pl-10 pr-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
      </div>

      {/* Table */}
      <div className="bg-obsidian-800 rounded-2xl border border-obsidian-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-obsidian-700">
                {['Produit', 'Images', 'Prix achat', 'Prix vente', 'Marge', 'Stock', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-body font-medium text-obsidian-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-700/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-obsidian-700 rounded w-16" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center">
                  <Clock className="w-10 h-10 text-obsidian-600 mx-auto mb-3" />
                  <p className="text-obsidian-500 font-body">Aucun produit</p>
                </td></tr>
              ) : (
                products.map(p => {
                  const allImages = p.images?.length ? p.images : (p.image_url ? [p.image_url] : []);
                  return (
                    <tr key={p.id} className="hover:bg-obsidian-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-obsidian-700 overflow-hidden flex-shrink-0">
                            {allImages[0]
                              ? <Image src={allImages[0]} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                              : <Clock className="w-5 h-5 text-obsidian-500 m-auto mt-2.5" />}
                          </div>
                          <div>
                            <p className="text-sm text-white font-body font-medium line-clamp-1">{p.name}</p>
                            <p className="text-xs text-obsidian-400">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-obsidian-400 font-body">
                          <ImagePlus className="w-3.5 h-3.5" />
                          {allImages.length} photo{allImages.length !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-obsidian-300 font-body">{formatDA(p.purchase_price)}</td>
                      <td className="px-4 py-3 text-sm text-gold-400 font-body font-medium">{formatDA(p.selling_price)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-body font-medium ${margin(p) >= 30 ? 'text-emerald-400' : margin(p) >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {margin(p)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-sm font-body ${p.stock <= 0 ? 'text-red-400' : p.stock <= 5 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                          <Package className="w-3.5 h-3.5" /> {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-body ${p.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-obsidian-700 text-obsidian-400'}`}>
                          {p.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {p.is_active ? 'Actif' : 'Masqué'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-obsidian-400 hover:text-gold-400 hover:bg-gold-500/10 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(p.id)}
                            className="p-1.5 rounded-lg text-obsidian-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Product Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-obsidian-800 rounded-2xl border border-obsidian-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-obsidian-700">
              <h2 className="font-display text-2xl text-white">
                {editing ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <button onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-obsidian-400 hover:text-white hover:bg-obsidian-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* ── Images Section ── */}
              <div>
                <label className="block text-sm font-body font-medium text-obsidian-300 mb-3">
                  Images du produit
                  <span className="ml-2 text-xs text-obsidian-500">({form.images.length} image{form.images.length !== 1 ? 's' : ''})</span>
                </label>

                {/* Image Preview Carousel */}
                {form.images.length > 0 && (
                  <div className="relative mb-4">
                    <div className="w-full h-48 rounded-xl bg-obsidian-700 overflow-hidden border border-obsidian-600">
                      <Image
                        src={form.images[previewIndex]}
                        alt={`Image ${previewIndex + 1}`}
                        width={400}
                        height={192}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    {/* Navigation arrows */}
                    {form.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setPreviewIndex(i => (i - 1 + form.images.length) % form.images.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPreviewIndex(i => (i + 1) % form.images.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {/* Delete current image */}
                    <button
                      onClick={() => removeImage(previewIndex)}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 rounded-full flex items-center justify-center text-white hover:bg-red-600">
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                    {/* Counter */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      {previewIndex + 1} / {form.images.length}
                    </div>
                  </div>
                )}

                {/* Thumbnails */}
                {form.images.length > 1 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {form.images.map((img, i) => (
                      <button key={i} onClick={() => setPreviewIndex(i)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          previewIndex === i ? 'border-gold-500' : 'border-obsidian-600'
                        }`}>
                        <Image src={img} alt={`thumb ${i}`} width={56} height={56} className="object-cover w-full h-full" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Upload Button — accepte plusieurs fichiers */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => e.target.files && handleUpload(e.target.files)}
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-obsidian-700 text-obsidian-300 hover:text-white rounded-xl text-sm font-body border border-obsidian-600 hover:border-obsidian-500 transition-all disabled:opacity-50">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Upload en cours...' : 'Ajouter des images'}
                  </button>
                </div>

                {/* URL Input */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="url"
                    id="url-input"
                    placeholder="Ou coller une URL d'image"
                    className="flex-1 bg-obsidian-700 border border-obsidian-600 text-white placeholder-obsidian-500 rounded-xl px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-gold-500"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        addImageUrl((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('url-input') as HTMLInputElement;
                      addImageUrl(input.value);
                      input.value = '';
                    }}
                    className="px-3 py-2 bg-obsidian-700 text-obsidian-300 hover:text-white rounded-xl border border-obsidian-600 text-sm font-body">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-obsidian-500 mt-1 font-body">
                  Conseil: la 1ère image sera l&apos;image principale affichée dans la boutique
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-body font-medium text-obsidian-300 mb-1.5">Nom du produit *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Rolex Submariner Noir..."
                  className="w-full bg-obsidian-700 border border-obsidian-600 text-white placeholder-obsidian-500 rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-body font-medium text-obsidian-300 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2} placeholder="Description courte..."
                  className="w-full bg-obsidian-700 border border-obsidian-600 text-white placeholder-obsidian-500 rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none" />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-body font-medium text-obsidian-300 mb-1.5">Prix d&apos;achat (DA) *</label>
                  <input type="number" min="0" value={form.purchase_price}
                    onChange={e => setForm(p => ({ ...p, purchase_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-obsidian-700 border border-obsidian-600 text-white rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-obsidian-300 mb-1.5">Prix de vente (DA) *</label>
                  <input type="number" min="0" value={form.selling_price}
                    onChange={e => setForm(p => ({ ...p, selling_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-obsidian-700 border border-obsidian-600 text-white rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
                </div>
              </div>

              {/* Margin preview */}
              {form.selling_price > 0 && (
                <div className="flex items-center gap-2 p-3 bg-obsidian-700/50 rounded-xl border border-obsidian-600">
                  <TrendingUp className="w-4 h-4 text-gold-400" />
                  <p className="text-sm font-body text-obsidian-300">
                    Marge: <span className="text-gold-400 font-medium">
                      {Math.round(((form.selling_price - form.purchase_price) / form.selling_price) * 100)}%
                    </span>
                    {' '}— Profit: <span className="text-emerald-400 font-medium">
                      {formatDA(form.selling_price - form.purchase_price)}
                    </span>
                  </p>
                </div>
              )}

              {/* Stock + Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-body font-medium text-obsidian-300 mb-1.5">Stock</label>
                  <input type="number" min="0" value={form.stock}
                    onChange={e => setForm(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-obsidian-700 border border-obsidian-600 text-white rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
                </div>
                <div>
                  <label className="block text-sm font-body font-medium text-obsidian-300 mb-1.5">Catégorie</label>
                  <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    placeholder="watch"
                    className="w-full bg-obsidian-700 border border-obsidian-600 text-white placeholder-obsidian-500 rounded-xl px-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold-500" />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-4 bg-obsidian-700/50 rounded-xl border border-obsidian-600">
                <div>
                  <p className="text-sm font-body font-medium text-white">Produit actif</p>
                  <p className="text-xs text-obsidian-400 font-body">Visible dans la boutique</p>
                </div>
                <button onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-gold-500' : 'bg-obsidian-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Save */}
              <button onClick={handleSave} disabled={saving}
                className="flex items-center justify-center gap-2 w-full btn-gold py-3.5 rounded-xl font-body font-semibold disabled:opacity-60">
                <Save className="w-4 h-4" />
                {saving ? 'Enregistrement...' : (editing ? 'Modifier le produit' : 'Ajouter le produit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-obsidian-800 rounded-2xl border border-obsidian-700 p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-display text-xl text-white mb-2">Supprimer le produit?</h3>
            <p className="text-obsidian-400 font-body text-sm mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-obsidian-600 text-obsidian-300 font-body text-sm hover:bg-obsidian-700 transition-colors">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-body text-sm hover:bg-red-600 transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
