import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import { API_BASE } from '@/lib/config';
import PaypalButton from "../components/PayPalButton";

export default function Checkout() {

  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);

  const nameRegex = /^[A-Za-z\s]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9]\d{9}$/;
  const pincodeRegex = /\b\d{6}\b/;

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {

    if (key === "phone") {
      const onlyNumbers = e.target.value.replace(/\D/g, "");
      setForm(f => ({ ...f, phone: onlyNumbers }));
      return;
    }

    if (key === "name") {
      const onlyLetters = e.target.value.replace(/[^A-Za-z\s]/g, "");
      setForm(f => ({ ...f, name: onlyLetters }));
      return;
    }

    setForm(f => ({ ...f, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!nameRegex.test(form.name)) {
      toast.error("Name should contain only letters");
      return;
    }

    if (!emailRegex.test(form.email)) {
      toast.error("Enter a valid email address");
      return;
    }

    if (!phoneRegex.test(form.phone)) {
      toast.error("Enter a valid 10 digit phone number");
      return;
    }

    if (!form.address.trim()) {
      toast.error("Delivery address is required");
      return;
    }

    if (!pincodeRegex.test(form.address)) {
      toast.error("Address must contain a valid 6 digit pincode");
      return;
    }

    setLoading(true);

    try {

      const token = localStorage.getItem("token");

      for (const item of items) {

        const formData = new FormData();

        formData.append("productId", item.productId);
        formData.append("productName", item.productName);
        formData.append("price", item.price.toString());
        formData.append("quantity", item.quantity.toString());

        formData.append("length", item.lengthOption);
        formData.append("shape", item.shapeOption);

        formData.append("customerName", form.name.trim());
        formData.append("phone", form.phone.trim());
        formData.append("address", form.address.trim());

        if (item.handPictureFile) {
          formData.append("image", item.handPictureFile);
        }

        const res = await fetch(`${API_BASE}/orders`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Order failed");
        }
      }

      clearCart();

      toast.success("Order placed successfully 💅");

      navigate("/account");

    } catch (error: any) {

      toast.error(error.message || "Checkout failed");

    }

    setLoading(false);
  };

  if (items.length === 0) {
    navigate('/shop');
    return null;
  }

  return (
    <div className="min-h-screen">

      <Header />

      <div className="pt-24 max-w-5xl mx-auto px-4 sm:px-6 py-12">

        <h1 className="font-display text-4xl font-light text-foreground mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* FORM */}

          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">

            <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">

              <h2 className="font-display text-xl font-semibold text-foreground">
                Delivery Information
              </h2>

              {[
                { key: 'name', label: 'Full Name', placeholder: 'Your full name', type: 'text' },
                { key: 'email', label: 'Email Address', placeholder: 'your@email.com', type: 'email' },
                { key: 'phone', label: 'Phone Number', placeholder: '10 digit phone number', type: 'tel' }
              ].map(f => (

                <div key={f.key}>

                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {f.label}
                  </label>

                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={set(f.key)}
                    onKeyDown={(e) => {
                      if (f.key === "name" && /[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    required
                    maxLength={f.key === "phone" ? 10 : undefined}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />

                </div>

              ))}

              <div>

                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Delivery Address
                </label>

                <textarea
                  placeholder="Full address with pincode..."
                  value={form.address}
                  onChange={set('address')}
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />

              </div>

            </div>

            {/* PAYMENT */}

            <div className="bg-card rounded-2xl p-6 shadow-card">

              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                Payment
              </h2>

              <div className="flex items-center gap-3 p-4 bg-secondary rounded-xl">

                <Lock size={18} className="text-primary" />

               <div>

  <p className="text-sm font-medium text-foreground">
    Secure Payment
  </p>

  <p className="text-xs text-muted-foreground">
    Complete your payment securely using PayPal.
  </p>

  <div className="mt-4">
    <PaypalButton />
  </div>

</div>
              </div>

            </div>

           

          </form>

          {/* ORDER SUMMARY */}

          <div className="lg:col-span-2">

            <div className="bg-card rounded-2xl p-5 shadow-card sticky top-24">

              <h3 className="font-display text-xl font-semibold text-foreground mb-4">
                Order ({items.length})
              </h3>

              <div className="space-y-3 mb-4">

                {items.map(item => (

                  <div key={item.id} className="flex gap-3">

                    <img
                      src={item.productImage || "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=80"}
                      alt={item.productName}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">

                      <p className="text-sm font-medium text-foreground truncate">
                        {item.productName}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {item.lengthOption} · {item.shapeOption}
                      </p>

                      <p className="text-sm font-semibold text-primary">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

              <div className="border-t border-border pt-3 space-y-1">

                <div className="flex justify-between text-sm text-foreground/70">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm text-foreground/70">
                  <span>Shipping</span>
                  <span className="text-primary font-medium">FREE</span>
                </div>

                <div className="flex justify-between font-semibold text-foreground pt-2">
                  <span>Total</span>
                  <span className="text-primary text-lg">₹{total.toFixed(2)}</span>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      <Footer />

    </div>
  );
}