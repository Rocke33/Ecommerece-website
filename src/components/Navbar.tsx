import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import { supabase } from '../supabaseClient';

export default function Navbar() {
  const [cartCount, setCartCount] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  // State to trigger the jumping animation on the cart icon
  const [shouldAnimateCart, setShouldAnimateCart] = useState<boolean>(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Helper function to fetch cart items directly
  const fetchCartCount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', userId);

      if (!error && data) {
        const totalItems = data.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalItems);
      }
    } catch (err) {
      console.error("Error fetching cart count:", err);
    }
  };

  useEffect(() => {
    const fetchSessionAndCount = async (incomingUser?: any) => {
      let currentUser = incomingUser ?? null;

      if (!currentUser) {
        const { data: { session } } = await supabase.auth.getSession();
        currentUser = session?.user || null;
      }

      setUser(currentUser);
      setUserName(currentUser?.user_metadata?.display_name || null);

      if (currentUser) {
        await fetchCartCount(currentUser.id);
      } else {
        setCartCount(0);
      }
    };

    fetchSessionAndCount();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null;
      setUser(u);
      setUserName(u?.user_metadata?.display_name || null);

      if (u) {
        fetchCartCount(u.id);
      } else {
        setCartCount(0);
      }
    });

    // INSTANT POSTGRES CHANGES LISTENER
    // 'payload' removed from callback arguments since it's not directly read
    const cartSubscription = supabase
      .channel('realtime-navbar-cart')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'cart_items' }, 
        async () => {
          // Identify active user session to update counts
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Instantly pull the fresh quantities to render
            await fetchCartCount(session.user.id);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(cartSubscription);
    };
  }, []);

  // Monitor cart changes to trigger jumping animation instantly
  useEffect(() => {
    if (cartCount > 0) {
      setShouldAnimateCart(true);
      
      // Stop the jump animation after 1 second (clean styling flow)
      const timer = setTimeout(() => {
        setShouldAnimateCart(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const isActive = (path: string) => location.pathname === path;
  const displayName = userName || (user && (user.user_metadata?.display_name || user.email?.split('@')[0])) || null;

  return (
    <nav className="w-full bg-white sticky top-0 font-sans z-50">
      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        
     <Link to="/" className="group text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight transition duration-200 shrink-0 flex items-center gap-1.5 bg-blue-800 hover:bg-blue-1000 border-2 border-blue-700/50 hover:border-blue-900 p-1.5 sm:p-2 rounded-xl shadow-md">
    <span className="pl-1 text-white">Rocke</span>
    <span className="text-white">Dev</span>
    
    {/* 🌐 Globe Icon Box adjusted with high-contrast semi-transparent white boundaries */}
    <span className="text-sm sm:text-lg md:text-xl p-1 rounded-lg bg-white/15 border border-white/25 inline-flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-inner">
      🌐
    </span>
  </Link>

        {/* 💻 DESKTOP NAV LINKS - RE-STYLED WITH ECO LIGHT GREEN THEME */}
        <div className="hidden md:flex items-center gap-2">
          {[
            { name: 'Home', path: '/' },
            { name: 'Products', path: '/products' },
            { name: 'Top Sales', path: '/orders' },
            { name: 'Profile', path: '/profile' }
          ].map((navItem) => (
            <Link 
              key={navItem.path}
              to={navItem.path} 
              className={`text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all duration-200 border shadow-2xs ${
                isActive(navItem.path) 
                  ? 'text-emerald-800 bg-emerald-100/90 border-emerald-300 shadow-xs' 
                  : 'text-gray-800 bg-emerald-50/50 border-emerald-100 hover:text-emerald-700 hover:bg-emerald-100/50 hover:border-emerald-250'
              }`}
            >
              {navItem.name}
            </Link>
          ))}

          <span className="h-5 w-px bg-gray-200 mx-1" />

          {/* ADMIN CONTROL */}
          <Link 
            to="/admin" 
            className={`text-xs font-black uppercase tracking-wider transition-all duration-200 bg-amber-50 text-amber-700 px-3.5 py-2.5 rounded-xl border border-amber-200 hover:bg-amber-100/60 ${
              isActive('/admin') ? 'ring-2 ring-amber-500/20 bg-amber-100' : ''
            }`}
          >
            Admin Control ⚙️
          </Link>
        </div>

        {/* RIGHT SIDE ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* USER CONTEXT */}
          {!user ? (
            <>
              <Link 
                to="/login" 
                className="hidden md:inline-block text-xs font-black uppercase tracking-wide text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 px-4 py-2.5 rounded-xl shadow-2xs transition"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="text-[11px] sm:text-xs font-black uppercase tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-4 py-2.5 rounded-xl shadow-xs hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all"
              >
                Register
              </Link>
            </>
          ) : (
            <button 
              onClick={() => navigate('/profile')}
              type="button"
              className="flex items-center justify-center bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border border-indigo-700 text-[11px] sm:text-xs font-black rounded-xl px-3 sm:px-4 py-2.5 max-w-[110px] sm:max-w-[160px] truncate shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <span className="truncate">{displayName || user.email?.split('@')[0]}</span>
            </button>
          )}

          {/* 🛒 PREMIUM CART BUTTON - INSTANT JUMPING/BOUNCING ANIMATION */}
          <Link 
            to="/cart" 
            className={`relative flex items-center justify-center p-2.5 sm:p-3 rounded-xl transition-all duration-300 border shadow-2xs ${
              shouldAnimateCart ? 'animate-bounce' : ''
            } ${
              isActive('/cart')
                ? 'bg-emerald-900 border-emerald-950 text-white'
                : 'bg-emerald-800 border-emerald-900 text-white hover:bg-emerald-700 active:scale-95'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4.5 h-4.5 sm:w-5 sm:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] sm:h-5 sm:min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] sm:text-[10px] font-black text-white ring-2 ring-white scale-110 transition-all duration-150">
                {cartCount}
              </span>
            )}
          </Link>

          {/* 🍔 LARGER, DARK MENU ICON BUTTON TRIGGER */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            type="button"
            className="md:hidden p-3 rounded-xl bg-slate-950 text-white hover:bg-slate-900 shadow-md transition active:scale-95 ml-0.5 cursor-pointer flex items-center justify-center shrink-0"
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 📱 MOBILE DROPDOWN FRAME */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 absolute top-full left-0 w-full shadow-xl flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          {[
            { name: 'Home', path: '/' },
            { name: 'Products', path: '/products' },
            { name: 'Top Sales', path: '/orders' },
            { name: 'Profile', path: '/profile' }
          ].map((navItem) => (
            <Link 
              key={navItem.path}
              onClick={() => setIsMobileMenuOpen(false)} 
              to={navItem.path} 
              className={`text-sm font-bold px-4 py-3 rounded-xl transition ${
                isActive(navItem.path) 
                  ? 'text-emerald-800 bg-emerald-50' 
                  : 'text-gray-700 hover:text-emerald-700 hover:bg-emerald-50/50'
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
        </div>
      )}
    </nav>
  );
}