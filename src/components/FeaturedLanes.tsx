import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';

interface Product {
  id: number;
  title: string;
  price: number;
  image_url: string;
  category: string;
  description: string;
}

interface FeaturedLanesProps {
  products: Product[];
  categories: string[];
  limitProducts: number; 
}

export default function FeaturedLanes({ products, categories, limitProducts }: FeaturedLanesProps) {
  const activeCategories = categories.filter(cat => cat !== 'All');

  const lanesToRender = activeCategories.map(catName => {
    const matchingItems = products.filter(
      p => p.category && p.category.toLowerCase() === catName.toLowerCase()
    );
    
    return {
      categoryName: catName,
      // Pull up to 5 items to fill rows perfectly if viewed on huge monitors
      products: matchingItems.slice(0, Math.max(5, limitProducts)) 
    };
  }).filter(lane => lane.products.length > 0);

  if (lanesToRender.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-gray-200 bg-white rounded-3xl mx-2">
        <p className="text-gray-400 font-bold text-xs tracking-wider uppercase">No hardware records deployed yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 w-full">
      {lanesToRender.map((lane) => (
        <div key={lane.categoryName} className="space-y-4 animate-in fade-in duration-200">
          
          {/* HEADER BLOCK */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 gap-2 px-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-sm sm:text-lg font-black text-gray-900 tracking-tight uppercase truncate">
                {lane.categoryName} 
              </h3>
              <span className="text-[8px] sm:text-[10px] font-black bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap shrink-0">
                Top Picks
              </span>
            </div>

            <Link 
              to={`/category/${lane.categoryName.toLowerCase()}`} 
              className="text-[9px] sm:text-xs font-black text-white bg-gray-950 hover:bg-gray-800 border border-transparent px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl shadow-xs transition duration-150 active:scale-95 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer group"
            >
              <span>See More</span> 
              <span className="text-[8px] sm:text-[10px] transition-transform duration-150 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>

          {/* RESPONSIVE ROW GRID CORES */}
          <div className="grid grid-cols-3 sm:grid-cols-4 min-[2000px]:grid-cols-5 gap-1.5 sm:gap-6 w-full">
            {lane.products.map((item, index) => (
              <div 
                key={item.id} 
                // Dynamically handles card entry visibility without vertical shifting:
                className={`min-w-0 overflow-hidden ${
                  index === 3 ? "hidden sm:block" : 
                  index === 4 ? "hidden min-[2000px]:block" : "block"
                }`}
              >
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
        </div>
      ))}
    </div>
  );
}