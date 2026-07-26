import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../supabaseClient';

interface CartItemRecord {
  id: number;
  quantity: number;
  products: {
    id: number;
    title: string;
    price: number;
    image_url: string;
  };
}

export default function Cart() {
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<CartItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  
  const [uiError, setUiError] = useState<string | null>(null);
  const [uiSuccess, setUiSuccess] = useState<string | null>(null);
  
  // 🌟 State rule controlling the overlay centered checkout modal visibility
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);

  const [deliveryType, setDeliveryType] = useState<'Standard' | 'University'>('Standard');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [upazila, setUpazila] = useState<string>('');
  const [villageArea, setVillageArea] = useState<string>('');
  const [universityName, setUniversityName] = useState<string>('');
  const [hallName, setHallName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash' | 'Nagad'>('COD');
  const [transactionId, setTransactionId] = useState<string>('');

  const handleUpdateQuantity = async (itemId: number, newQty: number) => {
    if (newQty <= 0) {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
      if (!error) setCartItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      const { error } = await supabase.from('cart_items').update({ quantity: newQty }).eq('id', itemId);
      if (!error) {
        setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQty } : item));
      }
    }
  };

  const handleRemoveItem = async (id: number) => {
    try {
      const { error } = await supabase.from('cart_items').delete().eq('id', id);
      if (error) throw error;
      setCartItems(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      setUiError("Could not remove item. Please try again.");
    }
  };

  useEffect(() => {
    const fetchUserCart = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('cart_items')
          .select('id, quantity, products(id, title, price, image_url)')
          .eq('user_id', user.id);
        if (!error && data) setCartItems(data as unknown as CartItemRecord[]);
      }
      setLoading(false);
    };
    fetchUserCart();
  }, []);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.products.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 15.00 : 0;
  const grandTotal = subtotal + shipping;

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    setUiError(null);
    setUiSuccess(null);

    const sanitizedContactNumber = contactNumber.replace(/\D/g, '');

    if (!sanitizedContactNumber) {
      setUiError("Please provide a valid active Contact Phone Number.");
      return;
    }
    if (!/^\d+$/.test(sanitizedContactNumber)) {
      setUiError("Phone number must contain numbers only.");
      return;
    }
    if (deliveryType === 'Standard' && (!district.trim() || !upazila.trim() || !villageArea.trim())) {
      setUiError("Please complete all fields for Home Delivery.");
      return;
    }
    if (deliveryType === 'University' && (!universityName.trim() || !hallName.trim())) {
      setUiError("Please state your University Name and designated Resident Hall.");
      return;
    }
    if ((paymentMethod === 'bKash' || paymentMethod === 'Nagad') && !transactionId.trim()) {
      setUiError(`Please input your ${paymentMethod} Transaction ID (TrxID) to confirm payment.`);
      return;
    }

    const fallbackLegacyAddress = deliveryType === 'University'
      ? `CAMPUS: ${universityName.trim()}, Hall: ${hallName.trim()}`
      : `RESIDENTIAL: ${villageArea.trim()}, Upazila: ${upazila.trim()}, District: ${district.trim()}`;

    const shippingDestinationPayload = deliveryType === 'University' 
      ? { type: 'University', universityName: universityName.trim(), hallName: hallName.trim() }
      : { type: 'Standard', district: district.trim(), upazila: upazila.trim(), villageArea: villageArea.trim() };

    setCheckoutLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session timed out. Please sign in again.");

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            total_amount: grandTotal,
            shipping_address: fallbackLegacyAddress,
            status: 'Pending',
            contact_number: contactNumber.trim(),
            shipping_destination: shippingDestinationPayload,
            payment_details: {
              method: paymentMethod,
              trx_id: paymentMethod !== 'COD' ? transactionId.trim().toUpperCase() : 'CASH_ON_DELIVERY'
            }
          }
        ])
        .select();

      if (orderError) throw orderError;
      const newOrder = (orderData as any)[0];

      const orderItemsPayload = cartItems.map((item) => ({
        order_id: newOrder.id,
        product_id: item.products.id,
        quantity: item.quantity,
        price_at_purchase: item.products.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemsError) throw itemsError;

      await supabase.from('cart_items').delete().eq('user_id', user.id);

      setCartItems([]);
      setIsFormVisible(false); // Close modal on complete success mapping
      setUiSuccess(`🎉 Order recorded successfully via ${paymentMethod}! Redirecting...`);
      
      setTimeout(() => {
        navigate('/profile');
      }, 2500);

    } catch (err: any) {
      setUiError("Checkout failure: " + err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans relative">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Your Shopping Cart</h1>

        {uiError && !isFormVisible && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold animate-fadeIn">
            ❌ {uiError}
          </div>
        )}

        {uiSuccess && (
          <div className="mb-6 p-6 bg-emerald-50 border border-emerald-200 text-center rounded-2xl shadow-sm animate-fadeIn">
            <span className="text-3xl block mb-2">🎉</span>
            <h3 className="text-base font-black text-emerald-900 mb-1">{uiSuccess}</h3>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center border border-dashed border-gray-200 bg-white rounded-3xl">
            <p className="text-gray-500 font-medium text-sm">Loading your cart...</p>
          </div>
        ) : cartItems.length === 0 && !uiSuccess ? (
          <div className="py-16 text-center border border-dashed border-gray-200 bg-white rounded-3xl">
            <span className="text-4xl block mb-3">🛒</span>
            <p className="text-gray-400 font-medium text-sm mb-4">Your cart is completely empty.</p>
            <button onClick={() => navigate('/')} className="bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm cursor-pointer">
              Go Fill It Up
            </button>
          </div>
        ) : cartItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column Container: Item Rows */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  {/* Image & Title Info */}
                  <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                    <div className="h-16 w-16 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-100 p-1">
                      <img 
                        src={item.products.image_url} 
                        alt={item.products.title} 
                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-gray-900 truncate tracking-tight">{item.products.title}</h4>
                      <p className="text-[11px] font-semibold text-gray-400 mt-0.5">${item.products.price.toFixed(2)} each</p>
                    </div>
                  </div>

                  {/* Quantity Selector, Pricing, Delete Controls */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    
                    {/* Boxed Quantity Control Stepper */}
                    <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white shadow-2xs h-9">
                      <button 
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-9 h-full flex items-center justify-center text-base bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border-r border-gray-200 transition-all duration-150 disabled:opacity-40 disabled:hover:bg-red-50 disabled:hover:text-red-600 disabled:cursor-not-allowed font-black active:scale-95 cursor-pointer select-none"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-black text-gray-900 min-w-[32px] text-center font-mono select-none">
                        {item.quantity}
                      </span>
                      <button 
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-9 h-full flex items-center justify-center text-base bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border-l border-gray-200 transition-all duration-150 font-black active:scale-95 cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>

                    {/* Real-Time Scaled Row Price Matrix */}
                    <div className="text-right sm:min-w-[80px]">
                      <span className="text-sm sm:text-base font-black text-gray-950 font-mono tracking-tight">
                        ${(item.products.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    {/* Delete item action button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50/50 transition cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                </div>
              ))}
            </div>

            {/* Right Side Column: Order Calculation Details Summary Side Panel */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-base font-black text-gray-900 tracking-tight mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm border-b border-gray-100 pb-4 mb-5">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="font-semibold text-gray-800">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-lg font-black text-blue-600">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* 🌟 PROCEED ACTION TRIGGER BUTTON */}
              <button
                type="button"
                onClick={() => setIsFormVisible(true)}
                className="w-full flex items-center justify-center gap-2 text-xs font-extrabold bg-blue-600 text-white p-3.5 rounded-xl shadow-xs hover:bg-blue-700 transition active:scale-[0.99] cursor-pointer"
              >
                <span>Proceed to Order Form</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

          </div>
        )}
      </main>

      {/* 🌟 CENTRIC HIGH-FOCUS OVERLAY MODAL FORM */}
      {isFormVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          {/* Clickable Backdrop Outside the Container box to drop visibility */}
          <div className="absolute inset-0 cursor-default" onClick={() => setIsFormVisible(false)}></div>

          {/* Centered Modal Wrapper Panel Container */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative z-10 animate-in zoom-in-95 duration-200">
            
            {/* Header Structure Panel inside Modal */}
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h2 className="text-base font-black text-gray-900 tracking-tight">Delivery & Payment Details</h2>
              <button 
                type="button" 
                onClick={() => setIsFormVisible(false)}
                className="p-1.5 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {uiError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold">
                ❌ {uiError}
              </div>
            )}

            <div className="text-sm bg-gray-50 p-3 rounded-2xl flex justify-between items-center mb-4 border border-gray-100">
              <span className="text-gray-500 font-medium">Grand Payable Total:</span>
              <span className="text-base font-black text-blue-600 font-mono">${grandTotal.toFixed(2)}</span>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Active Contact Number *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g., 017XXXXXXXX"
                  className="w-full text-xs border border-gray-200 bg-gray-50/50 p-2.5 rounded-xl focus:bg-white focus:outline-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Delivery Channel Destination *</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button" onClick={() => setDeliveryType('Standard')}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-all ${deliveryType === 'Standard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    🏠 Home Delivery
                  </button>
                  <button
                    type="button" onClick={() => setDeliveryType('University')}
                    className={`py-2 text-[11px] font-bold rounded-lg transition-all ${deliveryType === 'University' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    🎓 Varsity Campus
                  </button>
                </div>
              </div>

              {deliveryType === 'Standard' ? (
                <div className="space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">District / Zila *</label>
                      <input
                        type="text" required={deliveryType === 'Standard'} value={district}
                        onChange={(e) => setDistrict(e.target.value)} placeholder="e.g., Dhaka"
                        className="w-full text-xs border border-gray-200 bg-gray-50/50 p-2.5 rounded-xl focus:bg-white focus:outline-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Upazila / Thana *</label>
                      <input
                        type="text" required={deliveryType === 'Standard'} value={upazila}
                        onChange={(e) => setUpazila(e.target.value)} placeholder="e.g., Mirpur"
                        className="w-full text-xs border border-gray-200 bg-gray-50/50 p-2.5 rounded-xl focus:bg-white focus:outline-blue-500 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Village, Sector, House Address *</label>
                    <textarea
                      rows={2} required={deliveryType === 'Standard'} value={villageArea}
                      onChange={(e) => setVillageArea(e.target.value)} placeholder="House #42, Road #12, Block C..."
                      className="w-full text-xs border border-gray-200 bg-gray-50/50 p-2.5 rounded-xl focus:bg-white focus:outline-blue-500 font-medium resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">University Name *</label>
                    <input
                      type="text" required={deliveryType === 'University'} value={universityName}
                      onChange={(e) => setUniversityName(e.target.value)} placeholder="e.g., Jahangirnagar University"
                      className="w-full text-xs border border-gray-200 bg-gray-50/50 p-2.5 rounded-xl focus:bg-white focus:outline-purple-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Residential Hall / Department Lounge *</label>
                    <input
                      type="text" required={deliveryType === 'University'} value={hallName}
                      onChange={(e) => setHallName(e.target.value)} placeholder="e.g., Bangabandhu Sheikh Mujibur Rahman Hall, Room 410"
                      className="w-full text-xs border border-gray-200 bg-gray-50/50 p-2.5 rounded-xl focus:bg-white focus:outline-purple-500 font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Method *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button" onClick={() => { setPaymentMethod('COD'); setTransactionId(''); }}
                    className={`p-2 border rounded-xl text-center flex flex-col items-center justify-center gap-1.5 h-20 transition-all cursor-pointer ${paymentMethod === 'COD' ? 'border-blue-600 bg-blue-50/40 text-blue-700 font-bold' : 'border-gray-200 text-gray-600'}`}
                  >
                    <img src="https://img.icons8.com/color/48/banknotes.png" alt="COD" className="h-6 w-6 object-contain" />
                    <span className="text-[10px] font-black tracking-tight leading-none block">Cash On Delivery</span>
                  </button>

                  <button
                    type="button" onClick={() => setPaymentMethod('bKash')}
                    className={`p-2 border rounded-xl text-center flex flex-col items-center justify-center gap-1.5 h-20 transition-all cursor-pointer ${paymentMethod === 'bKash' ? 'border-pink-500 bg-pink-50/40 text-pink-700 font-bold' : 'border-gray-200 text-gray-600'}`}
                  >
                    <img src="https://play-lh.googleusercontent.com/ncgi2sk_NS5u8TfsEVmdaqQhRlv6D0c9JIQ-GmHvazUbp9GDU8gxNZxaq98ysy34juOmSA15KlPLjoAgquZ0nQ" alt="bKash" className="h-6 w-auto object-contain" />
                    <span className="text-[10px] font-black tracking-tight leading-none block">bKash Personal</span>
                  </button>

                  <button
                    type="button" onClick={() => setPaymentMethod('Nagad')}
                    className={`p-2 border rounded-xl text-center flex flex-col items-center justify-center gap-1.5 h-20 transition-all cursor-pointer ${paymentMethod === 'Nagad' ? 'border-orange-500 bg-orange-50/40 text-orange-700 font-bold' : 'border-gray-200 text-gray-600'}`}
                  >
                    <img src="https://play-lh.googleusercontent.com/a4Qhv-EDolTnZlCq5p1ybZRF4J0dHKjDQEYrfOXqjsHvsKX5EXHVc8M0Vbh7Qfsn8LeNBIWdP6pbzHkEPMs3MQ" alt="Nagad" className="h-6 w-auto object-contain" />
                    <span className="text-[10px] font-black tracking-tight leading-none block">Nagad Account</span>
                  </button>
                </div>
              </div>

              {paymentMethod !== 'COD' && (
                <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl space-y-2.5 animate-fadeIn">
                  <div className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    👉 Please Send Money <span className="font-bold text-gray-900">${grandTotal.toFixed(2)}</span> to our personal wallet number: <span className="text-gray-900 font-black tracking-wide">01648038036</span>, then input the transaction reference ID below:
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Transaction ID (TrxID) *</label>
                    <input
                      type="text" required value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g., BK92837482"
                      className="w-full text-xs border border-gray-200 bg-white p-2.5 rounded-xl focus:outline-blue-500 font-mono tracking-wider font-bold uppercase"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit" disabled={checkoutLoading}
                className="w-full text-xs font-bold bg-gray-900 text-white p-3.5 rounded-xl shadow-sm hover:bg-blue-600 transition active:scale-[0.99] disabled:bg-gray-100 cursor-pointer mt-2"
              >
                {checkoutLoading ? 'Authenticating Order Packet...' : `Complete Order ($${grandTotal.toFixed(2)})`}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}