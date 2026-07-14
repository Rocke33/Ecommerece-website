import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { supabase } from '../supabaseClient';

export default function Navbar() {
  const [cartCount, setCartCount] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    const getSessionAndCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('cart_items')
          .select('quantity')
          .eq('user_id', user.id);

        if (!error && data) {
          const totalItems = data.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(totalItems);
        }
      } else {
        setCartCount(0);
      }
    };

    getSessionAndCount();

    const cartSubscription = supabase
      .channel('realtime-navbar-cart')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items' }, () => {
        getSessionAndCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(cartSubscription);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="w-full border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 font-sans z-50 transition-all duration-300">
      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="text-xl font-extrabold text-gray-900 tracking-tight hover:opacity-90 transition active:scale-98 flex items-center gap-1.5">
          <span>Gadget</span>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Horizon</span>
          <span className="text-sm">🌐</span>
        </Link>

        {/* 💻 DESKTOP NAV LINKS */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { name: 'Home', path: '/' },
            { name: 'Products', path: '/products' },
            { name: 'Orders', path: '/orders' },
            { name: 'Profile', path: '/profile' }
          ].map((navItem) => (
            <Link 
              key={navItem.path}
              to={navItem.path} 
              className={`text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-xl transition-all duration-200 relative group ${
                isActive(navItem.path) 
                  ? 'text-blue-600 bg-blue-50/60' 
                  : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50'
              }`}
            >
              {navItem.name}
              {/* Subtle active line transition indicator */}
              <span className={`absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center ${
                isActive(navItem.path) ? 'scale-x-100' : ''
              }`} />
            </Link>
          ))}

          <span className="h-4 w-px bg-gray-200 mx-2" />

          <Link 
            to="/admin" 
            className={`text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:text-amber-700 bg-amber-50 text-amber-600 px-3.5 py-2 rounded-xl border border-amber-100/70 hover:border-amber-200/80 ${
              isActive('/admin') ? 'ring-2 ring-amber-500/20 bg-amber-100/40' : ''
            }`}
          >
            Admin Control ⚙️
          </Link>
        </div>

        {/* RIGHT SIDE ACTION CONTROLS */}
        <div className="flex items-center gap-3">
          
          {/* DESKTOP AUTH CONTROLS */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login" className="text-xs font-bold uppercase tracking-wide text-gray-600 hover:text-gray-900 transition px-3 py-2 rounded-lg">
                  Sign In
                </Link>
                <Link to="/register" className="text-xs font-bold uppercase tracking-wide bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-xs hover:bg-blue-700 hover:shadow-md active:scale-98 transition-all duration-200">
                  Register
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3 bg-gray-50/80 border border-gray-100 rounded-2xl pl-3 pr-2 py-1.5 max-w-[200px]">
                <div className="flex flex-col items-end min-w-0">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Active</span>
                  <span className="text-[11px] text-gray-700 font-semibold truncate w-full text-right" title={user.email}>
                    {user.email}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs uppercase shadow-2xs shrink-0 select-none">
                  {user.email?.charAt(0) || 'U'}
                </div>
              </div>
            )}
          </div>

          {/* 🛒 PREMIUM CART BUTTON */}
          <Link 
            to="/cart" 
            className={`relative flex items-center justify-center p-3 rounded-xl transition-all duration-300 group cursor-pointer border ${
              isActive('/cart')
                ? 'bg-emerald-900 border-emerald-950 text-white shadow-xs'
                : 'bg-emerald-800 border-emerald-900 text-white hover:bg-emerald-700 hover:-translate-y-0.5 shadow-xs hover:shadow-md hover:shadow-emerald-800/10 active:scale-95'
            }`}
            title="View your shopping cart"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2.2} 
              stroke="currentColor" 
              className="w-5 h-5 transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-rotate-2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            
            {/* 🔴 FLOATING COUNTER BADGE */}
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 px-1 text-[10px] font-black text-white ring-2 ring-white shadow-sm shadow-red-500/20 animate-none">
                {cartCount}
              </span>
            )}
          </Link>

          {/* 🍔 MOBILE MENU ICON TRIGGER */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2.5 rounded-xl transition duration-200 cursor-pointer ${
              isMobileMenuOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 📱 MOBILE DROPDOWN FRAME */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 absolute top-full left-0 w-full shadow-xl flex flex-col gap-1 animate-in fade-in slide-in-from-top-4 duration-200 ease-out">
          {[
            { name: 'Home', path: '/' },
            { name: 'Products', path: '/products' },
            { name: 'Orders', path: '/orders' },
            { name: 'Profile', path: '/profile' }
          ].map((navItem) => (
            <Link 
              key={navItem.path}
              onClick={() => setIsMobileMenuOpen(false)} 
              to={navItem.path} 
              className={`text-sm font-bold px-4 py-3 rounded-xl transition ${
                isActive(navItem.path) 
                  ? 'text-blue-600 bg-blue-50/60' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {navItem.name}
            </Link>
          ))}
          
          <Link 
            onClick={() => setIsMobileMenuOpen(false)} 
            to="/admin" 
            className={`text-sm font-extrabold text-amber-600 px-4 py-3 rounded-xl transition mt-1 ${
              isActive('/admin') ? 'bg-amber-50' : 'hover:bg-amber-50/50'
            }`}
          >
            Admin Control ⚙️
          </Link>
          
          <hr className="border-gray-100 my-2 mx-2" />

          {!user ? (
            <div className="flex flex-col gap-2 p-1">
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/login" className="text-xs font-bold text-center text-gray-700 py-3 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition uppercase tracking-wide">
                Sign In
              </Link>
              <Link onClick={() => setIsMobileMenuOpen(false)} to="/register" className="text-xs font-black text-center bg-blue-600 text-white py-3.5 rounded-xl shadow-md hover:bg-blue-700 transition uppercase tracking-wide">
                Register Account
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3 mx-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs uppercase shrink-0">
                {user.email?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Signed In As</span>
                <span className="text-xs text-gray-700 font-bold truncate" title={user.email}>
                  {user.email}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}