import AdminSidebar from "@/components/admin/AdminSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        {/* 頂部導航列 */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8">
          <h2 className="text-sm font-medium text-slate-500">內容管理系統</h2>
        </header>
        {/* 主內容區 */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
