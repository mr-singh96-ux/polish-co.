import { useEffect, useState, useRef } from 'react';
import { Search, Users, Trash2, ShieldCheck, ShieldOff, UserPlus, X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { API_BASE } from '@/lib/config';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface CreateForm {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

const EMPTY_FORM: CreateForm = { name: '', email: '', password: '', role: 'user' };

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string>('');

  /* ── Create modal ── */
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<CreateForm>>({});
  const [saving, setSaving] = useState(false);

  /* ── Role toggle loading state ── */
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const { user: currentUser } = useAuth();
  const token = localStorage.getItem('token');

  /* ── Fetch ── */
  const fetchUsers = async (q = '', role = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (q) params.set('search', q);
      if (role) params.set('role', role);
      const res = await fetch(`${API_BASE}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  /* ── Search ── */
  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchUsers(value, filterRole), 400);
  };

  const handleFilterRole = (role: string) => {
    setFilterRole(role);
    fetchUsers(search, role);
  };

  /* ── Role toggle ── */
  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setTogglingId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: newRole as 'user' | 'admin' } : u));
      toast.success(newRole === 'admin' ? 'Promoted to admin' : 'Demoted to customer');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setTogglingId(null);
    }
  };

  /* ── Delete ── */
  const confirmDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteTarget(name);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success('User deleted');
      setDeleteId(null);
      setDeleteTarget('');
      fetchUsers(search, filterRole);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  /* ── Create user ── */
  const validateForm = (): boolean => {
    const e: Partial<CreateForm> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!isValidEmail(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const res = await fetch('${API_BASE}/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message?.toLowerCase().includes('email')) {
          setFormErrors(e => ({ ...e, email: data.message }));
        } else {
          toast.error(data.message || 'Failed to create user');
        }
        return;
      }
      toast.success(`${form.role === 'admin' ? 'Admin' : 'User'} account created`);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setFormErrors({});
      fetchUsers(search, filterRole);
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {total} registered · <span className="text-primary font-medium">{adminCount} admin{adminCount !== 1 ? 's' : ''}</span>
          </p>
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setShowPass(false); setCreateOpen(true); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all shadow-soft"
        >
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          {([['', 'All'], ['user', 'Customers'], ['admin', 'Admins']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => handleFilterRole(val)}
              className={`px-3.5 py-2 rounded-full text-xs font-medium border transition-all ${
                filterRole === val
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-foreground/70 hover:border-foreground/40'
              }`}
            >
              {label}
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
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Users size={40} className="mb-3 opacity-40" />
            <p className="font-medium">No users found</p>
            <p className="text-sm mt-1">
              {search ? 'Try a different search term' : 'Add your first user above'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(u => {
                  const isSelf = u._id === currentUser?.id;
                  const isToggling = togglingId === u._id;
                  return (
                    <tr key={u._id} className="hover:bg-secondary/20 transition-colors">
                      {/* Avatar + Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                            u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-accent text-primary'
                          }`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground leading-tight">{u.name}</p>
                              {isSelf && (
                                <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">you</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground sm:hidden">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-4 text-muted-foreground hidden sm:table-cell">{u.email}</td>

                      {/* Role badge */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          u.role === 'admin'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-secondary text-foreground/70 border-border'
                        }`}>
                          {u.role === 'admin' && <ShieldCheck size={11} />}
                          {u.role === 'admin' ? 'Admin' : 'Customer'}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-4 text-muted-foreground text-xs hidden md:table-cell">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4">
                        {!isSelf ? (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => !isToggling && toggleRole(u._id, u.role)}
                              disabled={isToggling}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                                u.role === 'admin'
                                  ? 'hover:bg-amber-50 text-amber-700'
                                  : 'hover:bg-primary/10 text-primary/80 hover:text-primary'
                              }`}
                              title={u.role === 'admin' ? 'Demote to customer' : 'Promote to admin'}
                            >
                              {isToggling ? (
                                <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              ) : u.role === 'admin' ? (
                                <ShieldOff size={13} />
                              ) : (
                                <ShieldCheck size={13} />
                              )}
                              {u.role === 'admin' ? 'Demote' : 'Promote'}
                            </button>
                            <button
                              onClick={() => confirmDelete(u._id, u.name)}
                              className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ) : (
                          <p className="text-right text-xs text-muted-foreground pr-2">—</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-3xl shadow-hover w-full max-w-md overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                  <UserPlus size={16} className="text-primary" />
                </div>
                <h2 className="font-display text-lg font-semibold text-foreground">Add User</h2>
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} noValidate className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(e2 => ({ ...e2, name: undefined })); }}
                  placeholder="e.g. Priya Sharma"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background transition-colors ${
                    formErrors.name ? 'border-destructive' : 'border-border'
                  }`}
                />
                {formErrors.name && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive mt-1.5">
                    <AlertCircle size={12} /> {formErrors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setFormErrors(e2 => ({ ...e2, email: undefined })); }}
                  placeholder="user@example.com"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background transition-colors ${
                    formErrors.email ? 'border-destructive' : 'border-border'
                  }`}
                />
                {formErrors.email && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive mt-1.5">
                    <AlertCircle size={12} /> {formErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setFormErrors(e2 => ({ ...e2, password: undefined })); }}
                    placeholder="Min 6 characters"
                    className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background transition-colors ${
                      formErrors.password ? 'border-destructive' : 'border-border'
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive mt-1.5">
                    <AlertCircle size={12} /> {formErrors.password}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['user', 'admin'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, role: r }))}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        form.role === r
                          ? r === 'admin'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-secondary border-foreground text-foreground'
                          : 'border-border text-muted-foreground hover:border-foreground/40'
                      }`}
                    >
                      {r === 'admin' && <ShieldCheck size={14} />}
                      {r === 'admin' ? 'Admin' : 'Customer'}
                    </button>
                  ))}
                </div>
                {form.role === 'admin' && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">
                    Admin accounts have full access to the admin panel.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="flex-1 py-3 rounded-full border border-border text-sm font-medium text-foreground/70 hover:bg-secondary/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
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
            <h3 className="font-display text-xl font-semibold text-foreground mb-1">Delete User?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              <span className="font-medium text-foreground">{deleteTarget}</span>'s account and all their data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteId(null); setDeleteTarget(''); }}
                className="flex-1 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-secondary/50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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
