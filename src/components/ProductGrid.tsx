import ProductCard from './ProductCard';

interface Product {
  id: number;
  title: string;
  price: number;
  image_url: string;
  category: string;
  description: string;
}

interface ProductGridProps {
  products: Product[];
  loading: boolean;
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  if (loading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm font-medium">Syncing database cache...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-gray-200 bg-white rounded-2xl mx-2">
        <p className="text-gray-400 font-medium text-sm">No inventory items found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-6 w-full px-1">
      {products.map((item) => (
        <div key={item.id} className="min-w-0">
          <ProductCard
            id={item.id}
            title={item.title}
            price={item.price}
            image_url={item.image_url}
            category={item.category}
            description={item.description}
          />
        </div>
      ))}
    </div>
  );
}