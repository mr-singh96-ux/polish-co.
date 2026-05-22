import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield } from 'lucide-react';

export default function TeamLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      // TODO: verify team role from your backend
      toast.success('Welcome to the team dashboard! 👩‍🔧');
      navigate('/team');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-foreground">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-primary" />
          </div>
          <h1 className="font-display text-3xl text-background font-semibold">Team Portal</h1>
          <p className="text-background/50 font-body mt-2 text-sm">SlayyWithNails Staff Only</p>
        </div>

        <div className="bg-card rounded-3xl p-8 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Team Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-4 rounded-full font-body font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Team Sign In'}
            </button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-4">
            <Link to="/auth" className="text-primary hover:underline">← Buyer Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
