import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface OrderItem {
  order_id: number | string; 
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  products: {
    id: number; 
    title: string;
    image_url: string; 
    price: number;     
  };
}

interface Order {
  id: number | string; 
  created_at: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Pending';
  total_amount: number; 
  order_items: OrderItem[]; 
}

interface TopProductMetrics {
  id: number; 
  product_name: string;
  image_url: string;
  price: number;
  unitsSold: number;
}

export default function Orders() {
  const navigate = useNavigate(); 
  const [topProducts, setTopProducts] = useState<TopProductMetrics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlobalOrders = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            status,
            total_amount,
            order_items (
              order_id,
              product_id,
              quantity,
              price_at_purchase,
              products (
                id,
                title,
                image_url,
                price
              )
            )
          `);

        if (error) {
          console.error('Database Error:', error);
          setErrorMessage(`Database Error: ${error.message}`);
          return;
        }

        if (data) {
          const ordersData = data as unknown as Order[];

          // 📊 Aggregate metrics from global purchase database rows
          const salesMap: Record<number, { name: string; img: string; prc: number; qty: number }> = {};

          ordersData.forEach((order) => {
            if (order.order_items) {
              order.order_items.forEach((item) => {
                const productObj = item.products;
                if (productObj) {
                  const pId = productObj.id;
                  const count = item.quantity || 0;
                  
                  if (salesMap[pId]) {
                    salesMap[pId].qty += count;
                  } else {
                    salesMap[pId] = {
                      name: productObj.title,
                      img: productObj.image_url,
                      prc: productObj.price,
                      qty: count
                    };
                  }
                }
              });
            }
          });

          // 🌟 Expanded metrics array processing up to top 20 trending positions
          const sortedTopProducts: TopProductMetrics[] = Object.entries(salesMap)
            .map(([id, info]) => ({
              id: Number(id),
              product_name: info.name,
              image_url: info.img,
              price: info.prc,
              unitsSold: info.qty,
            }))
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .slice(0, 20);

          setTopProducts(sortedTopProducts);
        }
      } catch (err: any) {
        console.error('System Failure:', err);
        setErrorMessage(err.message || 'An unexpected database tracking error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalOrders();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans antialiased">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12">
        
        {/* PAGE HEADER */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Top Sale Products</h1>
          <p className="text-gray-500 text-xs font-medium">Explore the top 20 trending and most popular items calculated across live purchase metrics.</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold">
            ⚠️ {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3 bg-white border border-gray-200 rounded-3xl shadow-2xs">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-sm font-semibold tracking-wide">Assembling trending hot-list catalog items...</p>
          </div>
        ) : (
          <div>
            {topProducts.length === 0 ? (
              <div className="p-12 text-center bg-white border border-gray-200 text-gray-400 text-sm font-medium rounded-2xl shadow-2xs">
                📉 No product purchase metrics have been logged yet. Check back later once orders are completed!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {topProducts.map((prod, idx) => (
                  <div 
                    key={prod.id} 
                    onClick={() => navigate(`/product/${prod.id}`)} 
                    className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col relative shadow-2xs hover:shadow-md hover:border-gray-300 transition duration-200 cursor-pointer group"
                  >
                    {/* Position Ranking Badge Overlay */}
                    <span className="absolute top-3 left-3 z-10 bg-gray-900 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm font-mono">
                      Rank #{idx + 1}
                    </span>

                    {/* Number of times ordered indicator badge */}
                    <span className="absolute top-3 right-3 z-10 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-2xs font-mono">
                      {prod.unitsSold} Sold
                    </span>

                    {/* Product catalog image block wrapper */}
                    <div className="h-44 w-full rounded-xl bg-gray-50 flex items-center justify-center p-2 mb-4 overflow-hidden mt-6">
                      <img 
                        src={prod.image_url} 
                        alt={prod.product_name} 
                        className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-300" 
                      />
                    </div>

                    {/* Title & Pricing layout block */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug tracking-tight mb-2" title={prod.product_name}>
                        {prod.product_name}
                      </h4>
                      <div className="mt-auto pt-2 flex justify-between items-center border-t border-gray-50">
                        <span className="text-xs font-black text-gray-900 font-mono">
                          ${prod.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          View Item →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}