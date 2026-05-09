import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from '@/lib/CartContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prime Watches — Montres de Luxe',
  description: 'Découvrez notre collection exclusive de montres de luxe. Livraison partout en Algérie.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <CartProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { fontSize: '0.875rem' },
              success: { iconTheme: { primary: '#c9a84c', secondary: '#fff' } },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}
