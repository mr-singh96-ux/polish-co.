import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import WhatsAppButton from '@/components/WhatsAppButton';
import { Search, Package } from 'lucide-react';
import { API_BASE } from '@/lib/config';

interface Product {
  _id: string;
  name: string;
  price: number;
  discount: number;
  description: string;
  images: string[];
  in_stock: boolean;
  category: string;
}

// ─── Fuzzy Search ─────────────────────────────────────────────────────────────

function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function isSubsequence(query: string, text: string): boolean {
  let qi = 0;
  for (let ti = 0; ti < text.length && qi < query.length; ti++) {
    if (query[qi] === text[ti]) qi++;
  }
  return qi === query.length;
}

function fuzzyScore(query: string, productName: string): number {
  if (!query) return 1;
  const q = query.toLowerCase();
  const name = productName.toLowerCase();
  const words = name.split(/\s+/);
  if (name.includes(q)) return 100;
  let best = 0;
  for (const word of words) {
    if (word.startsWith(q)) { best = Math.max(best, 80); continue; }
    if (q.length >= 2 && isSubsequence(q, word)) { best = Math.max(best, 60); continue; }
    const maxDist = q.length <= 2 ? 0 : q.length <= 3 ? 1 : q.length <= 5 ? 2 : Math.floor(q.length / 3);
    if (maxDist > 0) {
      for (let start = 0; start <= word.length - q.length; start++) {
        const dist = editDistance(q, word.slice(start, start + q.length));
        if (dist <= maxDist) { best = Math.max(best, 40 - dist * 10); break; }
      }
      if (word.length >= q.length) {
        const dist = editDistance(q, word.slice(0, q.length));
        if (dist <= maxDist) best = Math.max(best, 40 - dist * 10);
      }
    }
  }
  return best;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    return products
      .map(p => ({ product: p, score: fuzzyScore(search.trim(), p.name) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);
  }, [search, products]);

  return (
    <div className="min-h-screen">
      <Header />

      <div className="pt-28 pb-12 px-4 sm:px-6 bg-gradient-brand text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3 font-body">Collections</p>
        <h1 className="font-display text-5xl sm:text-6xl font-light text-foreground mb-4">Shop All Designs</h1>
        <p className="text-muted-foreground font-body max-w-md mx-auto">
          Handcrafted press-on nails — each set made with love.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="relative max-w-sm mx-auto mb-10">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search designs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {products.length === 0 ? (
              <>
                <Package size={48} className="mx-auto mb-4 opacity-30" />
                <p className="font-display text-2xl">No designs available yet</p>
                <p className="text-sm mt-2">Check back soon for new collections!</p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl">No designs found 😔</p>
                <p className="text-sm mt-2">Try a different search term</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map(product => (
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
        )}
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
