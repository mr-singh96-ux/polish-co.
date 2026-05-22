import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, ShoppingBag, IndianRupee, Package, Sparkles,
  TrendingUp, ArrowRight, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/config';

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<string, number>;
  recentOrders: any[];
}

const statusColors: Record<string, string> = {
  Processing: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-purple-100 text-purple-700',
  Shipped: 'bg-indigo-100 text-indigo-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch {
      toast.error('Could not load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const chartData = stats
    ? Object.entries(stats.ordersByStatus).map(([status, count]) => ({ status, count }))
    : [];

  const metricCards = stats
    ? [
        {
          label: 'Total Users',
          value: stats.totalUsers,
          icon: Users,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          link: '/admin/users'
        },
        {
          label: 'Total Orders',
          value: stats.totalOrders,
          icon: ShoppingBag,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          link: '/admin/orders'
        },
        {
          label: 'Revenue',
          value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
          icon: IndianRupee,
          color: 'text-green-600',
          bg: 'bg-green-50',
          link: '/admin/orders'
        },
        {
          label: 'Products',
          value: stats.totalProducts,
          icon: Package,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          link: '/admin/products'
        },
        {
          label: 'Custom Orders',
          value: stats.totalCustomOrders,
          icon: Sparkles,
          color: 'text-pink-600',
          bg: 'bg-pink-50',
          link: '/admin/custom-orders'
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Live overview of your store</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl px-4 py-2 hover:bg-secondary/50 transition-all"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map(card => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.link}
              className="bg-card rounded-2xl p-5 shadow-card hover:shadow-hover transition-all hover:-translate-y-0.5 group"
            >
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} className={card.color} />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1 font-body">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Charts + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Order Status Chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">Orders by Status</h2>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 10, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              No order data yet
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-3 bg-card rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent Orders</h2>
            <Link
              to="/admin/orders"
              className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {stats?.recentOrders.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              No orders yet
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recentOrders.map((order: any) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{order.productName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.customerName || order.userId?.name || 'Customer'} · Qty {order.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status] || 'bg-secondary text-foreground/70'}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-bold text-primary whitespace-nowrap">
                      ₹{(order.price * order.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Add Product', to: '/admin/products', color: 'bg-orange-50 text-orange-700 border-orange-200' },
          { label: 'View Orders', to: '/admin/orders', color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { label: 'Custom Orders', to: '/admin/custom-orders', color: 'bg-pink-50 text-pink-700 border-pink-200' },
          { label: 'Manage Users', to: '/admin/users', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        ].map(item => (
          <Link
            key={item.label}
            to={item.to}
            className={`${item.color} border rounded-2xl p-4 text-center text-sm font-semibold hover:opacity-80 transition-opacity`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
