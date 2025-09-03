import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from 'react-hot-toast';
import { Header } from '@/components/ui/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Finance Tracker - Personal Income & Expense Manager',
  description: 'Track your recurring and one-time income and expenses with beautiful charts and insights.',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Finance Tracker',
    startupImage: [
      '/icons/192.png',
    ],
  },
  icons: {
    icon: [
      { url: '/icons/32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: ['/icons/192.png'],
    apple: [
      { url: '/icons/57.png', sizes: '57x57', type: 'image/png' },
      { url: '/icons/60.png', sizes: '60x60', type: 'image/png' },
      { url: '/icons/72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/76.png', sizes: '76x76', type: 'image/png' },
      { url: '/icons/114.png', sizes: '114x114', type: 'image/png' },
      { url: '/icons/120.png', sizes: '120x120', type: 'image/png' },
      { url: '/icons/144.png', sizes: '144x144', type: 'image/png' },
      { url: '/icons/152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="pt-[70px]">
            {children}
          </main>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}