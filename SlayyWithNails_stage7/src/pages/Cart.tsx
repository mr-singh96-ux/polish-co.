import { useCart } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Cart() {
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <ShoppingBag size={56} className="text-muted-foreground mb-4" />
          <h2 className="font-display text-3xl text-foreground mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground font-body mb-8">Time to find your perfect set 💅</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-body font-medium hover:bg-primary/90 transition-all"
          >
            Shop Now <ArrowRight size={16} />
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-24 max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-display text-4xl font-light text-foreground mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-card rounded-2xl p-4 flex gap-4 shadow-card">
                <img
                  src={item.productImage || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200'}
                  alt={item.productName}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg font-semibold text-foreground truncate">{item.productName}</h3>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">
                    {item.lengthOption} · {item.shapeOption}
                  </p>
                  {item.handPictureFile && (
                    <p className="text-xs text-primary mt-0.5"> Hand photo added</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-primary font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 shadow-card sticky top-24">
              <h3 className="font-display text-xl font-semibold text-foreground mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-foreground/70">
                  <span>Subtotal ({items.length} item{items.length > 1 ? 's' : ''})</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-foreground/70">
                  <span>Shipping</span>
                  <span className="text-primary font-medium">FREE</span>
                </div>
              </div>
              <div className="border-t border-border pt-3 mb-6">
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Total</span>
                  <span className="text-primary text-lg">₹{total.toFixed(2)}</span>
                </div>
              </div>
              <Link
                to="/checkout"
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-full font-body font-medium hover:bg-primary/90 transition-all"
              >
                Checkout <ArrowRight size={16} />
              </Link>
              <Link to="/shop" className="block text-center text-sm text-muted-foreground hover:text-primary mt-3 transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
