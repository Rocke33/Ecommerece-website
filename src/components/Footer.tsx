import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 pt-12 pb-6 px-6 font-sans mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Company Info */}
        <div>
          <h3 className="text-white text-lg font-bold mb-4">GadgetHorizon</h3>
          <p className="text-sm leading-relaxed text-gray-400">
            Your one-stop premier cloud destination for cutting edge electronics, custom components, and minimalist lifestyle gear.
          </p>
        </div>

        {/* Quick Shop Links */}
        <div>
          <h4 className="text-white text-md font-semibold mb-4">Shop Hierarchy</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products" className="hover:text-white transition">All Inventories</Link></li>
            <li><Link to="/cart" className="hover:text-white transition">Your Shopping Cart</Link></li>
          </ul>
        </div>

        {/* Account Links */}
        <div>
          <h4 className="text-white text-md font-semibold mb-4">Customer Center</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/profile" className="hover:text-white transition">Profile Dashboard</Link></li>
            <li><Link to="/orders" className="hover:text-white transition">Order Dispatches</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 max-w-6xl mx-auto pt-6 text-center text-xs text-gray-500">
        &copy; {currentYear} GadgetHorizon Inc. All database systems operational.
      </div>
    </footer>
  );
}