import React, { useState } from 'react';
import { useCart } from '../../lib/cart-context';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  Sparkles,
  UtensilsCrossed,
  Check,
} from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    items,
    itemCount,
    subtotalInr,
    taxInr,
    serviceChargeInr,
    discountInr,
    discountCode,
    totalInr,
    updateQuantity,
    removeItem,
    clearCart,
    applyDiscountCode,
    removeDiscountCode,
    isCartOpen,
    closeCart,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);
    if (!couponInput.trim()) return;

    const res = applyDiscountCode(couponInput);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput('');
      setTimeout(() => setCouponSuccess(null), 4000);
    } else {
      setCouponError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#F7F3EA] dark:bg-[#161916] text-[#242722] dark:text-[#F7F3EA] shadow-2xl flex flex-col h-full border-l border-[#C7A36A]/20 z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-[#C7A36A]/20 bg-[#12382D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#C7A36A]/20 flex items-center justify-center text-[#C7A36A]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg tracking-wide">Culinary Cart</h3>
              <p className="text-[11px] text-[#A9B8A4]">
                {itemCount} {itemCount === 1 ? 'gourmet selection' : 'gourmet selections'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-[#F7F3EA]/70 hover:text-white px-2 py-1 rounded transition-colors"
                title="Clear Cart"
              >
                Clear
              </button>
            )}
            <button
              onClick={closeCart}
              className="p-1.5 rounded-full hover:bg-white/10 text-[#F7F3EA] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#12382D]/10 dark:bg-white/5 flex items-center justify-center text-[#C7A36A]">
                <UtensilsCrossed className="w-8 h-8 opacity-70" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">
                  Your Cart is Empty
                </h4>
                <p className="text-xs text-[#242722]/60 dark:text-[#A9B8A4] max-w-xs leading-relaxed">
                  Explore our curated artisanal menu featuring authentic royal delicacies and tropical elixirs.
                </p>
              </div>
              <button
                onClick={closeCart}
                className="mt-2 px-5 py-2.5 bg-[#12382D] hover:bg-[#0D2820] text-[#F7F3EA] rounded-xl text-xs font-medium tracking-wider uppercase transition-colors"
              >
                Explore Menu
              </button>
            </div>
          ) : (
            items.map(({ item, quantity, special_notes }) => (
              <div
                key={item.id}
                className="p-3.5 bg-white dark:bg-[#1E231E] rounded-xl border border-[#C7A36A]/20 shadow-xs flex gap-3.5"
              >
                {/* Food Image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-[#C7A36A]/15">
                  <ImageWithFallback
                    src={item.image_url}
                    alt={item.name}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3 h-3 rounded-xs border flex items-center justify-center ${
                            item.is_veg
                              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                              : 'border-rose-600 bg-rose-50 dark:bg-rose-950/40'
                          }`}
                          title={item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                        </span>
                        <h4 className="font-serif text-sm font-medium text-[#12382D] dark:text-[#F7F3EA] line-clamp-1">
                          {item.name}
                        </h4>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[#242722]/40 hover:text-rose-500 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xs font-semibold text-[#12382D] dark:text-[#C7A36A] mt-1">
                      ₹{item.price_inr.toLocaleString()}
                    </div>

                    {special_notes && (
                      <p className="text-[11px] text-[#A9B8A4] italic line-clamp-1 mt-0.5">
                        Note: {special_notes}
                      </p>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#C7A36A]/10">
                    <div className="flex items-center border border-[#C7A36A]/30 rounded-lg bg-[#F7F3EA]/50 dark:bg-black/20">
                      <button
                        onClick={() => updateQuantity(item.id, quantity - 1)}
                        className="p-1 hover:text-[#12382D] dark:hover:text-[#C7A36A] transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-medium">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, quantity + 1)}
                        className="p-1 hover:text-[#12382D] dark:hover:text-[#C7A36A] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-xs font-medium text-[#12382D] dark:text-[#F7F3EA]">
                      ₹{(item.price_inr * quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Promo code & Price Breakdown & Checkout Button */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#C7A36A]/20 bg-white/50 dark:bg-[#1A1E1A] space-y-4">
            
            {/* Promo Code Input */}
            <div>
              {discountCode ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      Code <strong>{discountCode}</strong> applied (-₹{discountInr.toLocaleString()})
                    </span>
                  </div>
                  <button
                    onClick={removeDiscountCode}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A9B8A4]" />
                    <input
                      type="text"
                      placeholder="Promo code (e.g. NIVORA10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#161916] border border-[#C7A36A]/30 rounded-lg text-[#242722] dark:text-[#F7F3EA] focus:outline-hidden focus:border-[#12382D]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#12382D] hover:bg-[#0D2820] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponError && (
                <p className="text-[11px] text-rose-500 mt-1">{couponError}</p>
              )}
              {couponSuccess && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> {couponSuccess}
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs text-[#242722]/80 dark:text-[#A9B8A4]">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-medium text-[#242722] dark:text-[#F7F3EA]">
                  ₹{subtotalInr.toLocaleString()}
                </span>
              </div>

              {discountInr > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Privilege Discount</span>
                  <span>-₹{discountInr.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Goods &amp; Services Tax (GST 5%)</span>
                <span>₹{taxInr.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Resort Hospitality Fee (5%)</span>
                <span>₹{serviceChargeInr.toLocaleString()}</span>
              </div>

              <div className="pt-2 border-t border-[#C7A36A]/20 flex justify-between text-sm font-semibold text-[#12382D] dark:text-[#F7F3EA]">
                <span>Total Amount</span>
                <span className="text-base text-[#12382D] dark:text-[#C7A36A] font-serif">
                  ₹{totalInr.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Checkout & Continue Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  closeCart();
                  onProceedToCheckout();
                }}
                className="w-full py-3 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={closeCart}
                className="w-full py-2 text-center text-xs text-[#242722]/70 dark:text-[#A9B8A4] hover:text-[#12382D] dark:hover:text-white transition-colors cursor-pointer"
              >
                Continue Browsing Menu
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
