'use client';

interface Product {
  id: number;
  name: string;
  emoji: string;
  imageUrl?: string;
  price: number;
  original: number;
  stock: number;
  status: string;
  category: string;
  badge: string;
  sold: number;
  revenue: string;
  desc: string;
  variants: string[];
}

interface ProductGridProps {
  products: Product[];
  currentView: 'grid' | 'list';
  onProductClick: (id: number) => void;
  onEditClick: (id: number) => void;
  onDeleteClick: (id: number) => void;
  onAddProduct?: () => void;
}

export default function ProductGrid({ products, currentView, onProductClick, onEditClick, onDeleteClick, onAddProduct }: ProductGridProps) {