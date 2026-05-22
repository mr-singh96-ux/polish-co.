import { useEffect, useState, useRef } from 'react';
import { Search, ShoppingBag, Trash2, X, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/config';

interface Order {
  _id: string;
  productName: string;
  productImage: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  price: number;
  quantity: number;
  length: string;
  shape: string;
  handImage: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  userId?: { name: string; email: string };
}

const ORDER_STATUSES = ['Processing', 'Confirmed', 'In Progress', 'Shipped', 'Completed', 'Cancelled'];
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded'];

const statusStyle: Record<string, string> = {
  Processing: 'bg-amber-50 text-amber-700 border-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  'In Progress': 'bg-purple-50 text-purple-700 border-purple-200',
  Shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Completed: 'bg-green-50 text-green-700 border-green-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const paymentStyle: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-300',
  Paid: 'bg-green-50 text-green-700 border-green-300',
  Failed: 'bg-red-50 text-red-700 border-red-300',
  Refunded: 'bg-gray-100 text-gray-600 border-gray-300',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const token = localStorage.getItem('token');

  const fetchOrders = async (q = '', status = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (q) params.set('search', q);
      if (status) params.set('status', status);
      const res = await fetch(`${API_BASE}/admin/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load orders');
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
      const res = await fetch(`${API_BASE}/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
      if (detailOrder?._id === id) setDetailOrder(prev => prev ? { ...prev, status } : null);
      toast.success(`Status → ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const updatePaymentStatus = async (id: string, paymentStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentStatus }),
      });
      if (!res.ok) throw new Error();
      setOrders(prev => prev.map(o => o._id === id ? { ...o, paymentStatus } : o));
      if (detailOrder?._id === id) setDetailOrder(prev => prev ? { ...prev, paymentStatus } : null);
      toast.success(`Payment → ${paymentStatus}`);
    } catch {
      toast.error('Failed to update payment status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      toast.success('Order deleted');
      setDeleteId(null);
      fetchOrders(search, filterStatus);
    } catch {
      toast.error('Failed to delete order');
    }
  };

  const customerName = (o: Order) => o.customerName || o.userId?.name || 'Unknown';
  const customerEmail = (o: Order) => o.customerEmail || o.userId?.email || '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">{total} total orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by product, customer..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterStatus('')}
            className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${
              filterStatus === ''
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-foreground/70 hover:border-foreground/40'
            }`}
          >
            All
          </button>
          {ORDER_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => handleFilterStatus(s)}
              className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${
                filterStatus === s
                  ? `${statusStyle[s]} border-current`
                  : 'border-border text-foreground/70 hover:border-foreground/40'
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
            <ShoppingBag size={40} className="mb-3 opacity-40" />
            <p className="font-medium">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Details</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Payment</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map(order => (
                  <tr key={order._id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        {order.productImage ? (
                          <img
                            src={order.productImage}
                            alt={order.productName}
                            className="w-9 h-9 rounded-lg object-cover shrink-0 border border-border cursor-pointer"
                            onClick={() => setExpandedImage(order.productImage)}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-secondary shrink-0 flex items-center justify-center text-muted-foreground">
                            <ShoppingBag size={14} />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-foreground">{order.productName}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            #{order._id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-foreground">{customerName(order)}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">{customerEmail(order)}</p>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-xs hidden sm:table-cell">
                      <p>Qty: {order.quantity}</p>
                      <p>{order.length} · {order.shape}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-primary whitespace-nowrap">
                      ₹{(order.price * order.quantity).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status}
                        onChange={e => updateStatus(order._id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border cursor-pointer focus:outline-none ${statusStyle[order.status] || 'bg-secondary text-foreground border-border'}`}
                      >
                        {ORDER_STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${paymentStyle[order.paymentStatus] || 'bg-secondary text-foreground border-border'}`}>
                        {order.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setDetailOrder(order)}
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="View details"
                        >
                          <Maximize2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(order._id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Order Detail Modal ── */}
      {detailOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setDetailOrder(null); }}
        >
          <div className="bg-card rounded-3xl shadow-hover w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-card rounded-t-3xl z-10">
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">Order Details</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  #{detailOrder._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Product row */}
              <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
                {detailOrder.productImage ? (
                  <img
                    src={detailOrder.productImage}
                    alt={detailOrder.productName}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-border cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setExpandedImage(detailOrder.productImage)}
                    title="Click to expand"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-secondary shrink-0 flex items-center justify-center text-muted-foreground">
                    <ShoppingBag size={20} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{detailOrder.productName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {detailOrder.length} · {detailOrder.shape} · Qty {detailOrder.quantity}
                  </p>
                  <p className="text-sm font-bold text-primary mt-1">
                    ₹{(detailOrder.price * detailOrder.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Customer + Order info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-secondary/30 rounded-xl p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Customer</p>
                  <p className="font-semibold text-foreground">{customerName(detailOrder)}</p>
                  <p className="text-sm text-foreground/80">{customerEmail(detailOrder)}</p>
                  {detailOrder.phone && (
                    <p className="text-sm text-foreground/80">📞 {detailOrder.phone}</p>
                  )}
                </div>
                <div className="bg-secondary/30 rounded-xl p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Timestamps</p>
                  <p className="text-sm text-foreground/80">
                    <span className="text-muted-foreground">Ordered: </span>
                    {new Date(detailOrder.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-foreground/80">
                    <span className="text-muted-foreground">Updated: </span>
                    {new Date(detailOrder.updatedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Delivery address */}
              {detailOrder.address && (
                <div className="bg-secondary/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Delivery Address
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {detailOrder.address}
                  </p>
                </div>
              )}

              {/* Status controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Order status */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Order Status
                  </p>
                  <select
                    value={detailOrder.status}
                    onChange={e => updateStatus(detailOrder._id, e.target.value)}
                    className={`w-full text-sm font-semibold px-3 py-2.5 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${statusStyle[detailOrder.status] || 'bg-card border-border text-foreground'}`}
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Payment status */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Payment Status
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_STATUSES.map(ps => (
                      <button
                        key={ps}
                        onClick={() => updatePaymentStatus(detailOrder._id, ps)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                          detailOrder.paymentStatus === ps
                            ? paymentStyle[ps]
                            : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                        }`}
                      >
                        {ps}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hand photo */}
              {detailOrder.handImage && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Hand Photo
                  </p>
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => setExpandedImage(detailOrder.handImage)}
                  >
                    <img
                      src={detailOrder.handImage}
                      alt="Hand"
                      className="w-full rounded-xl max-h-64 object-cover border border-border"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center">
                      <Maximize2 size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </div>
                  <p className="text-xs text-primary mt-1.5 text-center">Click to expand</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Expanded Image Lightbox ── */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <img
              src={expandedImage}
              alt="Expanded"
              className="w-full rounded-2xl max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-hover w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">Delete Order?</h3>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-secondary/50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
