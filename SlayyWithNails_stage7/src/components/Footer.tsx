import { Link } from 'react-router-dom';
import { Instagram, MessageCircle, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background/90 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h3 className="font-display text-2xl text-background mb-3">SlayyWithNails 💅</h3>
            <p className="text-sm leading-relaxed text-background/60 mb-4">
              Handcrafted luxury press-on nails. Slay every set, every day.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/slayywithnails?igsh=MXE3eTg1enh6cncyZQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-background/10 hover:bg-primary hover:text-white transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://wa.me/6284885063"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-background/10 hover:bg-primary hover:text-white transition-colors"
              >
                <MessageCircle size={18} />
              </a>
              <a
  href="https://mail.google.com/mail/?view=cm&fs=1&to=slayywithnails@gmail.com"
  target="_blank"
  rel="noopener noreferrer"
  className="p-2 rounded-full bg-background/10 hover:bg-primary hover:text-white transition-colors"
>
  <Mail size={18} />
</a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-body font-semibold text-background mb-4 uppercase tracking-wider text-xs">Shop</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'All Designs', href: '/shop' },
                { label: 'Custom Nails', href: '/custom' },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-background/60 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-body font-semibold text-background mb-4 uppercase tracking-wider text-xs">Help</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'FAQ', href: '/faq' },
                { label: 'Sizing Guide', href: '/faq#sizing' },
                { label: 'Return Policy', href: '/policies#returns' },
                { label: 'Terms & Conditions', href: '/policies#terms' },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-background/60 hover:text-background transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body font-semibold text-background mb-4 uppercase tracking-wider text-xs">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-background/60">
                <Mail size={15} className="mt-0.5 flex-shrink-0" />
                 slayywithnails@gmail.com
              </li>
              <li className="flex items-start gap-2 text-sm text-background/60">
                <MessageCircle size={15} className="mt-0.5 flex-shrink-0" />
                WhatsApp: +91 62848 85063
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-background/40">© 2025 SlayyWithNails. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/policies#terms" className="text-xs text-background/40 hover:text-background/70 transition-colors">Terms</Link>
            <Link to="/policies#returns" className="text-xs text-background/40 hover:text-background/70 transition-colors">Returns</Link>
            <Link to="/policies#privacy" className="text-xs text-background/40 hover:text-background/70 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
