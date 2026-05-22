export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  in_stock: boolean;
  category: string;
  created_at: string;
}

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Rosé Royale',
    price: 649,
    description: 'Soft pink ombre with subtle shimmer. Perfect for everyday glam.',
    images: ['/lovable-uploads/3b36b449-ccd8-445c-af63-572a348afcb4.jpg'],
    in_stock: true,
    category: 'ready',
    created_at: '2025-01-01',
  },
  {
    id: 'p2',
    name: 'Midnight Velvet',
    price: 749,
    description: 'Deep burgundy with matte velvet finish. Sophisticated and bold.',
    images: ['/lovable-uploads/656dd90b-ebcd-4967-8ed2-d83c2314b271.jpg'],
    in_stock: true,
    category: 'ready',
    created_at: '2025-01-02',
  },
  {
    id: 'p3',
    name: 'Golden Hour',
    price: 649,
    description: 'Nude base with gold foil accents. Bridal-ready and timeless.',
    images: ['/lovable-uploads/0ddee33b-3a16-4498-a373-699c0674f15f.jpg'],
    in_stock: true,
    category: 'ready',
    created_at: '2025-01-03',
  },
  {
    id: 'p4',
    name: 'Cloud Nine',
    price: 599,
    description: 'Pastel blue cloud art. Dreamy and playful for every vibe.',
    images: ['/lovable-uploads/a05b705c-3e61-4698-8e9f-94dd80bcfbb8.jpg'],
    in_stock: true,
    category: 'ready',
    created_at: '2025-01-04',
  },
  {
    id: 'p5',
    name: 'Noir Empress',
    price: 699,
    description: 'Delicate pink floral art on a sheer base. Spring vibes always.',
    images: ['/lovable-uploads/6bcb669f-9224-4de0-83ff-6a2588e42ef4.jpg'],
    in_stock: true,
    category: 'ready',
    created_at: '2025-01-05',
  },
  {
    id: 'p6',
    name: 'Cherry Blossom',
    price: 699,
    description: 'Jet black with silver chrome edges. For the bold and fearless.',
    images: ['/lovable-uploads/f32e6aae-7bbd-4f78-a208-cadda0ee2400.jpg'],
    in_stock: true,
    category: 'ready',
    created_at: '2025-01-06',
  },
];
