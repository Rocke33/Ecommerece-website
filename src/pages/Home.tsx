import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import SearchBar from '../components/SearchBar';
import ProductGrid from '../components/ProductGrid'; 
import FeaturedLanes from '../components/FeaturedLanes'; 
import Subscribe from '../components/Subscribe';
import Footer from '../components/Footer';

interface Product {
  id: number;
  title: string;
  price: number;
  image_url: string;
  category: string;
  description: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categoriesList, setCategoriesList] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5; // Updated to 5 items to match the responsive desktop width layout

  useEffect(() => {
    async function fetchDynamicCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('name')
          .order('name', { ascending: true });

        if (!error && data) {
          setCategoriesList(['All', ...data.map(item => item.name)]);
        } else {
          setCategoriesList(['All', 'Electronics', 'Furniture', 'Accessories', 'Apparel']);
        }
      } catch (err) {
        setCategoriesList(['All', 'Electronics', 'Furniture', 'Accessories', 'Apparel']);
      }
    }
    fetchDynamicCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    // If the user has typed a query, snap the view up so they see results instantly
    if (searchQuery.trim() !== '') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth' // Adds a smooth scrolling animation to the top
      });
    }
  }, [searchQuery]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let queryBuilder = supabase.from('products').select('*');
        
        if (selectedCategory !== 'All') {
          queryBuilder = queryBuilder.ilike('category', selectedCategory);
        }

        const cleanedSearchQuery = searchQuery.trim();
        if (cleanedSearchQuery !== '') {
          queryBuilder = queryBuilder.ilike('title', `%${cleanedSearchQuery}%`);
        }

        queryBuilder = queryBuilder.order('id', { ascending: false });

        const { data, error } = await queryBuilder;
        if (!error && data) {
          setAllProducts(data as Product[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, selectedCategory]);

  const isSearching = searchQuery.trim() !== '';
  const isFilteringCategory = selectedCategory !== 'All';
  const isSearchingOrFiltering = isSearching || isFilteringCategory;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = allProducts.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(allProducts.length / itemsPerPage);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <Navbar />
        <div className="max-w-6xl w-full mx-auto px-4 pb-3 pt-1">
          <SearchBar onSearch={setSearchQuery} isLoading={loading} />
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-4 box-border">
        
        {isSearching && (
          <section id="search-view" className="my-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Results for "{searchQuery.trim()}"
              </h2>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                {allProducts.length} Items Found
              </span>
            </div>
            
            <ProductGrid products={paginatedProducts} loading={loading} />
          </section>
        )}

        {!isSearching && <Hero />}

        <section className="my-10">
          <div className="flex flex-wrap justify-center gap-1.5 pb-4 border-b border-gray-200">
            {categoriesList.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setSearchQuery(''); 
                }}
                className={`px-3.5 py-2 text-[10px] sm:text-xs font-bold rounded-xl border uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {!isSearching && (
          isFilteringCategory ? (
            <section id="category-view" className="my-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight uppercase">
                  {selectedCategory} Collection
                </h2>
              </div>
              <ProductGrid products={paginatedProducts} loading={loading} />
            </section>
          ) : (
            <section className="my-6">
              {loading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400 text-xs font-bold uppercase">Loading Lanes...</p>
                </div>
              ) : (
                <FeaturedLanes 
                  products={allProducts} 
                  categories={categoriesList} 
                  limitProducts={5} 
                />
              )}
            </section>
          )
        )}

        {isSearchingOrFiltering && totalPages > 1 && !loading && (
          <div className="mt-12 mb-6 flex items-center justify-center gap-2 bg-white border border-gray-200 p-4 rounded-2xl shadow-3xs">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              ← Prev
            </button>
            <span className="text-xs font-black px-4 text-gray-700">Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40 cursor-pointer"
            >
              Next →
            </button>
          </div>
        )}

        <Subscribe />
      </main>

      <Footer />
    </div>
  );
}