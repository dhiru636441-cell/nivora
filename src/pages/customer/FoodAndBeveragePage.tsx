import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useCart } from '../../lib/cart-context';
import { db } from '../../lib/db';
import { MenuItem, MenuCategory, ActiveStay, FoodOrder } from '../../lib/types';
import { RESORT_IMAGES } from '../../lib/assets';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import {
  Search,
  SlidersHorizontal,
  Flame,
  Leaf,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  Clock,
  Check,
  Coffee,
  Wine,
  UtensilsCrossed,
  ConciergeBell,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
} from 'lucide-react';

interface FoodAndBeveragePageProps {
  activeStay?: ActiveStay;
}

const CATEGORIES: { id: MenuCategory; label: string; icon: any }[] = [
  { id: 'all', label: 'All Delicacies', icon: UtensilsCrossed },
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
  { id: 'starters', label: 'Starters', icon: Flame },
  { id: 'indian', label: 'Indian Cuisine', icon: Sparkles },
  { id: 'continental', label: 'Continental', icon: UtensilsCrossed },
  { id: 'mains', label: 'Main Course', icon: UtensilsCrossed },
  { id: 'desserts', label: 'Desserts', icon: Sparkles },
  { id: 'beverages', label: 'Beverages', icon: Wine },
  { id: 'juices', label: 'Fresh Juices', icon: Leaf },
  { id: 'room_service', label: 'Room Service', icon: ConciergeBell },
];

