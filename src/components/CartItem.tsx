interface CartItemProps {
  id: number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  onUpdateQuantity: (id: number, newQty: number) => void;
  onRemove: (id: number) => void;
}

export default function CartItem({ id, name, price, image_url, quantity, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 shadow-sm font-sans gap-4">
      {/* Product Image */}
      <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center p-2 overflow-hidden border border-gray-100 shrink-0">
        <img src={image_url} alt={name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
      </div>

      {/* Product Name & Price Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-gray-900 truncate">{name}</h4>
        <span className="text-sm font-extrabold text-gray-700 block mt-1">${price.toFixed(2)}</span>
      </div>

      {/* Quantity Step Controls */}
      <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 shrink-0">
        <button 
          onClick={() => onUpdateQuantity(id, quantity - 1)}
          className="px-2.5 py-1.5 text-gray-500 hover:text-black font-bold transition"
        >
          -
        </button>
        <span className="px-1 text-xs font-black text-gray-800 w-5 text-center select-none">{quantity}</span>
        <button 
          onClick={() => onUpdateQuantity(id, quantity + 1)}
          className="px-2.5 py-1.5 text-gray-500 hover:text-black font-bold transition"
        >
          +
        </button>
      </div>

      {/* Total Price & Delete Button */}
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-sm font-black text-gray-900 w-16 text-right">
          ${(price * quantity).toFixed(2)}
        </span>
        <button 
  onClick={() => onRemove(id)}
  className="flex items-center justify-center border border-gray-200 bg-gray-50/50 hover:bg-red-50 hover:border-red-200 hover:text-red-600 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-200 active:scale-95 shadow-2xs group cursor-pointer"
  title="Remove item"
>
  {/* 🗑️ Optional: Tiny inline trash icon to anchor the design look */}
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={2} 
    stroke="currentColor" 
    className="w-3.5 h-3.5 mr-1.5 text-gray-400 group-hover:text-red-500 transition-colors"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
  Remove
</button>
      </div>
    </div>
  );
}