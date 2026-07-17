import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import FeaturedLanes from '../components/FeaturedLanes'; 

interface Product {
  id: number;
  title: string;
  price: number;
  image_url: string;
  category: string;
  description: string;
}

export default function Products() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>(['All']);

  useEffect(() => {
    async function fetchDynamicCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('name')
          .order('name', { ascending: true });

        if (!error && data) {
          setCategories(['All', ...data.map(item => item.name)]);
        } else {
          setCategories(['All', 'Electronics', 'Furniture', 'Accessories', 'Apparel']);
        }
      } catch (err) {
        setCategories(['All', 'Electronics', 'Furniture', 'Accessories', 'Apparel']);
      }
    }
    fetchDynamicCategories();
  }, []);

  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        let query = supabase.from('products').select('*');

        if (selectedCategory !== 'All') {
          query = query.ilike('category', selectedCategory);
        }
        if (searchQuery.trim() !== '') {
          query = query.ilike('title', `%${searchQuery.trim()}%`);
        }

        query = query.order('id', { ascending: false });

        const { data, error } = await query;
        if (!error && data) {
          setAllProducts(data as Product[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [searchQuery, selectedCategory]);

  const activeLanesList = selectedCategory === 'All' ? categories : [selectedCategory];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-2 sm:px-4 py-8">
        
        <div className="mb-8 text-center md:text-left px-2">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-2">Explore Collections</h1>
          <p className="text-gray-500 text-xs sm:text-sm mb-6">Browse through our complete repository of premium items.</p>
          
          <div className="w-full max-w-2xl md:mx-0">
            <SearchBar onSearch={setSearchQuery} isLoading={loading} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-3xs mb-8 mx-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 mr-2 hidden sm:inline">
            Filter View:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[11px] sm:text-xs font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-[1.02]'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 text-xs font-bold uppercase">Syncing inventory grid...</p>
            </div>
          ) : (
            <FeaturedLanes 
              products={allProducts} 
              categories={activeLanesList} 
              limitProducts={5} 
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}