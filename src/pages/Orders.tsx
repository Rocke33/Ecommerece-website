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
  const [allOrders, setAllOrders] = useState<Order[]>([]);
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
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Database Error:', error);
          setErrorMessage(`Database Error: ${error.message}`);
          return;
        }

        if (data) {
          const ordersData = data as unknown as Order[];
          setAllOrders(ordersData);

          // 📊 Aggregate and map dynamic top sales metrics
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

          const sortedTopProducts: TopProductMetrics[] = Object.entries(salesMap)
            .map(([id, info]) => ({
              id: Number(id),
              product_name: info.name,
              image_url: info.img,
              price: info.prc,
              unitsSold: info.qty,
            }))
            .sort((a, b) => b.unitsSold - a.unitsSold)
            .slice(0, 10);

          setTopProducts(sortedTopProducts);
        }
      } catch (err: any) {
        console.error('System Failure:', err);
        setErrorMessage(err.message || 'An unexpected routing error occurred.');
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
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Global Master Ledger</h1>
            <p className="text-gray-500 text-xs font-medium">Review real-time metrics and historical transaction sheets across all customers.</p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100 shrink-0 shadow-2xs">
            Total Orders Logged: {allOrders.length}
          </span>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold">
            ⚠️ {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center gap-3 bg-white border border-gray-200 rounded-3xl shadow-2xs">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-sm font-semibold tracking-wide">Syncing transaction metrics table...</p>
          </div>
        ) : (
          <div className="space-y-12">

            {/* 🔥 TOP 10 MOST SELLING PRODUCTS GRID */}
            <div>
              <h2 className="text-base font-black text-gray-900 tracking-tight mb-4">🔥 Top 10 Most Selling Products</h2>
              
              {topProducts.length === 0 ? (
                <div className="p-8 text-center bg-white border border-gray-200 text-gray-400 text-xs font-medium rounded-2xl">
                  📉 No product units have been registered as sold yet. Complete a checkout transaction to populate this section.
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
                        Ordered {prod.unitsSold}x
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
                            View Details →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 📜 HISTORICAL ORDER LEDGER RECORDS TABLE */}
            <div>
              <h2 className="text-base font-black text-gray-900 tracking-tight mb-4">📜 Historical Order Ledger Records</h2>
              
              {allOrders.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-gray-200 bg-white rounded-3xl">
                  <span className="text-4xl block mb-2">📦</span>
                  <p className="text-gray-400 font-medium text-sm">No transactions have been recorded on this ecosystem yet.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-3xl shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="py-4 px-6">Order Identification</th>
                          <th className="py-4 px-6">Products Dispatched</th>
                          <th className="py-4 px-6 text-right">Settled Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {allOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50/50 transition">
                            {/* Order Identification */}
                            <td className="py-4 px-6 align-top whitespace-nowrap">
                              <span className="font-mono font-bold text-gray-900 block truncate max-w-[120px]" title={String(order.id)}>
                                #{String(order.id).length > 8 ? String(order.id).slice(0, 8).toUpperCase() + "..." : order.id}
                              </span>
                              <span className="text-[10px] text-gray-400 font-semibold block mt-1">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </td>
                            {/* Products Dispatched */}
                            <td className="py-4 px-6 align-top">
                              <div className="space-y-1.5 max-w-md">
                                {order.order_items?.map((item, keyIndex) => (
                                  <div key={keyIndex} className="flex justify-between items-baseline gap-4 text-[11px]">
                                    <span className="text-gray-700 font-medium truncate" title={item.products?.title}>
                                      • {item.products?.title || 'Unknown Product'}
                                    </span>
                                    <span className="text-gray-400 font-mono font-bold shrink-0">
                                      (x{item.quantity})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            {/* Settled Numeric Amount */}
                            <td className="py-4 px-6 align-top text-right font-mono font-black text-blue-600 text-sm whitespace-nowrap">
                              ${Number(order.total_amount || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}