export const FoodAndBeveragePage: React.FC<FoodAndBeveragePageProps> = ({ activeStay }) => {
  const { user } = useAuth();
  const { addItem, itemCount, totalInr, openCart } = useCart();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc'>('featured');
  
  // Per-item quantity selector state
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedAnimation, setAddedAnimation] = useState<string | null>(null);

  // Active orders tracking state
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
  const [userOrders, setUserOrders] = useState<FoodOrder[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const loadData = () => {
    setMenuItems(db.getMenuItems());
    if (user) {
      setUserOrders(db.getFoodOrdersByUser(user.id));
    } else {
      setUserOrders(db.getFoodOrders());
    }
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe(loadData);
    return unsub;
  }, [user]);

  const handleQuantityChange = (itemId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] || 1;
      const next = Math.max(1, Math.min(20, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const handleAddToCart = (item: MenuItem) => {
    const qty = quantities[item.id] || 1;
    addItem(item, qty);
    setAddedAnimation(item.id);
    setTimeout(() => setAddedAnimation(null), 1800);
  };

  // Filter & Sort
  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (vegOnly && !item.is_veg) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchTags = item.dietary_tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price_inr - b.price_inr;
    if (sortBy === 'price_desc') return b.price_inr - a.price_inr;
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });

  return (
    <div className="space-y-8 pb-20">
      
      {/* 1. Culinary Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden min-h-[320px] sm:min-h-[380px] flex items-center justify-center text-white border border-[#C7A36A]/25 shadow-lg">
        <ImageWithFallback
          src={RESORT_IMAGES.biryani}
          alt="Nivora Haute Culinary Experience"
          containerClassName="absolute inset-0 w-full h-full"
          className="w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12382D] via-[#12382D]/75 to-[#12382D]/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#F7F3EA] text-[11px] tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#C7A36A]" />
            <span>The Sovereign Table · Artisanal Dining</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-wide text-white leading-tight">
            Culinary Excellence &amp; In-Room Dining
          </h1>

          <p className="font-sans text-xs sm:text-sm text-[#F7F3EA]/90 max-w-xl mx-auto leading-relaxed">
            Delicately crafted dishes inspired by timeless royal traditions and fresh coastal bounty, prepared to order and delivered to your private suite or cabana.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-[#C7A36A] text-[#12382D] shadow-md'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              Artisanal Menu
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-[#C7A36A] text-[#12382D] shadow-md'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <span>My Orders</span>
              {userOrders.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#12382D] text-white text-[10px] font-bold">
                  {userOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Tab Content */}
      {activeTab === 'orders' ? (
        /* Orders History Section */
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl text-[#12382D] dark:text-[#F7F3EA]">
                Your Culinary Orders
              </h2>
              <p className="text-xs text-[#242722]/70 dark:text-[#A9B8A4]">
                Real-time tracking of your in-room dining and resort reservations
              </p>
            </div>

            <button
              onClick={() => setActiveTab('menu')}
              className="px-4 py-2 bg-[#12382D] text-white rounded-xl text-xs font-medium hover:bg-[#0D2820] transition-colors"
            >
              Order More Items
            </button>
          </div>

          {userOrders.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#1E231E] rounded-3xl border border-[#C7A36A]/20 space-y-3">
              <ConciergeBell className="w-10 h-10 mx-auto text-[#C7A36A]/60" />
              <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">
                No Culinary Orders Yet
              </h3>
              <p className="text-xs text-[#242722]/60 dark:text-[#A9B8A4] max-w-sm mx-auto">
                Discover our signature Awadhi biryani, artisanal breakfast baskets, or fresh cold-pressed elixirs.
              </p>
              <button
                onClick={() => setActiveTab('menu')}
                className="mt-2 px-5 py-2.5 bg-[#C7A36A] text-[#12382D] font-semibold text-xs tracking-wider uppercase rounded-xl"
              >
                Explore Culinary Menu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userOrders.map((ord) => {
                const statusColors = {
                  received: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300',
                  preparing: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
                  out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300',
                  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300',
                  cancelled: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300',
                };

                const statusLabel = {
                  received: 'Order Received',
                  preparing: 'In Preparation',
                  out_for_delivery: 'Out for Butler Delivery',
                  delivered: 'Delivered to Guest',
                  cancelled: 'Cancelled',
                }[ord.status];

                return (
                  <div
                    key={ord.id}
                    className="p-5 sm:p-6 bg-white dark:bg-[#1E231E] rounded-2xl border border-[#C7A36A]/25 shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C7A36A]/15 pb-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-lg font-bold text-[#12382D] dark:text-[#F7F3EA]">
                            #{ord.order_number}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[ord.status]}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#A9B8A4]">
                          {new Date(ord.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {ord.delivery_location}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-serif font-bold text-[#12382D] dark:text-[#C7A36A]">
                          ₹{ord.total_inr.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#A9B8A4] capitalize">
                          {ord.payment_method === 'room_charge'
                            ? 'Room Folio'
                            : ord.payment_method === 'cash'
                            ? `Cash (${ord.payment_status})`
                            : ord.payment_method}
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {ord.items.map((it, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#F7F3EA]/50 dark:bg-black/20"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                it.is_veg ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            />
                            <span className="font-medium text-[#12382D] dark:text-[#F7F3EA]">
                              {it.quantity}x {it.name}
                            </span>
                          </div>
                          <span className="text-[#A9B8A4]">₹{it.subtotal_inr.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {ord.special_instructions && (
                      <div className="text-[11px] text-[#A9B8A4] italic bg-[#12382D]/5 dark:bg-white/5 p-2 rounded-lg">
                        Instructions: {ord.special_instructions}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Menu Section */
        <div className="space-y-6">
          
          {/* Controls: Search, Veg Toggle, Sort */}
          <div className="bg-white dark:bg-[#1E231E] p-4 sm:p-5 rounded-2xl border border-[#C7A36A]/20 shadow-xs flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A9B8A4]" />
              <input
                type="text"
                placeholder="Search dishes, royal biryani, tea, desserts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#F7F3EA]/60 dark:bg-black/20 border border-[#C7A36A]/30 rounded-xl text-[#242722] dark:text-[#F7F3EA] focus:outline-hidden focus:border-[#12382D]"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Veg Only Toggle */}
              <button
                type="button"
                onClick={() => setVegOnly(!vegOnly)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  vegOnly
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    : 'border-[#C7A36A]/30 bg-[#F7F3EA]/60 dark:bg-black/20 text-[#242722]/80 dark:text-[#A9B8A4]'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Vegetarian Only</span>
              </button>

              {/* Sort By */}
              <div className="flex items-center gap-1.5 text-xs text-[#242722]/70 dark:text-[#A9B8A4]">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-[#F7F3EA]/60 dark:bg-black/20 border border-[#C7A36A]/30 rounded-xl px-2.5 py-2 text-xs text-[#242722] dark:text-[#F7F3EA] focus:outline-hidden"
                >
                  <option value="featured">Featured Chef Selection</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Tabs Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-serif font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#12382D] text-white shadow-md border border-[#12382D]'
                      : 'bg-white dark:bg-[#1E231E] text-[#242722]/80 dark:text-[#A9B8A4] hover:border-[#C7A36A]/40 border border-[#C7A36A]/20'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C7A36A]' : 'text-[#A9B8A4]'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Menu Items Grid */}
          {sortedItems.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#1E231E] rounded-3xl border border-[#C7A36A]/20 space-y-3">
              <UtensilsCrossed className="w-10 h-10 mx-auto text-[#C7A36A]/50" />
              <h3 className="font-serif text-lg text-[#12382D] dark:text-[#F7F3EA]">
                No Culinary Dishes Found
              </h3>
              <p className="text-xs text-[#242722]/60 dark:text-[#A9B8A4]">
                Try adjusting your search criteria or clearing dietary filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setVegOnly(false);
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 bg-[#12382D] text-white rounded-xl text-xs"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedItems.map((item) => {
                const itemQty = quantities[item.id] || 1;
                const isJustAdded = addedAnimation === item.id;

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-[#1E231E] rounded-2xl border border-[#C7A36A]/25 overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow group"
                  >
                    <div>
                      {/* Image container */}
                      <div className="relative h-52 overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                        <ImageWithFallback
                          src={item.image_url}
                          alt={item.name}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          {/* Veg / Non-Veg Emblem */}
                          <div
                            className={`w-5 h-5 rounded-sm border bg-white/95 dark:bg-black/80 flex items-center justify-center shadow-xs ${
                              item.is_veg ? 'border-emerald-600' : 'border-rose-600'
                            }`}
                            title={item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}
                            />
                          </div>

                          {item.featured && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#12382D]/90 backdrop-blur-md text-[#C7A36A] text-[10px] font-serif font-semibold border border-[#C7A36A]/30">
                              Chef Special
                            </span>
                          )}
                        </div>

                        {/* Prep time badge */}
                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-white text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#C7A36A]" />
                          <span>{item.preparation_time_minutes}m</span>
                        </div>
                      </div>

                      {/* Info & Description */}
                      <div className="p-5 space-y-2.5">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-serif text-lg font-normal text-[#12382D] dark:text-[#F7F3EA] leading-snug">
                            {item.name}
                          </h3>
                          <div className="text-right shrink-0">
                            <span className="font-serif text-lg font-bold text-[#12382D] dark:text-[#C7A36A]">
                              ₹{item.price_inr.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-[#242722]/70 dark:text-[#A9B8A4] leading-relaxed line-clamp-2">
                          {item.description}
                        </p>

                        {/* Dietary tags */}
                        {item.dietary_tags && item.dietary_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.dietary_tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-[#F7F3EA] dark:bg-white/5 text-[10px] text-[#12382D] dark:text-[#A9B8A4] border border-[#C7A36A]/15"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom controls: Quantity and Add to Cart */}
                    <div className="p-5 pt-0">
                      <div className="pt-3 border-t border-[#C7A36A]/15 flex items-center gap-3">
                        {/* Quantity Selector */}
                        <div className="flex items-center border border-[#C7A36A]/30 rounded-xl bg-[#F7F3EA]/60 dark:bg-black/20">
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={!item.is_available}
                            className="p-2 hover:text-[#12382D] dark:hover:text-[#C7A36A] transition-colors disabled:opacity-40 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold">{itemQty}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            disabled={!item.is_available}
                            className="p-2 hover:text-[#12382D] dark:hover:text-[#C7A36A] transition-colors disabled:opacity-40 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Add Button */}
                        <button
                          onClick={() => handleAddToCart(item)}
                          disabled={!item.is_available}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                            !item.is_available
                              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                              : isJustAdded
                              ? 'bg-emerald-700 text-white'
                              : 'bg-[#12382D] hover:bg-[#0D2820] text-white'
                          }`}
                        >
                          {isJustAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added</span>
                            </>
                          ) : !item.is_available ? (
                            <span>Sold Out</span>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5 text-[#C7A36A]" />
                              <span>Add to Cart</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Floating Cart Button (when items in cart) */}
      {itemCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40 animate-in slide-in-from-bottom-6 duration-300">
          <button
            onClick={openCart}
            className="flex items-center gap-3.5 px-5 py-3.5 bg-[#12382D] hover:bg-[#0D2820] text-white rounded-full shadow-2xl border border-[#C7A36A]/40 cursor-pointer transition-transform hover:scale-105"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-[#C7A36A]" />
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#C7A36A] text-[#12382D] font-bold text-[11px] flex items-center justify-center">
                {itemCount}
              </span>
            </div>

            <div className="text-left font-sans">
              <div className="text-[10px] text-[#A9B8A4] uppercase tracking-wider">View Cart</div>
              <div className="text-xs font-bold text-white">₹{totalInr.toLocaleString()}</div>
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer & Checkout Modal */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        activeStay={activeStay}
        onOrderSuccess={(ord) => {
          setIsCheckoutOpen(false);
          setActiveTab('orders');
          loadData();
        }}
      />

    </div>
  );
};
