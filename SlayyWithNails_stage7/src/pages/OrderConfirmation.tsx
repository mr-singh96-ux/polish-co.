import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function OrderConfirmation() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-24 min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-primary" />
          </div>
          <h1 className="font-display text-4xl font-semibold text-foreground mb-2">Order Placed! 🎉</h1>
          <p className="text-muted-foreground font-body mb-6">
            Your nails are on their way to being created. Our team will start working on your set shortly!
          </p>
          <div className="bg-card rounded-2xl p-5 shadow-card mb-6 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm font-semibold text-amber-600">Pending Review</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Shipping</span>
              <span className="text-sm font-semibold text-primary">FREE</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/shop"
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-full font-body font-medium hover:bg-primary/90 transition-all text-sm"
            >
              Shop More <ArrowRight size={16} />
            </Link>
            <Link
              to="/"
              className="flex-1 flex items-center justify-center border border-border px-6 py-3.5 rounded-full font-body text-sm text-foreground/70 hover:border-primary hover:text-primary transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
