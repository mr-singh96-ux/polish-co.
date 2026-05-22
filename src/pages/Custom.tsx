import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import { toast } from 'sonner';
import { Sparkles, Upload, Info } from 'lucide-react';
import { API_BASE } from '@/lib/config';

const LENGTH_OPTIONS = ['Short', 'Medium', 'Long', 'XL'];
const SHAPE_OPTIONS = ['Almond', 'Coffin', 'Square', 'Stiletto', 'Oval'];

export default function Custom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [length, setLength] = useState('');
  const [shape, setShape] = useState('');
  const [description, setDescription] = useState('');
  const [inspoFile, setInspoFile] = useState<File | null>(null);
  const [inspoPreview, setInspoPreview] = useState('');
  const [handFile, setHandFile] = useState<File | null>(null);
  const [handPreview, setHandPreview] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'inspo' | 'hand') => {
  const file = e.target.files?.[0];
  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.type)) {
  toast.error("Only JPG or PNG images allowed");
  return;
}
  if (file.size > 5 * 1024 * 1024) {
    toast.error("Image must be under 5MB");
    return;
  }

  if (type === 'inspo') {
    setInspoFile(file);
    setInspoPreview(URL.createObjectURL(file));
  } else {
    setHandFile(file);
    setHandPreview(URL.createObjectURL(file));
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!length) {
    toast.error("Please select a length");
    return;
  }

  if (!shape) {
    toast.error("Please select a shape");
    return;
  }

  if (!description.trim()) {
    toast.error("Please describe your design");
    return;
  }
  if (!inspoFile) {
  toast.error("Inspirational image is required");
  return;
  }

  if (!handFile) {
    toast.error("Hand picture is required for sizing");
    return;
  }

  try {
    const formData = new FormData();

    formData.append("name", user?.email || buyerName);
    formData.append("email", user?.email || buyerEmail);

    formData.append("design", `${length} ${shape} Custom Set`);
    formData.append("length", length);
    formData.append("shape", shape);

    formData.append("notes", description);
    formData.append("handImage", handFile);
    formData.append("inspirationImage", inspoFile);

    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}/custom-nails`, {
    method: "POST",
    headers: {
    Authorization: `Bearer ${token}`
  },
  body: formData
});

    if (!res.ok) {
      const text = await res.text();
      console.error(text);
      throw new Error("Server error");
    }

    const data = await res.json();

    toast.success("Custom request submitted! 🎉 Our team will review it shortly.");
    setLength("");
    setShape("");
    setDescription("");
    setInspoFile(null);
    setInspoPreview("");
    setHandFile(null);
    setHandPreview("");
    setSubmitted(true);

  } catch (error) {
    console.error(error);
    toast.error("Failed to submit request");
  }
};

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-24 min-h-[70vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">💅</div>
            <h2 className="font-display text-3xl font-semibold text-foreground mb-2">Request Submitted!</h2>
            <p className="text-muted-foreground font-body mb-6">Our team will review your custom order and get back to you.</p>
            <button onClick={() => navigate('/')} className="bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-body font-medium hover:bg-primary/90 transition-all">
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="pt-24 pb-4 px-4 sm:px-6 bg-gradient-brand text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-3 font-body">Custom Orders</p>
        <h1 className="font-display text-5xl sm:text-6xl font-light text-foreground mb-3">
          Create Your Custom Set
        </h1>
        <p className="text-muted-foreground font-body max-w-md mx-auto">
          Tell us your vision — we'll bring it to life, nail by nail. ✨
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Buyer Info */}
          {!user && (
            <div className="p-5 bg-accent rounded-2xl space-y-4">
              <p className="text-sm font-semibold text-foreground">Your Details</p>
              <input type="text" placeholder="Full Name" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="email" placeholder="Email Address" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input type="tel" placeholder="Phone Number" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          )}

          {/* Inspiration Image */}
          <div>
            <p className="font-body font-semibold text-foreground text-sm uppercase tracking-wider">
                Inspirational Image <span className="text-destructive">*</span></p>
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" onChange={e => handleFile(e, 'inspo')} className="hidden" />
              {inspoPreview ? (
                <div className="relative">
                  <img src={inspoPreview} alt="Inspiration" className="w-full rounded-2xl max-h-56 object-cover" />
                  <p className="text-xs text-primary mt-2 text-center">✅ Uploaded — click to change</p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center hover:border-primary transition-colors">
                  <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground/70">Upload your nail inspiration</p>
                  <p className="text-xs text-muted-foreground mt-1">Pinterest, Instagram screenshot, or any image upto 5MB</p>
                </div>
              )}
            </label>
          </div>

          {/* Hand Picture */}
          <div className="p-5 bg-accent rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <p className="font-body font-semibold text-foreground text-sm uppercase tracking-wider">
                Hand Picture <span className="text-destructive">*</span>
              </p>
              <button type="button" onClick={() => setShowGuide(!showGuide)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Info size={13} /> Guide
              </button>
            </div>
            {showGuide && (
              <div className="mb-4 p-4 bg-card rounded-xl space-y-2 text-sm text-foreground/70 font-body">
                <p className="font-semibold text-foreground">📸 Perfect Hand Photo Guide:</p>
                <ul className="space-y-1 pl-4">
                  <li>✅ Keep hand <strong>flat on a surface</strong></li>
                  <li>✅ Use <strong>good natural lighting</strong></li>
                  <li>✅ <strong>No angle tilt</strong> — shoot straight from above</li>
                  <li>✅ Show <strong>all 10 nails clearly</strong></li>
                  <li>✅ <strong>Clean, polish-free</strong> nails preferred</li>
                </ul>
              </div>
            )}
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" onChange={e => handleFile(e, 'hand')} className="hidden" />
              {handPreview ? (
                <div>
                  <img src={handPreview} alt="Hand preview" className="w-full rounded-xl max-h-48 object-cover" />
                  <p className="text-xs text-primary mt-2 text-center">✅ Photo uploaded — click to change</p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-primary/40 rounded-xl p-8 text-center hover:border-primary transition-colors">
                  <p className="text-2xl mb-2">🤳</p>
                  <p className="text-sm font-medium text-foreground/70">Upload your hand photo</p>
                  <p className="text-xs text-muted-foreground mt-1">Required for accurate sizing ( JPG, PNG up to 5MB )</p>
                </div>
              )}
            </label>
          </div>

          {/* Description */}
          <div>
            <p className="font-body font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">
              Describe Your Design <span className="text-destructive">*</span>
            </p>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Nude base with gold foil accents, almond shape, medium length..."
              rows={5}
              maxLength={1000}
              className="w-full px-4 py-3 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{description.length}/1000</p>
          </div>

          {/* Length */}
          <div>
            <p className="font-body font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Length</p>
            <div className="flex flex-wrap gap-2">
              {LENGTH_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => setLength(opt)} className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${length === opt ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/70 hover:border-primary hover:text-primary'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Shape */}
          <div>
            <p className="font-body font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Shape</p>
            <div className="flex flex-wrap gap-2">
              {SHAPE_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => setShape(opt)} className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${shape === opt ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground/70 hover:border-primary hover:text-primary'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-full font-body font-medium hover:bg-primary/90 transition-all hover:scale-[1.01] shadow-soft"
          >
            <Sparkles size={18} />
            Submit Custom Request 💅
          </button>
        </form>
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
