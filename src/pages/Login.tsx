import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // 🔄 Explicit state toggle to separate Sign In and Registration workflows safely
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const targetEmail = email.trim();

    try {
      if (isSignUpMode) {
        // -------------------------------------------------------------
        // STEP 1: Create the user in the official Supabase Auth system
        // -------------------------------------------------------------
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: targetEmail,
          password: password,
          options: {
            data: {
              display_name: name.trim(), // Securely saved in metadata for the Navbar
            },
          },
        });

        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('already registered')) {
            throw new Error('This email is already registered. Switch to "Sign In" instead.');
          }
          throw signUpError;
        }

        // -------------------------------------------------------------
        // STEP 2: Save to your exact custom columns (id, created_at, name, email, password)
        // -------------------------------------------------------------
        if (data?.user) {
          const { error: dbError } = await supabase
            .from('users') // 👈 Make sure this matches your exact custom table name
            .insert([
              {
                id: data.user.id,          // Maps to 'id' column (uuid)
                created_at: new Date().toISOString(), // Maps to 'created_at' column (timestamptz)
                name: name.trim(),         // Maps to 'name' column (text)
                email: targetEmail,        // Maps to 'email' column (text)
                password: password,        // Maps to 'password' column (text)
              },
            ]);

          if (dbError) {
            console.error("Custom database insertion failed:", dbError.message);
            throw new Error(`Database registration log failed: ${dbError.message}`);
          }
        }

        if (data?.session || data?.user) {
          navigate('/');
        } else {
          setErrorMsg('Account created! Please try logging in.');
          setIsSignUpMode(false);
          setPassword('');
        }
      } else {
        // Mode B: Regular Sign In (Authenticates securely via Supabase Auth)
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password: password,
        });

        if (signInError) {
          if (signInError.message.toLowerCase().includes('invalid login credentials')) {
            throw new Error('Incorrect email or password. Please verify your credentials, or register a new account.');
          }
          throw signInError;
        }

        if (data?.user) {
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Authentication failed. Please verify your entries.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-gray-50 to-gray-100 font-sans antialiased">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decorative Blur Gradients */}
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-8 md:p-10 shadow-2xl shadow-blue-900/5 relative z-10 transition-all duration-300 hover:shadow-blue-900/10">
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-black mx-auto mb-4 shadow-lg shadow-blue-600/30">
              🛒
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              {isSignUpMode ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1.5 font-medium">
              {isSignUpMode ? 'Get started with instant checkout privileges' : 'Sign in to access your custom shopping platform'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-200/60 rounded-xl p-3.5 flex items-start gap-2.5 text-xs font-semibold text-red-600 animate-fadeIn">
              <span className="text-sm shrink-0">⚠️</span>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {isSignUpMode && (
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-sm pointer-events-none">🙍</span>
                  <input
                    type="text"
                    required={isSignUpMode}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full text-xs md:text-sm border border-gray-200/80 bg-gray-50/50 pl-10 pr-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-medium transition-all duration-200 placeholder:text-gray-400/70"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-sm pointer-events-none">📧</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs md:text-sm border border-gray-200/80 bg-gray-50/50 pl-10 pr-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-medium transition-all duration-200 placeholder:text-gray-400/70"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 text-sm pointer-events-none">🔒</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs md:text-sm border border-gray-200/80 bg-gray-50/50 pl-10 pr-4 py-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-medium font-mono transition-all duration-200 placeholder:text-gray-400/50 tracking-widest"
                />
              </div>
            </div>

            <div className="pt-2 space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full text-xs md:text-sm font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 rounded-xl shadow-lg shadow-blue-600/10 hover:shadow-xl hover:shadow-blue-600/20 transition-all duration-200 active:scale-[0.98] cursor-pointer text-center tracking-wide"
              >
                {loading ? 'Processing...' : isSignUpMode ? 'Register & Log In' : 'Sign In'}
              </button>

              <div className="text-center pt-2 border-t border-gray-100/80">
                <p className="text-xs text-gray-500 font-medium">
                  {isSignUpMode ? 'Already registered on our records? ' : "Don't have an account yet? "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUpMode(!isSignUpMode);
                      setErrorMsg(null);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-bold underline decoration-2 underline-offset-2 transition bg-transparent border-none p-0 cursor-pointer"
                  >
                    {isSignUpMode ? 'Sign In Here' : 'Register'}
                  </button>
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}