import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, LogOut, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count, clearCart } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
    { label: 'Custom Nails', href: '/custom' },
  ];

  const handleSignOut = async () => {
    clearCart();
    signOut();
    navigate('/');
  };

  const handleNavClick = (href: string) => {
    if (href === '/custom' && !user) {
      navigate('/auth');
      return;
    }
    navigate(href);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-card/95 backdrop-blur-sm shadow-card' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-semibold text-gradient">SlayyWithNails</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="font-body text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to={isAdmin ? '/admin' : '/account'}
                className="hidden md:flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              >
                {isAdmin ? <ShieldCheck size={16} /> : <User size={16} />}
                {isAdmin ? 'Admin' : 'Account'}
              </Link>

              <button
                onClick={handleSignOut}
                className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
            >
              <User size={16} />
              Login
            </Link>
          )}

          <Link to="/cart" className="relative p-2 rounded-full hover:bg-accent transition-colors">
            <ShoppingBag size={20} className="text-foreground/80" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </Link>

          <button
            className="md:hidden p-2 rounded-full hover:bg-accent transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-card/98 backdrop-blur-sm border-t border-border px-4 py-6 space-y-4 animate-fade-in">
          {navLinks.map(link => (
            <button
              key={link.href}
              onClick={() => {
                handleNavClick(link.href);
                setMobileOpen(false);
              }}
              className="block text-base font-medium text-foreground/80 hover:text-primary py-2 transition-colors"
            >
              {link.label}
            </button>
          ))}

          <div className="pt-4 border-t border-border space-y-2">
            {user ? (
              <>
                <Link
                  to={isAdmin ? '/admin' : '/account'}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-foreground/70 hover:text-primary py-2"
                >
                  {isAdmin ? '🛡️ Admin Panel' : '👤 My Account'}
                </Link>
                <button onClick={handleSignOut} className="text-sm text-destructive py-2">
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-primary py-2"
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
