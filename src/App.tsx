import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary'; // 🚀 Implemented from Step 5
import ProtectedRoute from './components/ProtectedRoute'; // 🛡️ Implemented from Step 6

// ⚡ PERFORMANCE BOOSTER: Code-split routes so users only download the pages they visit
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const Orders = lazy(() => import('./pages/Orders'));

// Private protected routes
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));

// Premium, lightweight skeleton screen used during route shifts
const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-xs text-gray-400 font-bold tracking-wider uppercase animate-pulse">Loading Asset Framework...</span>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        {/* Suspense fallback guarantees layout fluidity during background network asset fetches */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Access Paths */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/category/:categoryName" element={<CategoryPage />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/orders" element={<Orders />} />
            
            {/* 🛡️ Secure Client Account Routes */}
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* 🚨 Strict Admin Access Route */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Admin />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}