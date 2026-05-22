import { useEffect, useState, useRef } from 'react';
import { Search, Sparkles, Trash2, Image } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/config';

interface CustomOrder {
  _id: string;
  name: string;
  email: string;
  design: string;
  length: string;
  shape: string;
  notes: string;
  referenceImage: string;
  inspirationImage: string;
  status: string;
  createdAt: string;
}

const CUSTOM_STATUSES = ['Pending', 'Reviewing', 'In Progress', 'Completed', 'Rejected'];

const statusStyle: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-purple-50 text-purple-700 border-purple-200',
  Completed: 'bg-green-50 text-green-700 border-green-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
};

export default function AdminCustomOrders() {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [detailOrder, setDetailOrder] = useState<CustomOrder | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const token = localStorage.getItem('token');

  const fetchOrders = async (q = '', status = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (q) params.set('search', q);
      if (status) params.set('status', status);
      const res = await fetch(`${API_BASE}/admin/custom-orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load custom orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchOrders(value, filterStatus), 400);
  };

  const handleFilterStatus = (status: string) => {
    setFilterStatus(status);
    fetchOrders(search, status);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/custom-orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error();
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/custom-orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      toast.success('Custom order deleted');
      setDeleteId(null);
      fetchOrders(search, filterStatus);
    } catch {
      toast.error('Failed to delete order');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">Custom Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">{total} custom nail requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, design..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterStatus('')}
            className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${
              filterStatus === '' ? 'bg-foreground text-background border-foreground' : 'border-border text-foreground/70 hover:border-foreground/40'
            }`}
          >
            All
          </button>
          {CUSTOM_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => handleFilterStatus(s)}
              className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${
                filterStatus === s ? `${statusStyle[s]} border-current` : 'border-border text-foreground/70 hover:border-foreground/40'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Sparkles size={40} className="mb-3 opacity-40" />
            <p className="font-medium">No custom orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Design</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Specs</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Images</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map(order => (
                  <tr key={order._id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{order.name || '—'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{order.email || '—'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground max-w-[160px] line-clamp-2">{order.design}</p>
                      {order.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">Note: {order.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">
                      <p>{order.length}</p>
                      <p>{order.shape}</p>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setDetailOrder(order)}
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                      >
                        <Image size={14} /> View Photos
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order._id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border cursor-pointer focus:outline-none ${statusStyle[order.status] || 'bg-secondary text-foreground'}`}
                      >
                        {CUSTOM_STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setDeleteId(order._id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail / Images Modal */}
      {detailOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-3xl shadow-hover w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="font-display text-xl font-semibold text-foreground mb-4">Custom Order Details</h3>

            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-medium">{detailOrder.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{detailOrder.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Design</span><span className="font-medium text-right max-w-[220px]">{detailOrder.design}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Length</span><span className="font-medium">{detailOrder.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shape</span><span className="font-medium">{detailOrder.shape}</span></div>
              {detailOrder.notes && (
                <div>
                  <p className="text-muted-foreground mb-1">Notes</p>
                  <p className="font-medium bg-secondary/40 rounded-xl p-3 text-xs leading-relaxed">{detailOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {detailOrder.inspirationImage && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Inspiration</p>
                  <img src={detailOrder.inspirationImage} alt="Inspiration" className="w-full rounded-xl object-cover aspect-square" />
                </div>
              )}
              {detailOrder.referenceImage && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hand Photo</p>
                  <img src={detailOrder.referenceImage} alt="Hand" className="w-full rounded-xl object-cover aspect-square" />
                </div>
              )}
            </div>

            <button
              onClick={() => setDetailOrder(null)}
              className="mt-5 w-full py-3 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-hover w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">Delete Custom Order?</h3>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-secondary/50 transition-all">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
