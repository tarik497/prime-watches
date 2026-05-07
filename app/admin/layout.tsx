'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Clock, LayoutDashboard, Package, ShoppingBag,
  Receipt, Settings, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const NAV = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/admin/products',  icon: Package,         label: 'Produits' },
  { href: '/admin/orders',    icon: ShoppingBag,     label: 'Commandes' },
  { href: '/admin/expenses',  icon: Receipt,         label: 'Dépenses' },
  { href: '/admin/settings',  icon: Settings,        label: 'Paramètres' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.admin) setAdminName(d.admin.name);
    }).catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Déconnecté');
    router.push('/admin/login');
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-obsidian-700">
        <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          <div className="w-9 h-9 bg-gold-500/20 rounded-xl flex items-center justify-center border border-gold-500/30">
            <Clock className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <p className="font-display text-base text-white tracking-wider leading-tight">PRIME WATCHES</p>
            <p className="text-xs text-obsidian-400 font-body">Administration</p>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm transition-all group ${
                active
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                  : 'text-obsidian-300 hover:bg-obsidian-700 hover:text-white'
              }`}>
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'text-gold-400' : 'text-obsidian-400 group-hover:text-white'}`} style={{ width: '1.125rem', height: '1.125rem' }} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-gold-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4 border-t border-obsidian-700 pt-4 space-y-2">
        <div className="px-3 py-2">
          <p className="text-xs text-obsidian-500 font-body">Connecté en tant que</p>
          <p className="text-sm text-white font-body font-medium truncate">{adminName}</p>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-obsidian-300 hover:bg-red-500/10 hover:text-red-400 font-body text-sm transition-all group">
          <LogOut className="w-4 h-4 text-obsidian-400 group-hover:text-red-400" />
          Se déconnecter
        </button>
        <Link href="/shop" target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-obsidian-400 hover:bg-obsidian-700 hover:text-white font-body text-sm transition-all">
          <Package className="w-4 h-4" />
          Voir la boutique
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-obsidian-900 flex">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 bg-obsidian-800 border-r border-obsidian-700 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 flex flex-col w-72 bg-obsidian-800 shadow-2xl">
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-obsidian-400 hover:text-white hover:bg-obsidian-700">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-obsidian-800 border-b border-obsidian-700">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-obsidian-400 hover:text-white hover:bg-obsidian-700">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display text-lg text-gold-400">PRIME WATCHES</span>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-[#0f0f0f] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
