export default function Hero() {
  return (
    <div className="relative w-full max-w-6xl mx-auto my-6 rounded-3xl overflow-hidden shadow-xl border border-gray-200 group max-h-[240px] sm:max-h-[320px] md:max-h-[400px]">
      
      {/* 🌟 FULL IMAGE BACKGROUND WITH CONTROLLED VERTICAL height */}
      <img 
        src="/hero-ecommerce.jpg" 
        alt="Shop The Future E-Commerce Banner" 
        className="w-full h-[240px] sm:h-[320px] md:h-[400px] object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
        loading="eager"
      />

      {/* GRADIENT OVERLAY (Protects contrast & makes interactive elements pop) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none"></div>

      {/* 🌟 INTERACTIVE CLICKABLE ANCHOR OVERLAY (Re-aligned tightly over the image's printed button) */}
      <a 
        href="/products"
        className="absolute bottom-[10%] left-[8%] w-[19%] h-[12%] rounded-xl cursor-pointer bg-transparent transition-all duration-200 hover:bg-white/10 active:scale-95 border border-transparent hover:border-white/20"
        title="Explore All Deals"
      >
        <span className="sr-only">Explore Deals</span>
      </a>

    </div>
  );
}