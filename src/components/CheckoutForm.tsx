import { useState } from 'react';
import { supabase } from '../supabaseClient';

interface CheckoutProps {
  cartItems: any[];
  subtotal: number;
  onOrderSuccess: () => void;
}

export default function CheckoutForm({ cartItems, subtotal, onOrderSuccess }: CheckoutProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  
  // Address Configuration Triggers
  const [addressType, setAddressType] = useState<'Standard' | 'University'>('Standard');
  const [district, setDistrict] = useState<string>('');
  const [upazila, setUpazila] = useState<string>('');
  const [villageArea, setVillageArea] = useState<string>('');
  const [universityName, setUniversityName] = useState<string>('');
  const [hallName, setHallName] = useState<string>('');

  // 🇧🇩 Payment States
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash' | 'Nagad'>('COD');
  const [transactionId, setTransactionId] = useState<string>('');

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !phone) {
      alert("Please fill in your Name and Contact Number.");
      return;
    }

    if ((paymentMethod === 'bKash' || paymentMethod === 'Nagad') && !transactionId.trim()) {
      alert(`Please input your ${paymentMethod} verification Transaction ID (TrxID).`);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication error. Please sign in.");

      // Compile address breakdown based on location choice
      const shippingDestination = addressType === 'Standard' 
        ? { type: 'Standard', district, upazila, villageArea }
        : { type: 'University', universityName, hallName };

      // Convert destination into a readable summary string for legacy address compatibility
      const fullAddressSummary = addressType === 'Standard'
        ? `Area: ${villageArea}, Upazila: ${upazila}, District: ${district}`
        : `Hall: ${hallName}, University: ${universityName}`;

      // 1. Submit Core Summary Log to Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            total_amount: subtotal,
            shipping_address: fullAddressSummary, // legacy string safety fallback
            status: 'Pending',
            contact_number: phone,
            shipping_destination: shippingDestination, // broken-down data structure
            payment_details: {
              method: paymentMethod,
              trx_id: paymentMethod !== 'COD' ? transactionId.trim().toUpperCase() : 'CASH_ON_DELIVERY'
            }
          }
        ])
        .select();

      if (orderError) throw orderError;
      const newOrder = orderData[0];

      // 2. Insert itemized line breakdowns
      const orderItemsPayload = cartItems.map((item) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.products.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemsError) throw itemsError;

      // 3. Wipe shopping cart clean upon success
      await supabase.from('cart_items').delete().eq('user_id', user.id);

      alert(`🎉 Congratulations! Your order has been placed via ${paymentMethod}.`);
      onOrderSuccess();
      window.location.href = '/profile';

    } catch (err: any) {
      alert("Order compilation failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto bg-white border border-gray-200 p-6 rounded-2xl shadow-sm my-6 font-sans text-gray-800">
      <h2 className="text-lg font-black text-gray-900 tracking-tight mb-4 border-b border-gray-100 pb-2">📦 Courier Delivery Information</h2>
      
      <form onSubmit={handleSubmitOrder} className="space-y-4">
        {/* Core Customer Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Full Name *</label>
            <input
              type="text" required value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Ahsan Habib"
              className="w-full text-xs border border-gray-200 bg-gray-50/50 p-2.5 rounded-xl focus:bg-white focus:outline-blue-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Active Phone Number *</label>
            <input
              type="tel" required value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 01XXXXXXXXX"
              className="w-full text-xs border border-gray-200 bg-gray-50/50 p-2.5 rounded-xl focus:bg-white focus:outline-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Address Location Selection Switcher */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Destination Mapping Type</label>
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
            <button
              type="button" onClick={() => setAddressType('Standard')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${addressType === 'Standard' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
            >
              🏠 Standard Residential Address
            </button>
            <button
              type="button" onClick={() => setAddressType('University')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${addressType === 'University' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
            >
              🎓 University Campus / Residential Hall
            </button>
          </div>
        </div>

        {/* Dynamic Fields Conditional Branching */}
        {addressType === 'Standard' ? (
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-150 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">District / Zila *</label>
                <input
                  type="text" required={addressType === 'Standard'} value={district}
                  onChange={(e) => setDistrict(e.target.value)} placeholder="e.g., Dhaka"
                  className="w-full text-xs border border-gray-200 bg-white p-2.5 rounded-xl focus:outline-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Upazila / Thana *</label>
                <input
                  type="text" required={addressType === 'Standard'} value={upazila}
                  onChange={(e) => setUpazila(e.target.value)} placeholder="e.g., Mirpur"
                  className="w-full text-xs border border-gray-200 bg-white p-2.5 rounded-xl focus:outline-blue-500 font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Village / Sector / Area Road House details *</label>
              <input
                type="text" required={addressType === 'Standard'} value={villageArea}
                onChange={(e) => setVillageArea(e.target.value)} placeholder="e.g., House 12, Road 4, Sector 10"
                className="w-full text-xs border border-gray-200 bg-white p-2.5 rounded-xl focus:outline-blue-500 font-medium"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-150 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">University Name *</label>
                <input
                  type="text" required={addressType === 'University'} value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)} placeholder="e.g., Dhaka University / RUET"
                  className="w-full text-xs border border-gray-200 bg-white p-2.5 rounded-xl focus:outline-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Residential Hall Name *</label>
                <input
                  type="text" required={addressType === 'University'} value={hallName}
                  onChange={(e) => setHallName(e.target.value)} placeholder="e.g., Shahidullah Hall, Room 302"
                  className="w-full text-xs border border-gray-200 bg-white p-2.5 rounded-xl focus:outline-blue-500 font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* 🇧🇩 PAYMENT METHOD SELECTOR MATRIX */}
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Select Payment Method *</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button" onClick={() => { setPaymentMethod('COD'); setTransactionId(''); }}
              className={`p-3 border rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer ${paymentMethod === 'COD' ? 'border-blue-600 bg-blue-50/40 text-blue-700 font-bold' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
            >
              <span className="text-lg mb-0.5">💵</span>
              <span className="text-[10px] font-black tracking-tight leading-none">Cash On Delivery</span>
            </button>

            <button
              type="button" onClick={() => setPaymentMethod('bKash')}
              className={`p-3 border rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer ${paymentMethod === 'bKash' ? 'border-pink-500 bg-pink-50/40 text-pink-700 font-bold' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
            >
              <span className="text-lg mb-0.5">🌸</span>
              <span className="text-[10px] font-black tracking-tight leading-none">bKash (01648038036)</span>
            </button>

            <button
              type="button" onClick={() => setPaymentMethod('Nagad')}
              className={`p-3 border rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer ${paymentMethod === 'Nagad' ? 'border-orange-500 bg-orange-50/40 text-orange-700 font-bold' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
            >
              <span className="text-lg mb-0.5">🔥</span>
              <span className="text-[10px] font-black tracking-tight leading-none">Nagad (01648038036)</span>
            </button>
          </div>
        </div>

        {/* TRANSACTION REFERENCE PANEL FOR WALLETS */}
        {paymentMethod !== 'COD' && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2.5 animate-fadeIn">
            <div className="text-[11px] text-amber-800 font-medium leading-relaxed">
              👉 Please use your wallet app to **Send Money** or **Cash In** the amount of <span className="font-black text-gray-900">${subtotal.toFixed(2)}</span> to our personal matching wallet number: <span className="text-gray-900 font-black underline tracking-wider">01648038036</span>. Once done, paste your payment statement receipt confirmation TrxID token reference string below:
            </div>
            <div>
              <label className="block text-[9px] font-bold text-amber-700 uppercase mb-1">Verification Transaction ID (TrxID) *</label>
              <input
                type="text" required value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g., BK92837482"
                className="w-full text-xs border border-amber-300 bg-white p-2.5 rounded-xl focus:outline-amber-500 font-mono tracking-wider font-bold uppercase"
              />
            </div>
          </div>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full text-xs font-bold bg-gray-900 text-white p-3 rounded-xl shadow-sm hover:bg-blue-600 transition disabled:bg-gray-200 cursor-pointer"
        >
          {loading ? 'Authenticating Order Packet...' : `Secure Purchase Authorization ($${subtotal.toFixed(2)})`}
        </button>
      </form>
    </div>
  );
}