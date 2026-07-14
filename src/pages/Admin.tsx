import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface OrderItem {
  quantity: number;
  price_at_purchase: number;
  products: {
    title: string;
  } | null;
}

interface AdminOrder {
  id: number;
  total_amount: number;
  status: string;
  shipping_address: string;
  created_at: string;
  contact_number: string | null; 
  payment_details: { method: string; trx_id: string } | null;
  shipping_destination: { 
    type: 'Standard' | 'University'; 
    district?: string; 
    upazila?: string; 
    villageArea?: string; 
    universityName?: string; 
    hallName?: string; 
  } | null;
  order_items: OrderItem[];
}

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  image_url: string;
  category: string;
}

interface Category {
  id: string;
  name: string;
}

export default function Admin() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); 
  const [loading, setLoading] = useState<boolean>(true);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newProduct, setNewProduct] = useState({
    title: '',
    price: '',
    description: '',
    image_url: '',
    category: ''
  });

  // 🌟 CRITICAL ENHANCEMENT: Explicit cleanup hook to wipe state when navigating away
  useEffect(() => {
    return () => {
      setIsAdminAuthenticated(false);
    };
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (data) setCategories(data);
  };

  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const fetchAdminData = async () => {
      setLoading(true);
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, total_amount, status, shipping_address, created_at, contact_number, payment_details, shipping_destination, order_items(quantity, price_at_purchase, products(title))')
        .order('created_at', { ascending: false });

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false });

      await fetchCategories();

      if (ordersData) setOrders(ordersData as unknown as AdminOrder[]);
      if (productsData) setProducts(productsData);
      setLoading(false);
    };

    fetchAdminData();
  }, [isAdminAuthenticated]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'supersecretadmin123') {
      setIsAdminAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('❌ Invalid Administrative Access Key. Access Denied.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminPassword('');
  };

  const handleUpdateStatus = async (orderId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'Pending' ? 'Delivered' : 'Pending';
    const { error } = await supabase.from('orders').update({ status: nextStatus }).eq('id', orderId);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
    } else {
      alert(`Error updating order status: ${error.message}`);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm(`⚠️ Are you sure you want to permanently delete and wipe Order #${orderId} from active logs? This cannot be undone.`)) return;
    
    try {
      await supabase.from('order_items').delete().eq('order_id', orderId);
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      
      setOrders(prev => prev.filter(o => o.id !== orderId));
      alert(`🗑️ Order #${orderId} records completely purged.`);
    } catch (err: any) {
      alert(`Could not erase order file row: ${err.message}`);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setFormLoading(true);
    const { error } = await supabase.from('categories').insert([{ name: newCategoryName.trim() }]);
    if (error) alert(error.message);
    else {
      setNewCategoryName('');
      await fetchCategories();
    }
    setFormLoading(false);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setFormLoading(true);
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert(error.message);
    else await fetchCategories();
    setFormLoading(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title || !newProduct.price || !newProduct.image_url || !newProduct.category) {
      alert("Please choose a category lane and fill all attributes.");
      return;
    }
    setFormLoading(true);
    const { data, error } = await supabase.from('products').insert([
      {
        title: newProduct.title,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
        image_url: newProduct.image_url,
        category: newProduct.category
      }
    ]).select();

    if (error) alert(error.message);
    else if (data) {
      setProducts(prev => [data[0], ...prev]);
      setNewProduct({ title: '', price: '', description: '', image_url: '', category: '' });
      alert("🎉 Product uploaded safely!");
    }
    setFormLoading(false);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Delete product?")) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (!error) setProducts(prev => prev.filter(p => p.id !== productId));
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-900 font-sans text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <form onSubmit={handleAdminLogin} className="max-w-md w-full bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-xl text-center space-y-4">
            <span className="text-4xl block mb-3">🔒</span>
            <h1 className="text-xl font-black text-white">Merchant Gateway</h1>
            <input
              type="password" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter Password..."
              className="w-full text-center text-sm border border-gray-600 bg-gray-900 p-3 rounded-xl focus:outline-none focus:border-blue-500 text-white font-mono tracking-widest"
            />
            {authError && <p className="text-xs font-bold text-red-400">{authError}</p>}
            <button type="submit" className="w-full text-xs font-bold bg-blue-600 p-3 rounded-xl hover:bg-blue-500 transition">Unlock Terminal</button>
          </form>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Admin Operations Suite</h1>
            <button onClick={handleAdminLogout} className="text-[10px] font-bold bg-gray-200 px-2 py-0.5 rounded-md mt-1 cursor-pointer">Lock Console 🔒</button>
          </div>
          <div className="flex bg-gray-200 p-1 rounded-xl">
            <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'orders' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>📋 Orders ({orders.length})</button>
            <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'inventory' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>📦 Inventory ({products.length})</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs text-gray-400 animate-pulse">Loading catalog matrix...</div>
        ) : activeTab === 'orders' ? (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full text-left min-w-[1050px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Ref & Time</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Detailed Destination</th>
                  <th className="p-4">Products Breakdown</th>
                  <th className="p-4">Payment Audit</th>
                  <th className="p-4 text-center">Fulfillment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm bg-white">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/40 transition duration-150">
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-black text-gray-900">#{order.id}</div>
                      <div className="text-[11px] text-gray-400 font-bold mt-0.5 tracking-wide">
                        {order.created_at ? new Date(order.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : 'N/A'}
                      </div>
                    </td>

                    <td className="p-4 font-mono text-blue-600 font-bold whitespace-nowrap">
                      {order.contact_number || 'N/A'}
                    </td>

                    <td className="p-4 max-w-xs">
                      {order.shipping_destination?.type === 'University' ? (
                        <div className="text-gray-800 font-medium">
                          🎓 <span className="font-bold">{order.shipping_destination.universityName}</span>
                          <span className="block text-xs text-gray-500 mt-0.5">{order.shipping_destination.hallName}</span>
                        </div>
                      ) : (
                        <div className="text-gray-800 font-medium truncate">
                          🏠 {order.shipping_destination?.villageArea || order.shipping_address}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-xs text-gray-600 font-medium space-y-0.5">
                      {order.order_items.map((item, i) => (
                        <div key={i} className="truncate max-w-sm">
                          • {item.products?.title || 'Unknown Item'} <span className="text-gray-400 font-bold">x{item.quantity}</span>
                        </div>
                      ))}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="font-black text-gray-900">${order.total_amount.toFixed(2)}</div>
                      <div className="mt-1 flex flex-col gap-0.5">
                        <span className="inline-block bg-gray-100 text-gray-600 border border-gray-200 text-[9px] uppercase font-black px-1.5 py-0.5 rounded tracking-wide w-fit">
                          💳 {order.payment_details?.method || 'Cash on Delivery'}
                        </span>
                        {order.payment_details?.trx_id && (
                          <span className="text-[10px] font-mono text-gray-400 font-semibold block">
                            TxID: {order.payment_details.trx_id}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleUpdateStatus(order.id, order.status)} 
                          className={`min-w-[110px] px-3 py-1.5 text-xs font-black rounded-xl border transition active:scale-95 cursor-pointer shadow-sm ${
                            order.status === 'Delivered' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70' 
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70'
                          }`}
                        >
                          {order.status === 'Delivered' ? '🟢 Delivered ✓' : '🟡 Pending'}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl text-red-500 hover:text-red-700 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
                          title="Purge Order Row"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="bg-white border p-6 rounded-2xl shadow-sm">
                <h3 className="text-xs font-black uppercase mb-4 text-gray-900">Launch New Inventory</h3>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <input type="text" placeholder="Product Title" required className="w-full text-xs p-2.5 border rounded-xl bg-gray-50" value={newProduct.title} onChange={(e) => setNewProduct({...newProduct, title: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Price" step="0.01" required className="w-full text-xs p-2.5 border rounded-xl bg-gray-50" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
                    <select required className="w-full text-xs p-2.5 border rounded-xl bg-gray-50 font-bold" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}>
                      <option value="">-- Lane --</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <input type="url" placeholder="Image URL" required className="w-full text-xs p-2.5 border rounded-xl bg-gray-50" value={newProduct.image_url} onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})} />
                  <textarea placeholder="Description" rows={3} className="w-full text-xs p-2.5 border rounded-xl bg-gray-50 resize-none" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
                  <button type="submit" disabled={formLoading} className="w-full text-xs font-bold bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500 transition disabled:opacity-50 cursor-pointer">🚀 Publish Live</button>
                </form>
              </div>

              <div className="bg-white border p-6 rounded-2xl shadow-sm">
                <h3 className="text-xs font-black uppercase mb-3 text-gray-900">Manage Custom Lanes</h3>
                <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                  <input type="text" placeholder="New lane name..." required className="flex-1 text-xs p-2 border rounded-xl bg-gray-50" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                  <button type="submit" disabled={formLoading} className="text-xs font-bold bg-gray-900 text-white px-4 rounded-xl hover:bg-blue-600 transition disabled:opacity-50 cursor-pointer">Add</button>
                </form>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {categories.map(c => (
                    <div key={c.id} className="flex justify-between items-center bg-gray-50 border p-2 rounded-lg text-xs font-bold text-gray-700">
                      <span>{c.name}</span>
                      <button type="button" onClick={() => handleDeleteCategory(c.id, c.name)} className="text-red-500 hover:underline cursor-pointer">Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-xs font-black uppercase text-gray-900 mb-2">Active Catalog Records</h3>
              {products.map((product) => (
                <div key={product.id} className="bg-white border p-4 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={product.image_url} alt={product.title} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm leading-none">{product.title}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs font-extrabold text-blue-600">${product.price.toFixed(2)}</span>
                        <span className="text-[9px] uppercase font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{product.category}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteProduct(product.id)} className="text-gray-400 hover:text-red-500 p-2 text-xs cursor-pointer">🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}