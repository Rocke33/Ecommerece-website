import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom'; 
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Product {
  id: number;
  title: string;
  price: number;
  image_url: string;
  category: string;
  description: string;
}

interface CommentRecord {
  id: string;
  user_email: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [itemCount, setItemCount] = useState<number>(1);
  const [cartLoading, setCartLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isAddedSuccess, setIsAddedSuccess] = useState<boolean>(false);

  // 💬 Dynamic Comment & Rating Terminal States
  const [commentsList, setCommentsList] = useState<CommentRecord[]>([]);
  const [averageRating, setAverageRating] = useState<number>(5.0);
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  
  // ✍️ Input Submission Variables
  const [userRating, setUserRating] = useState<number>(5);
  const [userText, setUserText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // Dynamic review averages metric calculator logic
  const fetchCommentsAndRatings = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('product_comments')
        .select('id, user_email, rating, comment, created_at')
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCommentsList(data as CommentRecord[]);
        if (data.length > 0) {
          const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
          setAverageRating(parseFloat((sum / data.length).toFixed(1)));
        } else {
          setAverageRating(5.0); // Fallback standard rating
        }
      }
    } catch (err) {
      console.error("Error reading feedback tables:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    const fetchSingleItem = async () => {
      setLoading(true);
      setStatusMessage('');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Error reading database node details:", error.message);
      } else if (data) {
        setProduct(data as Product);
      }
      setLoading(false);
    };

    if (id) {
      fetchSingleItem();
      fetchCommentsAndRatings();
    }
  }, [id]);

  const handleAddToCart = async () => {
    setCartLoading(true);
    setStatusMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatusMessage('⚠️ Please log in to add items to your cart.');
      setCartLoading(false);
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    const { error } = await supabase.from('cart_items').insert([
      {
        user_id: user.id,
        product_id: product?.id,
        quantity: itemCount
      }
    ]);

    if (error) {
      setStatusMessage('❌ Error updating cloud basket: ' + error.message);
    } else {
      setIsAddedSuccess(true);
      setTimeout(() => setIsAddedSuccess(false), 3000);
    }
    setCartLoading(false);
  };

  // Secure user feedback record transmission form processor
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userText.trim()) return;

    setSubmittingComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { error } = await supabase
        .from('product_comments')
        .insert([
          {
            product_id: id,
            user_id: user.id,
            user_email: user.email || 'Anonymous Visitor',
            rating: userRating,
            comment: userText.trim(),
          }
        ]);

      if (error) throw error;

      setUserText('');
      fetchCommentsAndRatings(); // Instantly update view without reloading page
    } catch (err: any) {
      console.error(err);
      alert('Failed to save review. Please check your Supabase RLS security policies context rules.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-gray-50 font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Mounting focal records...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-gray-50 font-sans">
        <Navbar />
        <div className="text-center py-20 text-gray-500 font-medium">Product file could not be fetched.</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-2 xs:px-3 sm:px-4 py-4 sm:py-12 space-y-6">
        
        {/* PREMIUM NAVIGATION BAR */}
        <div className="flex justify-start">
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-gray-950 text-white hover:bg-gray-800 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-transparent shadow-sm font-sans text-[10px] sm:text-sm font-extrabold tracking-wide transition-all duration-150 active:scale-95 group"
          >
            <svg className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Collections</span>
          </Link>
        </div>

        {statusMessage && !isAddedSuccess && (
          <div className="p-3 sm:p-4 rounded-xl text-xs sm:text-sm font-bold bg-white border border-gray-200 shadow-3xs animate-fade-in">
            {statusMessage}
          </div>
        )}

        {/* PRIMARY ITEM TELEMETRY MATRIX BLOCK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-12 bg-white border border-gray-200 p-3 xs:p-4 sm:p-10 rounded-2xl sm:rounded-3xl shadow-3xs">
          
          {/* IMAGE INTERFACE PAN */}
          <div className="w-full h-44 xs:h-64 sm:h-96 bg-gray-50 rounded-xl p-3 sm:p-6 flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
            <img src={product.image_url} alt={product.title} className="max-h-full max-w-full object-contain mix-blend-multiply" />
          </div>

          <div className="flex flex-col justify-between min-w-0 pt-2 md:pt-0">
            <div>
              <span className="inline-block bg-blue-50 text-blue-600 font-extrabold text-[8px] sm:text-[10px] tracking-wider uppercase px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md mb-1.5 sm:mb-3">
                {product.category}
              </span>
              
              <h1 className="text-sm xs:text-lg sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-1 sm:mb-2 break-words">
                {product.title}
              </h1>

              {/* DYNAMIC COMPUTED AVERAGE STAR RATING DISPLAY */}
              <div className="flex items-center gap-0.5 sm:gap-1 mb-3 sm:mb-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xs sm:text-base select-none ${i < Math.round(averageRating) ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                ))}
                <span className="text-[9px] sm:text-xs text-gray-400 font-semibold ml-1 sm:ml-2">
                  ({averageRating} Rating Score · {commentsList.length} reviews)
                </span>
              </div>

              <div className="bg-gray-50 p-2 sm:p-4 rounded-xl border border-gray-100 mb-3 sm:mb-6">
                <span className="text-[7px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Retailing Value</span>
                <span className="text-sm xs:text-xl sm:text-3xl font-black text-gray-900 font-mono">${product.price.toFixed(2)}</span>
              </div>

              <div className="mb-3 sm:mb-6">
                <h3 className="text-[8px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5 sm:mb-2">Product Description</h3>
                <p className="text-[10px] xs:text-xs sm:text-sm leading-relaxed text-gray-600">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="pt-3 sm:pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <span className="text-[9px] sm:text-xs font-bold text-gray-500">Supply Status:</span>
                <span className="text-[8px] sm:text-xs font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full">
                  ✔ In Stock
                </span>
              </div>

              <div className="flex gap-2 sm:gap-4 items-center">
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 shrink-0">
                  <button disabled={isAddedSuccess} onClick={() => setItemCount(Math.max(1, itemCount - 1))} className="px-2 py-1 sm:px-3 sm:py-2 font-bold text-xs sm:text-sm text-gray-500 hover:text-black transition disabled:opacity-40 cursor-pointer">-</button>
                  <span className="px-0.5 text-xs sm:text-sm font-black text-gray-800 w-4 text-center select-none">{itemCount}</span>
                  <button disabled={isAddedSuccess} onClick={() => setItemCount(itemCount + 1)} className="px-2 py-1 sm:px-3 sm:py-2 font-bold text-xs sm:text-sm text-gray-500 hover:text-black transition disabled:opacity-40 cursor-pointer">+</button>
                </div>

                <div className="flex-1 flex flex-col relative min-w-0">
                  {isAddedSuccess && (
                    <span className="absolute -top-4 left-0 right-0 text-center text-[8px] sm:text-[10px] font-bold text-emerald-600 whitespace-nowrap animate-pulse">Added to cart successfully!</span>
                  )}
                  <button 
                    onClick={handleAddToCart}
                    disabled={cartLoading || isAddedSuccess}
                    className={`w-full text-white font-extrabold rounded-xl shadow-xs transition-all duration-200 cursor-pointer text-center whitespace-nowrap truncate text-[10px] py-2 px-1.5 xs:text-sm xs:py-3 xs:px-4 ${
                      isAddedSuccess ? 'bg-emerald-600 font-black cursor-default' : cartLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98]'
                    }`}
                  >
                    {isAddedSuccess ? '✓ Added' : cartLoading ? 'Syncing...' : `Add to Cart ($${(product.price * itemCount).toFixed(2)})`}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 💬 INTEGRATED PRODUCT REVIEWS & STAR RATING BOX */}
        <div className="bg-white border border-gray-200 rounded-2xl p-3 xs:p-4 sm:p-8 shadow-3xs space-y-4">
          <h2 className="text-xs xs:text-sm sm:text-lg font-black text-gray-900 uppercase tracking-tight border-b border-gray-100 pb-2">
            User Feedback & Reviews
          </h2>

          {/* RATING SELECTION & COMMENT ENTRY WORKFLOW SUBMISSION PANEL */}
          <form onSubmit={handleCommentSubmit} className="bg-gray-50 border border-gray-100 p-3 rounded-xl space-y-3">
            <h3 className="text-[10px] sm:text-xs font-bold text-gray-700 uppercase tracking-wider">Write a Review</h3>
            
            {/* INTERACTIVE STAR-SELECTOR BAR */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-medium text-gray-500">Select Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className={`text-sm sm:text-xl select-none transition duration-100 active:scale-95 ${star <= userRating ? 'text-amber-400 scale-105' : 'text-gray-200'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                placeholder="Share your experience with this item..."
                className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] xs:text-xs sm:text-sm font-medium focus:outline-hidden focus:border-blue-500 shadow-3xs"
              />
              <button 
                type="submit"
                disabled={submittingComment || !userText.trim()}
                className="bg-blue-600 text-white font-extrabold px-3 py-1.5 sm:px-5 sm:py-2 rounded-lg text-[10px] xs:text-xs sm:text-sm hover:bg-blue-500 transition shadow-2xs disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {submittingComment ? 'Posting...' : 'Submit'}
              </button>
            </div>
          </form>

          {/* CHRONOLOGICAL FEEDBACK COMMENT GRID */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {loadingComments ? (
              <p className="text-center text-[10px] sm:text-xs text-gray-400 font-bold animate-pulse py-4">Syncing client reviews dashboard...</p>
            ) : commentsList.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                <p className="text-[10px] xs:text-xs text-gray-400 font-medium">No customer feedback reported yet. Be the first to evaluate this selection!</p>
              </div>
            ) : (
              commentsList.map((record) => (
                <div key={record.id} className="bg-white border border-gray-100 p-2.5 xs:p-3 rounded-xl shadow-3xs flex flex-col gap-1 transition duration-150 hover:border-gray-200">
                  <div className="flex justify-between items-center text-[8px] xs:text-[10px] sm:text-xs font-bold text-gray-400">
                    <span className="text-gray-600 truncate max-w-[150px] xs:max-w-xs">{record.user_email}</span>
                    <span className="text-amber-400 text-[10px] sm:text-sm tracking-tighter">{'★'.repeat(record.rating)}{'☆'.repeat(5 - record.rating)}</span>
                  </div>
                  <p className="text-[10px] xs:text-xs sm:text-sm font-medium text-gray-700 leading-normal break-words">
                    {record.comment}
                  </p>
                  <span className="text-[7px] xs:text-[9px] text-gray-300 font-mono self-end">
                    {new Date(record.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}