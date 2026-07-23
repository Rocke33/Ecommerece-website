import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import OrderSkeleton from '../components/OrderSkeleton'; 
import { useNetworkStatus } from '../hooks/useNetworkStatus'; 
import { fetchWithRetry } from '../utils/networkRetry';       
import type { UserOrder } from '../types/database';         // 🚀 Centralized unified types
import { getErrorMessage } from '../utils/errorHandling';   // 🚀 Unsafe any error remover

export default function Profile() {
  const navigate = useNavigate();
  const isOnline = useNetworkStatus(); 
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [networkError, setNetworkError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchUserDataAndOrders = async () => {
      if (!isOnline) {
        setLoading(false);
        return;
      }

      try {
        if (!isMounted) return;
        setLoading(true);
        setNetworkError(null);
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (user) {
          if (isMounted) setUserEmail(user.email ?? 'Active Member');

          const data = await fetchWithRetry(async () => {
            const { data: res, error } = await supabase
              .from('orders')
              .select(`
                id,
                total_amount,
                status,
                shipping_address,
                created_at,
                order_items!inner (
                  quantity,
                  price_at_purchase,
                  products!inner ( title, image_url )
                )
              `)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

            if (error) throw error;
            return res;
          });

          if (isMounted && data) {
            setOrders(data as unknown as UserOrder[]);
          }
        }
      } catch (err) {
        if (isMounted) {
          // 🛡️ Safe extraction of unknown error shapes using the type guard helper
          const cleanMessage = getErrorMessage(err);
          setNetworkError("Unable to establish secure connection. Retrying failed transactions.");
          console.error("Network Failover Intercept Log:", cleanMessage);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserDataAndOrders();

    return () => {
      isMounted = false;
    };
  }, [isOnline]); 

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error("Signout error:", getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        {!isOnline && (
          <div className="mb-6 p-3 bg-amber-500 text-white rounded-xl text-xs font-black tracking-wide uppercase text-center animate-pulse shadow-sm">
            ⚠️ Operating in Offline Mode. Live account changes are paused.
          </div>
        )}

        {networkError && isOnline && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold text-center">
            {networkError}
          </div>
        )}

        {/* User Account Card */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-lg">
              👤
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-tight">Customer Account</h2>
              <p className="text-xs text-gray-500 mt-0.5">{userEmail || 'Not Signed In'}</p>
            </div>
          </div>

          {userEmail ? (
            <button
              disabled={!isOnline}
              onClick={handleLogout}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer self-start sm:self-center ${
                isOnline ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Sign Out Account
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition cursor-pointer self-start sm:self-center"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Order History Section */}
        <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase mb-4">Your Past Order Dispatches</h3>

        {loading ? (
          /* 🚀 REPLACED: Jumpy text string replaced with clean production shimmer layout skeleton */
          <OrderSkeleton />
        ) : !userEmail ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl text-sm text-gray-400">
            Please log in to view your order dispatch history records.
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl text-sm text-gray-400">
            You haven't placed any orders yet. Go add items to your cart!
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-wrap justify-between items-center gap-2 text-xs">
                  <div className="flex gap-4 text-gray-500 font-medium">
                    <div>
                      <span>ORDER PLACED: </span>
                      <span className="text-gray-900 font-bold">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span>TOTAL: </span>
                      <span className="text-gray-900 font-bold">${order.total_amount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span>ORDER REF: </span>
                      <span className="text-gray-900 font-bold">#{order.id}</span>
                    </div>
                  </div>
                  <div>
                    <span className={`px-3 py-1 font-black rounded-full border ${
                      order.status === 'Shipped' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {order.status === 'Shipped' ? '📦 Shipped' : '⏳ Pending Delivery'}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {order.order_items.map((item, index) => (
                    <div key={index} className="p-4 flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        {item.products?.image_url ? (
                          <img 
                            src={item.products.image_url} 
                            alt={item.products.title} 
                            loading="lazy"
                            className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-100 flex-shrink-0" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">📦</div>
                        )}
                        <div>
                          <h4 className="font-bold text-gray-900 leading-tight">{item.products?.title || 'Catalog Product'}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-700">${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50/50 border-t border-gray-150 px-4 py-2.5 text-[11px] text-gray-500 font-medium">
                  📍 Dispatched To: <span className="text-gray-700 font-bold">{order.shipping_address}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}