import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 🛠️ Added for smooth redirection
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface OrderItem {
  quantity: number;
  price_at_purchase: number;
  products: {
    title: string;
    image_url: string;
  } | null;
}

interface UserOrder {
  id: number;
  total_amount: number;
  status: string;
  shipping_address: string;
  created_at: string;
  order_items: OrderItem[];
}

export default function Profile() {
  const navigate = useNavigate(); // 🛠️ Navigation hook initialized
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null); // 🛠️ Default to null so we can check auth state
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserDataAndOrders = async () => {
      setLoading(true);
      
      // 1. Get current logged-in user session data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserEmail(user.email ?? 'Active Member');

        // 2. Query only the orders belonging to THIS logged-in user
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            total_amount,
            status,
            shipping_address,
            created_at,
            order_items (
              quantity,
              price_at_purchase,
              products ( title, image_url )
            )
          `)
          .eq('user_id', user.id) // 庁 Security filter: Only pull my own items!
          .order('created_at', { ascending: false });

        if (!error && data) {
          setOrders(data as unknown as UserOrder[]);
        }
      } else {
        setUserEmail(null); // Explicitly ensure it's null if unauthenticated
      }
      setLoading(false);
    };

    fetchUserDataAndOrders();
  }, []);

  // Simple logout click handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; // Kick back to homepage upon logout
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        {/* User Account Card */}
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-lg">
              側
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-tight">Customer Account</h2>
              <p className="text-xs text-gray-500 mt-0.5">{userEmail || 'Not Signed In'}</p>
            </div>
          </div>

          {/* 🛠️ Dynamic Auth Button: Swaps based on whether userEmail is present */}
          {userEmail ? (
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition cursor-pointer self-start sm:self-center"
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
          <div className="text-center py-12 text-sm text-gray-400 font-medium">Loading your cloud order files...</div>
        ) : !userEmail ? (
          /* 🛠️ Safe view state if unauthenticated user arrives here */
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
                {/* Individual Order Row Header bar */}
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
                      {order.status === 'Shipped' ? '泙 Shipped' : '泯 Pending Delivery'}
                    </span>
                  </div>
                </div>

                {/* List of sub-products inside this single order */}
                <div className="divide-y divide-gray-100">
                  {order.order_items.map((item, index) => (
                    <div key={index} className="p-4 flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.products?.image_url} 
                          alt={item.products?.title} 
                          className="w-10 h-10 rounded-lg object-cover bg-gray-50 border border-gray-100 flex-shrink-0" 
                        />
                        <div>
                          <h4 className="font-bold text-gray-900 leading-tight">{item.products?.title || 'Catalog Product'}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-700">${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Shipping destination disclosure */}
                <div className="bg-gray-50/50 border-t border-gray-150 px-4 py-2.5 text-[11px] text-gray-500 font-medium">
                  桃 Dispatched To: <span className="text-gray-700 font-bold">{order.shipping_address}</span>
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