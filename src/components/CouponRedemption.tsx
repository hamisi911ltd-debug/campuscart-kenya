import { useState } from "react";
import { Gift, Check, X, Percent } from "lucide-react";
import { toast } from "sonner";

interface CouponRedemptionProps {
  onCouponApplied: (discount: number, couponCode: string) => void;
  onCouponRemoved: () => void;
  appliedCoupon?: string;
  orderTotal: number;
}

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  active: boolean;
}

export const CouponRedemption = ({ 
  onCouponApplied, 
  onCouponRemoved, 
  appliedCoupon, 
  orderTotal 
}: CouponRedemptionProps) => {
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setIsApplying(true);
    
    try {
      // First try to get from API
      const response = await fetch(`/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: couponCode.toUpperCase(),
          orderTotal 
        }),
      });

      let coupon: Coupon | null = null;

      if (response.ok) {
        const data = await response.json();
        coupon = data.coupon;
      } else {
        // Fallback to localStorage
        const savedCoupons = localStorage.getItem('campusmart_coupons');
        if (savedCoupons) {
          const coupons: Coupon[] = JSON.parse(savedCoupons);
          coupon = coupons.find(c => 
            c.code.toUpperCase() === couponCode.toUpperCase() && 
            c.active
          ) || null;
        }
      }

      if (!coupon) {
        toast.error('Invalid coupon code');
        return;
      }

      // Validate coupon
      const now = new Date();
      
      if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
        toast.error('This coupon has expired');
        return;
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        toast.error('This coupon has reached its usage limit');
        return;
      }

      if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
        toast.error(`Minimum order amount is KES ${coupon.minOrderAmount.toLocaleString()}`);
        return;
      }

      // Calculate discount
      let discount = 0;
      if (coupon.type === 'percentage') {
        discount = (orderTotal * coupon.value) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = Math.min(coupon.value, orderTotal);
      }

      onCouponApplied(discount, coupon.code);
      setCouponCode('');
      toast.success(`Coupon applied! You saved KES ${discount.toLocaleString()}`);

    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Failed to apply coupon. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const removeCoupon = () => {
    onCouponRemoved();
    toast.success('Coupon removed');
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
              <Check className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-200">
                Coupon Applied: {appliedCoupon}
              </p>
              <p className="text-sm text-green-600 dark:text-green-300">
                Discount has been applied to your order
              </p>
            </div>
          </div>
          <button
            onClick={removeCoupon}
            className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 transition-colors"
            title="Remove coupon"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Have a coupon code?
        </h3>
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
        />
        <button
          onClick={applyCoupon}
          disabled={isApplying || !couponCode.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isApplying ? 'Applying...' : 'Apply'}
        </button>
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Enter your coupon code to get a discount on your order
      </p>
    </div>
  );
};