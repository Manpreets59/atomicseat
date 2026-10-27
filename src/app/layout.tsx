import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AtomicSeat | High-Concurrency Event Ticketing System',
  description:
    'Fault-Tolerant, Serverless Architecture for Solving Race Conditions at Scale. BTech CSE Major Project • IKGPTU Mohali Campus-1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased bg-zinc-950 text-zinc-100`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-cyan-500 selection:text-zinc-950">
        {children}
      </body>
    </html>
  );
}
