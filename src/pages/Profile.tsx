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

  // State to track the active order selected for the Google Drive preview style voucher
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<any | null>(null);

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
                payment_details,
                shipping_destination,
                order_items!inner (
                  quantity,
                  price_at_purchase,
                  products!inner ( id, title, image_url )
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

  const triggerSystemPrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans relative">
      {/* Dynamic Native Print Rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          html, body {
            height: 99vh !important;
            overflow: hidden !important;
            background: #fff !important;
            font-size: 14px !important;
          }
          #drive-invoice-viewport, #drive-invoice-viewport * {
            visibility: visible !important;
          }
          #drive-invoice-viewport {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print-action {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex flex-col min-h-screen w-full print:hidden">
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
                    <div className="flex items-center gap-2">
                      {/* Integrated Action Trigger for Invoice Modal View */}
                      <button
                        onClick={() => {
                          setActiveInvoiceOrder(order);
                          document.body.style.overflow = 'hidden'; 
                        }}
                        className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition cursor-pointer"
                      >
                        📄 View Voucher
                      </button>
                      <span className={`px-3 py-1 font-black rounded-full border ${
                        order.status === 'Shipped' || order.status === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {order.status === 'Shipped' || order.status === 'Delivered' ? '📦 Dispatched' : '⏳ Pending Delivery'}
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

      {/* 🌐 GOOGLE DRIVE STYLE VOUCHER MODAL CONTAINER */}
      {activeInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col justify-start items-center overflow-y-auto p-2 sm:p-6 select-none animate-fadeIn">
          
          {/* Top Control Action Bar */}
          <div className="no-print-action max-w-4xl w-[95vw] bg-gray-800 text-white rounded-t-2xl px-4 py-3 border-b border-gray-700 flex justify-between items-center shadow-2xl">
            <div className="flex items-center gap-2.5 truncate">
              <span className="text-xl shrink-0">📄</span>
              <div className="truncate text-left">
                <p className="text-xs sm:text-sm font-bold truncate">Receipt_Order_#000{activeInvoiceOrder.id}.pdf</p>
                <p className="text-[10px] text-gray-400 font-semibold">Document Cloud Link Preview</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={triggerSystemPrint}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-[11px] font-black rounded-xl transition cursor-pointer text-white shadow-md flex items-center gap-1"
              >
                📥 Save / Print
              </button>
              <button 
                onClick={() => {
                  setActiveInvoiceOrder(null);
                  document.body.style.overflow = 'unset'; 
                }}
                className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-xl transition cursor-pointer text-sm text-gray-300"
                title="Close Viewer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 📄 COMPACT HIGH-CONTRAST INVOICE CANVAS (MOBILE SAFE - NO HORIZONTAL SCROLL) */}
          <div 
            id="drive-invoice-viewport" 
            className="max-w-4xl w-[95vw] bg-white text-black p-4 sm:p-12 shadow-sm rounded-b-2xl min-h-[70vh] flex flex-col justify-between font-sans leading-relaxed text-sm sm:text-base tracking-normal border border-gray-200 border-t-0"
          >
            <div className="break-inside-avoid">
              
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b-4 border-gray-900 pb-4 sm:pb-6 mb-6 sm:mb-8 gap-4">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter text-gray-900">BONGO SHOP</h1>
                  <p className="text-[11px] sm:text-sm font-bold text-gray-500 tracking-wide mt-0.5">Premium E-Commerce Operations Hub</p>
                  <p className="text-[10px] sm:text-xs text-blue-600 font-black mt-1">System User Receipt Instance</p>
                </div>
                <div className="text-left sm:text-right">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">INVOICE STATEMENT</h2>
                  <p className="text-sm sm:text-base font-black text-blue-600 mt-0.5">Order Sequence: #000{activeInvoiceOrder.id}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 font-bold mt-1">
                    Date Generated: {activeInvoiceOrder.created_at ? new Date(activeInvoiceOrder.created_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Delivery / Recipient Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8 bg-gray-50 border border-gray-150 rounded-2xl p-4 sm:p-5">
                <div>
                  <h3 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Recipient Identity</h3>
                  <p className="text-sm sm:text-base font-black text-gray-900">Verified Customer Account</p>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">✉️ {userEmail || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Destination Mapping</h3>
                  {activeInvoiceOrder.shipping_destination?.type === 'University' ? (
                    <div className="text-xs sm:text-sm text-gray-800 font-semibold leading-relaxed">
                      🎓 Institution: <span className="font-black text-gray-900">{activeInvoiceOrder.shipping_destination.universityName}</span> <br/>
                      📌 Delivery Zone: {activeInvoiceOrder.shipping_destination.hallName}
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-gray-800 font-semibold leading-relaxed">
                      🏠 Street Address: {activeInvoiceOrder.shipping_destination?.villageArea || activeInvoiceOrder.shipping_address} <br/>
                      📌 Region: {activeInvoiceOrder.shipping_destination?.upazila || 'N/A'}, {activeInvoiceOrder.shipping_destination?.district || 'N/A'}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Line Breakdown Matrix */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-2.5">Purchased Itemization</h3>
                <div className="w-full">
                  <table className="w-full text-left text-[11px] sm:text-sm table-layout-fixed">
                    <thead>
                      <tr className="border-b-2 border-gray-900 font-black text-gray-700 bg-gray-100">
                        <th className="py-2 px-1 sm:py-2.5 sm:px-3 w-[45%]">Product Name</th>
                        <th className="py-2 px-1 sm:py-2.5 sm:px-3 text-center w-[10%]">Qty</th>
                        <th className="py-2 px-1 sm:py-2.5 sm:px-3 text-right w-[20%]">Rate</th>
                        <th className="py-2 px-1 sm:py-2.5 sm:px-3 text-right w-[25%]">Net Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activeInvoiceOrder.order_items.map((item: any, index: number) => (
                        <tr key={index} className="font-semibold text-gray-800">
                          <td className="py-2 px-1 sm:py-3 sm:px-3 font-bold text-gray-900 break-words">
                            {item.products?.title || 'Unknown Catalog Item'}
                          </td>
                          <td className="py-2 px-1 sm:py-3 sm:px-3 text-center font-mono">{item.quantity}</td>
                          <td className="py-2 px-1 sm:py-3 sm:px-3 text-right font-mono">${item.price_at_purchase.toFixed(2)}</td>
                          <td className="py-2 px-1 sm:py-3 sm:px-3 text-right font-mono font-black text-gray-900">${(item.quantity * item.price_at_purchase).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Financial Ledger Section */}
            <div className="break-inside-avoid mt-auto pt-4 sm:pt-6 border-t-2 border-gray-900">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <h3 className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Audit Clearing Specification</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black bg-gray-100 border border-gray-300 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl uppercase tracking-wide">
                      {activeInvoiceOrder.payment_details?.method === 'COD' ? '💵 Cash On Delivery' : activeInvoiceOrder.payment_details?.method === 'bKash' ? '🌸 bKash Network' : '🔥 Nagad Core'}
                    </span>
                  </div>
                </div>
                
                <div className="text-right w-full sm:w-auto min-w-[180px] sm:min-w-[200px] space-y-1">
                  <div className="flex justify-between text-[11px] sm:text-xs font-bold text-gray-500">
                    <span>Products Subtotal:</span>
                    <span className="font-mono">${activeInvoiceOrder.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] sm:text-xs font-bold text-gray-500 border-b border-gray-200 pb-1">
                    <span>Delivery Charge:</span>
                    <span className="font-mono text-emerald-600">+$15.00</span>
                  </div>
                  <div className="flex justify-between items-end pt-1">
                    <span className="text-[11px] sm:text-xs font-black text-gray-600 uppercase tracking-wider">Grand Total:</span>
                    <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter font-mono">
                      ${(activeInvoiceOrder.total_amount + 15).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 sm:mt-12 text-center text-[9px] sm:text-[10px] text-gray-400 font-bold border-t border-gray-100 pt-3 tracking-wider uppercase">
                Customer Copy Record • System Verification Secured by Supabase Middleware
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}