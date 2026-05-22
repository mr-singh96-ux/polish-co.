import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import {
  LayoutDashboard, Package, ShoppingBag, Sparkles, Users,
  LogOut, Menu, X, ChevronRight, MessageCircle
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, end: false },
  { to: '/admin/custom-orders', label: 'Custom Orders', icon: Sparkles, end: false },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
  { to: '/admin/chat', label: 'Live Chat', icon: MessageCircle, end: false },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = () => {
    clearCart();
    signOut();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <span className="font-display text-xl text-background font-semibold">
          SlayyWithNails
        </span>
        <span className="block text-xs text-primary mt-0.5 font-body uppercase tracking-widest">
          Admin Panel
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-background/60 hover:bg-white/10 hover:text-background'
              }`
            }
          >
            <Icon size={18} />
            {label}
            <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-60 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User + Sign Out */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-4 py-2.5 mb-2">
          <p className="text-xs text-background/40 font-body uppercase tracking-wider mb-0.5">Signed in as</p>
          <p className="text-sm font-medium text-background truncate">{user?.name}</p>
          <p className="text-xs text-background/50 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-background/60 hover:bg-white/10 hover:text-background transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-secondary/20">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-foreground shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-foreground transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Top Bar */}
        <header className="lg:hidden bg-foreground px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <span className="font-display text-lg text-background font-semibold">SlayyWithNails Admin</span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-background/70 hover:text-background"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
