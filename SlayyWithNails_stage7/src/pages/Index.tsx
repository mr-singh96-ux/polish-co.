import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Repeat, Truck, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { API_BASE } from '@/lib/config';

interface Product {
  _id: string;
  name: string;
  price: number;
  discount: number;
  images: string[];
  in_stock: boolean;
}

const reviews = [
  { name: 'Priya S.', stars: 5, text: 'Absolutely obsessed! The quality is unreal and they lasted 3 weeks. Already ordered my second set 💅', avatar: 'P' },
  { name: 'Anika R.', stars: 5, text: 'Custom set turned out exactly how I envisioned. The team is so responsive and talented!', avatar: 'A' },
  { name: 'Meera K.', stars: 5, text: 'Best press-ons I\'ve ever worn. The sizing was perfect — the hand picture method really works!', avatar: 'M' },
  { name: 'Zara T.', stars: 5, text: 'Wore them to my wedding and got SO many compliments. Will 100% recommend to everyone.', avatar: 'Z' },
];

export default function Index() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then(r => r.json())
      .then(data => setFeatured(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-brand">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" />
        <div className="relative z-10 text-center px-4 animate-fade-up max-w-3xl mx-auto">
          <p className="font-body text-sm uppercase tracking-[0.3em] text-primary mb-4">Handcrafted Luxury</p>
          <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-light text-foreground mb-4 leading-none">
            Slayy<span className="text-gradient font-semibold">With</span>Nails
          </h1>
          <p className="font-display text-2xl sm:text-3xl text-foreground/70 italic mb-8">Slay Every Set 💅</p>
          <p className="font-body text-base text-foreground/60 mb-10 max-w-lg mx-auto">
            Premium press-on nails — custom sized, handmade, and shipped to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-body font-medium hover:bg-primary/90 transition-all hover:scale-105 shadow-soft text-sm uppercase tracking-wider"
            >
              Shop Now <ArrowRight size={16} />
            </Link>
            <Link
              to="/custom"
              className="inline-flex items-center gap-2 border-2 border-primary text-primary px-8 py-4 rounded-full font-body font-medium hover:bg-accent transition-all text-sm uppercase tracking-wider"
            >
              <Sparkles size={16} /> Custom Set
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3 font-body">Why Us</p>
          <h2 className="font-display text-4xl sm:text-5xl font-light text-foreground">
            The SlayyWithNails Difference
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Repeat, title: 'Reusable', desc: 'Wear each set 15+ times with proper care', color: 'text-pink-400' },
            { icon: Shield, title: 'Custom Sized', desc: 'Hand picture sizing for a perfect fit', color: 'text-purple-400' },
            { icon: Sparkles, title: 'Handmade', desc: 'Each set crafted with love & precision', color: 'text-rose-400' },
            { icon: Truck, title: 'Free Shipping', desc: 'Free delivery on all orders', color: 'text-amber-400' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="text-center p-6 rounded-2xl bg-card shadow-card hover:shadow-hover transition-shadow">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                <Icon size={22} className={color} />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground font-body">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-20 px-4 sm:px-6 bg-secondary/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3 font-body">Collections</p>
              <h2 className="font-display text-4xl sm:text-5xl font-light text-foreground mb-4">Featured Sets</h2>
              <p className="text-muted-foreground font-body max-w-md mx-auto">
                Each design is hand-crafted and made to order. Find your signature look.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {featured.map(product => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  discount={product.discount}
                  images={product.images}
                  inStock={product.in_stock}
                />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 border-2 border-primary text-primary px-8 py-3.5 rounded-full font-body font-medium hover:bg-accent transition-all text-sm"
              >
                View All Designs <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3 font-body">Reviews</p>
            <h2 className="font-display text-4xl sm:text-5xl font-light text-foreground">
              They're Obsessed. You Will Be Too.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map(review => (
              <div key={review.name} className="bg-card p-6 rounded-2xl shadow-card">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(review.stars)].map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground/70 font-body leading-relaxed mb-4">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">{review.avatar}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{review.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Nails Banner */}
      <section className="py-16 px-4 sm:px-6 bg-accent">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-3">
            Dream It. We'll Create It. ✨
          </h2>
          <p className="text-foreground/70 font-body mb-6">
            Upload your inspiration, describe your vision, and our nail artists will hand-craft your perfect custom set.
          </p>
          <Link
            to="/custom"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-body font-medium hover:bg-primary/90 transition-all text-sm"
          >
            Start Your Custom Set <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Instagram */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3 font-body">@SlayyWithNails</p>
            <h2 className="font-display text-4xl font-light text-foreground">Follow Our Journey</h2>
          </div>
          <div className="flex justify-center">
            <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-card">
              <blockquote
                className="instagram-media"
                data-instgrm-permalink="https://www.instagram.com/p/DQ0yQX6D3Fy/?igsh=MWhwNTF6cWlweDZ1bA=="
                data-instgrm-version="14"
                style={{ background: '#FFF', border: 0, borderRadius: '16px', margin: 0, maxWidth: '100%', minWidth: '326px', padding: 0, width: '100%' }}
              />
            </div>
          </div>
          <script async src="//www.instagram.com/embed.js" />
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
