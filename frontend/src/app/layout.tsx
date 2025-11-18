import { Inter } from 'next/font/google';
import '../app/globals.css';  // Using absolute path from src directory
import '../app/scrollbar-hide.css';  // Custom scrollbar hide utility
import { metadata as layoutMetadata } from './layout-metadata';
import { Toaster } from './farmer/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata = layoutMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}


