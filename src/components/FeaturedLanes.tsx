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
  limitProducts: number; // 3 for Home page (forces 1 single row on mobile), 4 for Products page
}

export default function FeaturedLanes({ products, categories, limitProducts }: FeaturedLanesProps) {
  // Filter out the 'All' selector if present to get clean row category tags
  const activeCategories = categories.filter(cat => cat !== 'All');

  // Compile matching lane items
  const lanesToRender = activeCategories.map(catName => {
    const matchingItems = products.filter(
      p => p.category && p.category.toLowerCase() === catName.toLowerCase()
    );
    
    return {
      categoryName: catName,
      products: matchingItems.slice(0, limitProducts) 
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
                {lane.categoryName} Selection
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
          <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-6 w-full">
            {lane.products.map((item, index) => (
              <div 
                key={item.id} 
                // If limitProducts is 4, we hide the 4th item on mobile viewports to preserve clean spacing layouts
                className={limitProducts === 4 && index === 3 ? "hidden md:block min-w-0" : "block min-w-0"}
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