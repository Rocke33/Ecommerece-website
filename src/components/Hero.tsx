import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();

  const fastCategories = [
    { name: 'Electronics', icon: '⚡', color: 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200' },
    { name: 'Furniture', icon: '🪑', color: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200' },
    { name: 'Apparel', icon: '👕', color: 'hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200' },
    { name: 'Accessories', icon: '🎒', color: 'hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200' },
  ];

  return (
    <div className="relative w-full max-w-6xl mx-auto my-6 rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-indigo-950 to-slate-950 text-white shadow-xl border border-gray-800">
      
      {/* Decorative Subtle Background Glow Elements */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="px-6 py-12 sm:px-12 sm:py-16 md:py-20 flex flex-col items-center text-center relative z-10">
        
        {/* Animated Feature Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wider uppercase mb-6 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          New Season Drops Live
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight max-w-3xl leading-none uppercase bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          The Next Generation <br className="hidden sm:inline" /> 
          Of Premium Shopping
        </h1>

        {/* Subtitle description */}
        <p className="mt-4 text-xs sm:text-sm md:text-base text-gray-400 max-w-xl font-medium leading-relaxed">
          Discover a curated ecosystem of next-gen electronics, masterfully crafted lifestyle furniture, designer apparel, and daily essentials.
        </p>

        {/* CTA Actions Group */}
        <div className="mt-8 flex flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/products')}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>Explore All Deals</span>
            <svg 
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" 
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* Quick Category Anchor Links */}
        <div className="mt-12 w-full border-t border-white/5 pt-8">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 mb-4">
            Jump Directly To Collections
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-2">
            {fastCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => navigate(`/category/${cat.name.toLowerCase()}`)}
                className={`flex items-center gap-2 px-3 py-2 sm:px-4 bg-white/5 border border-white/5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer text-gray-300 ${cat.color}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}