import type { Metadata } from 'next';
import './globals.css';
import { BottomNav } from '@/components/bottom-nav';

export const metadata: Metadata = {
  title: 'Bookstride | Strava for Readers',
  description: 'Track your reading sessions and connect with fellow bookworms.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-[#F3F4F6] font-sans antialiased">
        <div className="max-w-md mx-auto h-screen bg-white relative shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
