import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({ 
  subsets: ["latin"],
  variable: '--font-syne',
});

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: "GestiónPro | Gestión Profesional",
  description: "Sistema avanzado de gestión de proyectos y facturación",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GestiónPro',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

import { AuthGuard } from "@/components/AuthGuard";
import { SWRegistration } from "@/components/SWRegistration";
import Script from "next/script";
import { PTR_CODE } from "@/lib/pullToRefreshCode";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${dmSans.variable} ${syne.variable} font-sans antialiased text-[var(--foreground)] bg-[var(--background)]`}>
        <AuthGuard>
          <SWRegistration />
          <main className="min-h-screen container-fluid pl-0">
            {children}
          </main>
        </AuthGuard>
        <Script id="pull-to-refresh" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: PTR_CODE }} />
      </body>
    </html>
  );
}
