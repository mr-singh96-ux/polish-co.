import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  discount?: number;
  images: string[];
  inStock?: boolean;
}

const ProductCard = ({ id, name, price, discount = 0, images, inStock = true }: ProductCardProps) => {
  const hasDiscount = discount > 0;
  const discountedPrice = hasDiscount ? Math.round(price * (1 - discount / 100)) : price;

  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={images?.[0] || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500'}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {hasDiscount && inStock && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
            -{discount}%
          </div>
        )}

        {!inStock && (
          <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center">
            <span className="bg-card text-foreground text-xs font-semibold px-3 py-1.5 rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 text-center">
        <h3 className="font-display text-lg font-semibold text-foreground mb-2 line-clamp-1">
          {name}
        </h3>

        <div className="mb-4">
          {hasDiscount ? (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-primary font-body font-bold text-base">
                ₹{discountedPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-muted-foreground font-body text-sm line-through">
                ₹{price.toLocaleString('en-IN')}
              </span>
            </div>
          ) : (
            <p className="text-primary font-body font-semibold text-base">
              ₹{price.toLocaleString('en-IN')}
            </p>
          )}
        </div>

        <Link
          to={`/product/${id}`}
          className="flex items-center justify-center gap-1.5 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground/70 hover:border-primary hover:text-primary transition-colors"
        >
          <Eye size={15} />
          View
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
