import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle2,
  Clock,
  MapPin,
  Train,
  Star,
  X
} from 'lucide-react';
import { apiRequest } from '../api/client';
import { FoodVendor, FoodItem, FoodOrder } from '../types';
import { DemoNoticeBanner } from '../components/DemoNoticeBanner';

export const FoodOrderingPage: React.FC = () => {
  const [stationCode, setStationCode] = useState('MMCT');
  const [vendors, setVendors] = useState<FoodVendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<FoodVendor | null>(null);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [vegOnly, setVegOnly] = useState(false);
  const [cart, setCart] = useState<Record<number, { item: FoodItem; quantity: number }>>({});
  const [showCart, setShowCart] = useState(false);

  // Delivery Details
  const [trainNum, setTrainNum] = useState('12951');
  const [coachNum, setCoachNum] = useState('B2');
  const [seatNum, setSeatNum] = useState('45');
  const [activeOrders, setActiveOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVendors = async (st: string) => {
    try {
      const data = await apiRequest<FoodVendor[]>(`/food/vendors?station_code=${st}`);
      setVendors(data);
      if (data.length > 0) {
        selectVendor(data[0]);
      }
    } catch {}
  };

  const selectVendor = async (v: FoodVendor) => {
    setSelectedVendor(v);
    try {
      const items = await apiRequest<FoodItem[]>(`/food/vendors/${v.id}/menu`);
      setMenuItems(items);
    } catch {}
  };

  const fetchOrders = async () => {
    try {
      const orders = await apiRequest<FoodOrder[]>('/food/orders');
      setActiveOrders(orders);
    } catch {}
  };

  useEffect(() => {
    fetchVendors(stationCode);
    fetchOrders();
  }, []);

  const addToCart = (item: FoodItem) => {
    setCart((prev) => {
      const existing = prev[item.id];
      const count = existing ? existing.quantity + 1 : 1;
      return { ...prev, [item.id]: { item, quantity: count } };
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: { ...existing, quantity: existing.quantity - 1 } };
    });
  };

  const totalCartAmount = Object.values(cart).reduce(
    (sum, c) => sum + c.item.price * c.quantity,
    0
  );

  const totalCartCount = Object.values(cart).reduce(
    (sum, c) => sum + c.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (!selectedVendor) return;
    setLoading(true);
    try {
      const payload = {
        vendor_id: selectedVendor.id,
        train_number: trainNum,
        delivery_station: selectedVendor.station_id === 1 ? 'Mumbai Central' : 'Surat',
        coach: coachNum,
        seat: seatNum,
        payment_method: 'WALLET',
        items: Object.values(cart).map((c) => ({
          item_id: c.item.id,
          quantity: c.quantity,
        })),
      };

      await apiRequest<FoodOrder>('/food/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert('Food order confirmed! Delivery scheduled at next station.');
      setCart({});
      setShowCart(false);
      fetchOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to place food order.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter((i) => (vegOnly ? i.is_veg : true));

  return (
    <div className="pb-24 pt-3 px-4 space-y-4">
      <DemoNoticeBanner compact />

      <div>
        <h1 className="text-lg font-black text-[#1B254B] tracking-tight">
          Onboard Food Delivery (e-Catering)
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Fresh hot meals delivered right to your train berth
        </p>
      </div>

      {/* Station Selector */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {['MMCT', 'CSMT', 'NDLS', 'PUNE'].map((code) => (
          <button
            key={code}
            onClick={() => {
              setStationCode(code);
              fetchVendors(code);
            }}
            className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              stationCode === code
                ? 'bg-blue-600 text-white shadow-soft'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {code} Station
          </button>
        ))}
      </div>

      {/* Vendors horizontal selector */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
          Station Restaurants
        </span>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {vendors.map((v) => (
            <button
              key={v.id}
              onClick={() => selectVendor(v)}
              className={`p-3 rounded-2xl border text-left shrink-0 w-44 transition-all shadow-soft ${
                selectedVendor?.id === v.id
                  ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 line-clamp-1">
                  {v.vendor_name}
                </span>
                <span className="flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.2 rounded">
                  <Star className="w-2.5 h-2.5 fill-amber-500 mr-0.5" />
                  {v.rating}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 line-clamp-1 block mt-0.5">
                {v.cuisine_type}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Veg toggle filter */}
      <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-2xl border border-slate-200/80">
        <span className="text-xs font-bold text-slate-800">Pure Vegetarian Only</span>
        <input
          type="checkbox"
          checked={vegOnly}
          onChange={(e) => setVegOnly(e.target.checked)}
          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
        />
      </div>

      {/* Food Menu Items List */}
      <div className="space-y-2.5">
        {filteredItems.map((item) => {
          const inCart = cart[item.id]?.quantity || 0;
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-soft flex items-center justify-between text-xs"
            >
              <div className="space-y-1 flex-1 pr-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      item.is_veg ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="font-extrabold text-slate-900">{item.item_name}</span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2">{item.description}</p>
                <span className="font-black text-sm text-slate-900 block">₹{item.price}</span>
              </div>

              <div className="shrink-0">
                {inCart > 0 ? (
                  <div className="flex items-center bg-blue-600 text-white rounded-xl px-2 py-1 gap-2 shadow-sm font-bold text-xs">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="hover:opacity-80 p-0.5"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span>{inCart}</span>
                    <button onClick={() => addToCart(item)} className="hover:opacity-80 p-0.5">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(item)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs rounded-xl transition-all active:scale-95"
                  >
                    ADD +
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating View Cart bar */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-16 left-4 right-4 max-w-md mx-auto z-40">
          <div
            onClick={() => setShowCart(true)}
            className="bg-slate-900 text-white rounded-2xl p-3 shadow-floating flex items-center justify-between cursor-pointer active:scale-95 transition-all"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-xs font-bold block">{totalCartCount} item(s)</span>
                <span className="text-[10px] text-slate-400">Tap to review berth delivery</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-emerald-400">₹{totalCartAmount}</span>
              <span className="bg-blue-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-xl">
                View Cart
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Delivery Details & Cart</h3>
              <button
                onClick={() => setShowCart(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery Inputs */}
            <div className="bg-slate-50 rounded-2xl p-3 space-y-2.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Deliver to Berth
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Train #</label>
                  <input
                    type="text"
                    value={trainNum}
                    onChange={(e) => setTrainNum(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Coach</label>
                  <input
                    type="text"
                    value={coachNum}
                    onChange={(e) => setCoachNum(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Seat/Berth</label>
                  <input
                    type="text"
                    value={seatNum}
                    onChange={(e) => setSeatNum(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {Object.values(cart).map((c) => (
                <div key={c.item.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{c.item.item_name}</span>
                    <span className="text-[10px] text-slate-400 block">
                      {c.quantity} × ₹{c.item.price}
                    </span>
                  </div>
                  <span className="font-black text-slate-900">₹{c.quantity * c.item.price}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-black text-slate-900">
              <span>Total Amount</span>
              <span className="text-blue-700">₹{totalCartAmount}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-card transition-all"
            >
              {loading ? 'Confirming...' : `Pay from R-Wallet (₹${totalCartAmount})`}
            </button>
          </div>
        </div>
      )}

      {/* Active Orders Tracker */}
      {activeOrders.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Your Orders ({activeOrders.length})
          </span>

          <div className="space-y-2">
            {activeOrders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-soft space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900">{o.order_ref} • {o.vendor_name}</span>
                  <span className="bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                    {o.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Deliver to Coach {o.coach}, Seat {o.seat} at {o.delivery_station}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
