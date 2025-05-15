// ✅ app/layout.tsx (Server Component)

import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayout from "./client-layout";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { SidebarProvider } from "@/components/ui/sidebar"; // if SidebarProvider is also global

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ERP Financeiro",
  description: "Sistema de Gestão Financeira",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* ✅ Add CompanyProvider globally */}
        <CompanyProvider>
          {/* ✅ (optional) Add SidebarProvider globally if you want */}
          <SidebarProvider>
            <ClientLayout>{children}</ClientLayout>
          </SidebarProvider>
        </CompanyProvider>
      </body>
    </html>
  );
}
