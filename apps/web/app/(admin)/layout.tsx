// Phase 4 — Sidebar + NavigationMenu de TheGridCN
// Instalar: npx shadcn@latest add @thegridcn/sidebar @thegridcn/navigation-menu

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1">{children}</main>
    </div>
  );
}
