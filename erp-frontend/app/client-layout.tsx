"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { LayoutGrid, Menu, User, LogOut } from "lucide-react";
import Link from "next/link";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const showSidebar = pathname !== "/";

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <SidebarProvider>
      <div className="flex w-screen">
        {showSidebar && (
          <Sidebar>
            <div className="flex flex-col justify-between h-full">
              {/* Top content */}
              <div>
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Sistema Financeiro</SidebarGroupLabel>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/dashboard/">
                            <LayoutGrid className="h-4 w-4" />
                            <span>Eventos</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/clientes">
                            <User className="h-4 w-4" />
                            <span>Clientes</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/fornecedores">
                            <User className="h-4 w-4" />
                            <span>Fornecedores</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/lancamentos">
                            <Menu className="h-4 w-4" />
                            <span>Extrato</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/contas">
                            <Menu className="h-4 w-4" />
                            <span>Contas a Pagar</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/contas/receber">
                            <Menu className="h-4 w-4" />
                            <span>Contas a Receber</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/bancos">
                            <Menu className="h-4 w-4" />
                            <span>Contas Bancárias</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/reports">
                            <Menu className="h-4 w-4" />
                            <span>Relatórios</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroup>
                </SidebarContent>
              </div>

              {/* Bottom content → Logout button */}
              <div className="p-4 border-t">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-semibold w-full"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </Sidebar>
        )}
        <SidebarInset className="p-0 w-full">{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
