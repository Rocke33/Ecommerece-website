import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { supabase } from '../supabaseClient';

interface ProductCardProps {
  id: number;
  title: string;
  price: number;
  image_url: string;
  category: string;
  description: string;
}

export default function ProductCard({ id, title, price, image_url }: ProductCardProps) {
  const navigate = useNavigate(); 
  
  // 🛒 Cart States
  const [isAddedSuccess, setIsAddedSuccess] = useState<boolean>(false);
  
  // ⭐ Aggregate Rating Metrics
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  // Poll real-time review rows to compute dynamic average ratings across all unique users
  const fetchRatingMetrics = async () => {
    try {
      const { data } = await supabase
        .from('product_comments')
        .select('rating')
        .eq('product_id', id);

      if (data && data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
        setAverageRating(parseFloat((sum / data.length).toFixed(1)));
        setTotalReviews(data.length);
      } else {
        setAverageRating(5.0); // Default score is 5 stars if empty
        setTotalReviews(0);
      }
    } catch (err) {
      console.error("Error computing card rating aggregation:", err);
    }
  };

  useEffect(() => {
    fetchRatingMetrics();
  }, [id]);

  const handleDirectAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: existingCartItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();

      if (existingCartItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingCartItem.quantity + 1 })
          .eq('id', existingCartItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert([{ user_id: user.id, product_id: id, quantity: 1 }]);
        if (error) throw error;
      }

      setIsAddedSuccess(true);
      setTimeout(() => setIsAddedSuccess(false), 3000);
    } catch (err: any) {
      console.error('Cart error:', err?.message || err);
      alert('Could not update your cart.');
    }
  };

  const handleCardRedirection = () => {
    navigate(`/product/${id}`);
  };

  return (
    <div 
      onClick={handleCardRedirection} 
      className="bg-white border border-gray-200 rounded-xl p-1.5 xs:p-2 sm:p-4 flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 group font-sans cursor-pointer h-full min-w-0"
    >
      <div>
        {/* IMAGE INTERFACE PAN */}
        <div className="w-full h-20 xs:h-28 sm:h-44 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center p-1 sm:p-2 mb-1.5 sm:mb-4 relative shrink-0">
          {/* CATEGORY REMOVED FROM HERE */}
          <img 
            src={image_url} 
            alt={title} 
            className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-300" 
          />
        </div>

        {/* DETAILS TELEMETRY SECTION */}
        <div className="flex-1 flex flex-col min-w-0">
          <h3 className="text-[10px] xs:text-xs sm:text-sm font-bold text-gray-800 line-clamp-2 min-h-[28px] xs:min-h-[32px] sm:min-h-[40px] leading-tight mb-1.5 sm:mb-2 group-hover:text-blue-600 transition truncate-2-lines">
            {title}
          </h3>
          
          {/* DESCRIPTION REMOVED FROM HERE */}

          {/* DYNAMIC AVERAGE RATING ACCORDING TO ALL UNIQUE USERS */}
          <div className="flex items-center gap-0.5 sm:gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`text-[8px] xs:text-[10px] sm:text-xs select-none ${i < Math.round(averageRating) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
            ))}
            <span className="text-[7px] xs:text-[9px] sm:text-[11px] text-gray-400 font-medium ml-0.5">
              ({averageRating}) {totalReviews > 0 && `· ${totalReviews}`}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION SPLIT ROW */}
      <div className="pt-1.5 sm:pt-2 border-t border-gray-100 flex flex-col gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-gray-400 font-bold leading-none">Price</span>
          <span className="text-xs xs:text-sm sm:text-lg font-black text-gray-900 font-mono">${price.toFixed(2)}</span>
        </div>

        {/* Action Button Wrapper: Added explicit spacing attributes to handle safety notifications inside */}
        <div className="w-full relative pt-3 flex gap-1 items-center">
          {isAddedSuccess && (
            <span className="absolute top-[-8px] left-0 right-0 text-center text-[8px] xs:text-[9px] font-black text-emerald-600 whitespace-nowrap animate-pulse z-20 bg-white/90 backdrop-blur-xs py-0.5">
              Added successfully!
            </span>
          )}

          <button 
            disabled={isAddedSuccess}
            onClick={handleDirectAddToCart}
            className={`flex-1 text-center font-extrabold rounded-lg shadow-2xs transition-all duration-200 cursor-pointer z-10 whitespace-nowrap truncate
              text-[8px] px-1 py-1.5 xs:text-[10px] xs:px-2 xs:py-2 sm:text-xs sm:px-3 sm:py-2.5 ${
              isAddedSuccess
                ? 'bg-emerald-600 text-white font-black cursor-default'
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
            }`}
          >
            {isAddedSuccess ? '✓ Added' : 'Add to Cart'}
          </button>

          {/* 🧭 NAVIGATION DETAILS BUTTON */}
          <button 
            onClick={handleCardRedirection}
            className="bg-gray-950 hover:bg-gray-800 text-white font-extrabold rounded-lg px-2 py-1.5 xs:px-2.5 xs:py-2 sm:px-4 sm:py-2.5 text-[8px] xs:text-[10px] sm:text-xs transition active:scale-95 shadow-2xs whitespace-nowrap cursor-pointer z-10"
          >
            Details
          </button>
        </div>
      </div>

    </div>
  );
}