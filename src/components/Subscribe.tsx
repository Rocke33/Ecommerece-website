import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Subscribe() {
  const navigate = useNavigate();
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // 📡 Sync initial state from the database on component load
  useEffect(() => {
    async function checkSubscriptionStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('is_subscribed')
            .eq('id', user.id)
            .maybeSingle();

          if (!error && data) {
            setIsSubscribed(!!data.is_subscribed);
          }
        }
      } catch (err) {
        console.error('Subscription sync error:', err);
      } finally {
        setLoading(false);
      }
    }
    checkSubscriptionStatus();
  }, []);

  const handleSubscribeAction = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 🛑 If user is not signed in, push them to the sign-in section
      if (!user) {
        navigate('/login');
        return;
      }

      // ⚡ INSTANT frontend visual transformation updates right away
      setIsSubscribed(true);

      // 📡 Silently update backend row metadata parameters in the background
      await supabase
        .from('profiles')
        .update({ is_subscribed: true })
        .eq('id', user.id);

    } catch (err) {
      console.error('Failed to subscribe:', err);
    }
  };

  const handleUnsubscribeAction = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ⚡ INSTANT frontend fallback transformation
      setIsSubscribed(false);

      // 📡 Silently update backend row metadata parameters in the background
      await supabase
        .from('profiles')
        .update({ is_subscribed: false })
        .eq('id', user.id);

    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    }
  };

  if (loading) {
    return (
      <section className="my-16 bg-blue-600 rounded-3xl p-8 md:p-12 text-center text-white shadow-md animate-pulse">
        <div className="h-6 w-48 bg-blue-500 rounded mx-auto mb-3"></div>
        <div className="h-4 w-64 bg-blue-500 rounded mx-auto"></div>
      </section>
    );
  }

  return (
    <section className="my-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl relative overflow-hidden group">
      {/* Background Graphic Design Decorators */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-900/30 rounded-full blur-2xl pointer-events-none"></div>

      <div className="max-w-xl mx-auto relative z-10">
        <span className="inline-block text-2xl mb-2 select-none">
          {isSubscribed ? '🔔' : '💌'}
        </span>
        <h2 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">
          {isSubscribed ? 'You’re Subscribed!' : 'Stay in the Loop'}
        </h2>
        <p className="text-blue-100/90 text-xs md:text-sm mb-6 max-w-md mx-auto leading-relaxed">
          {isSubscribed 
            ? 'Success! Your account profile is configured to receive flash discount updates and immediate product drop notifications.' 
            : 'Subscribe to receive flash discount updates and immediate product drop notifications.'}
        </p>

        <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
          {!isSubscribed ? (
            /* 🔵 STATE A: NOT SUBSCRIBED BUTTON LAYOUT */
            <button
              onClick={handleSubscribeAction}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs uppercase tracking-widest py-3.5 px-8 rounded-xl shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Subscribe Now
            </button>
          ) : (
            /* 🟢 STATE B: SUBSCRIBED + INLINE UNSUBSCRIBE CONTROL */
            <div className="w-full space-y-3">
              <div className="w-full bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-widest py-3.5 px-8 rounded-xl shadow-md border border-emerald-500/30 select-none">
                ✓ Subscribed
              </div>
              
              <button
                onClick={handleUnsubscribeAction}
                className="text-[11px] font-bold text-blue-200 hover:text-white transition underline cursor-pointer"
              >
                Unsubscribe from updates
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}