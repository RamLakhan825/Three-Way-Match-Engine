import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '../lib/QueryProvider';

export const metadata: Metadata = {
  title: 'Three-Way Match Engine',
  description: 'PO / GRN / Invoice reconciliation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}