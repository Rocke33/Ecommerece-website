import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
}

export default function CategoryPage() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 🌟 Local state tracking which individual product ID was just successfully added to the cart
  const [successProductId, setSuccessProductId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCategoryProducts() {
      if (!categoryName) return;
      
      try {
        setLoading(true);
        
        // 🌟 Fix: Decode URL parameters accurately (e.g. converting "Home%20Appliances" back to "Home Appliances")
        const cleanCategoryString = decodeURIComponent(categoryName);
        
        // 💡 Fix: Direct case-insensitive match configuration to pull newly added dynamic categories perfectly
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .ilike('category', cleanCategoryString);

        if (error) throw error;
        setProducts(data || []);
      } catch (err) {
        console.error('Error loading category inventory items:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryProducts();
  }, [categoryName]);

  const displayTitle = categoryName 
    ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1) 
    : '';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button 
              onClick={() => navigate('/')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 mb-2 block tracking-wide cursor-pointer"
            >
              ← Back to Main Showcase
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight uppercase">
              {displayTitle} Selection
            </h1>
            <p className="text-gray-400 text-[11px] sm:text-xs mt-1">
              Browsing item parameters filtered under the {categoryName} taxonomy channel.
            </p>
          </div>
          <div className="bg-white border border-gray-200 text-gray-500 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs self-start sm:self-center">
            📦 {products.length} Items Available
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-8 shadow-xs">
            <p className="text-gray-400 text-sm font-medium mb-4">No active items found inside the "{categoryName}" section.</p>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-900 text-white text-xs font-extrabold rounded-xl hover:bg-blue-600 transition-all cursor-pointer"
            >
              Return Home
            </button>
          </div>
        ) : (
          /* 📱 Optimized for mobile screen rows (grid-cols-2 with gap-3 for mobile, gap-6 for desktop) */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => {
              const isAdded = successProductId === product.id;

              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="group bg-white border border-gray-200 rounded-2xl p-2.5 sm:p-3 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square w-full rounded-xl bg-gray-50 overflow-hidden mb-3 sm:mb-4 flex items-center justify-center p-3 sm:p-4 box-border">
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                      />
                      <span className="absolute top-2 left-2 bg-gray-900/10 backdrop-blur-md text-[8px] sm:text-[9px] font-black uppercase text-gray-700 px-1.5 sm:px-2 py-0.5 rounded-md tracking-wider">
                        {product.category}
                      </span>
                    </div>

                    <div className="px-0.5 mb-1.5">
                      <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 tracking-tight line-clamp-1">
                        {product.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5 sm:mt-1 line-clamp-2 h-7 sm:h-8 leading-relaxed">
                        {product.description || 'No description config added.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 px-0.5 border-t border-gray-100 mt-1 gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                      ${product.price.toFixed(2)}
                    </span>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 w-full sm:w-auto">
                      {isAdded && (
                        <span className="text-[9px] font-bold text-emerald-600 transition-all duration-200 text-center sm:text-left animate-pulse">
                          Added!
                        </span>
                      )}

                      <button
                        disabled={isAdded}
                        onClick={async () => {
                          try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) {
                              alert('Please log in to add items to your cart!');
                              return;
                            }
                            const { error } = await supabase
                              .from('cart_items')
                              .insert([{ user_id: user.id, product_id: product.id, quantity: 1 }]);
                            
                            if (error) throw error;
                            setSuccessProductId(product.id);

                            setTimeout(() => {
                              setSuccessProductId(null);
                            }, 3000);

                          } catch (err) {
                            console.error(err);
                            alert('Could not update cart.');
                          }
                        }}
                        className={`w-full sm:w-auto px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold tracking-wide transition-all duration-200 cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white font-black cursor-default shadow-xs'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isAdded ? '✓ Added' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}