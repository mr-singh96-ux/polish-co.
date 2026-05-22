import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { LogOut, Package, Sparkles } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

export default function TeamDashboard() {
  const { user, userRole, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || userRole !== 'team')) navigate('/team-login');
  }, [user, userRole, loading, navigate]);

  const handleSignOut = () => { signOut(); navigate('/'); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-foreground"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-foreground text-background px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <span className="font-display text-xl text-background">SlayyWithNails 💅 <span className="text-primary text-sm font-body ml-2">Team Dashboard</span></span>
        <button onClick={handleSignOut} className="flex items-center gap-1.5 text-background/60 hover:text-background text-sm transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
          <Package size={36} className="text-primary" />
        </div>
        <h2 className="font-display text-3xl font-semibold text-foreground mb-3">Team Dashboard</h2>
        <p className="text-muted-foreground font-body mb-8 max-w-md mx-auto">
          Connect your backend to manage orders, track shipments, and handle custom requests from your team.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Total Orders', value: '—', color: 'text-primary' },
            { label: 'Pending', value: '—', color: 'text-amber-600' },
            { label: 'Custom Orders', value: '—', color: 'text-purple-600' },
            { label: 'Completed', value: '—', color: 'text-green-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-2xl p-4 shadow-card text-center">
              <p className={`font-display text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-card">
          <Sparkles className="mx-auto mb-3 text-primary" size={28} />
          <p className="font-semibold text-foreground mb-1">Ready to connect your backend?</p>
          <p className="text-sm text-muted-foreground">
            Implement your own API endpoints or use Lovable Cloud to power this dashboard with real order data.
          </p>
        </div>
      </div>
    </div>
  );
}
