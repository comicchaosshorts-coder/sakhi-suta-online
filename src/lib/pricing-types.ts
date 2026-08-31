// Client-safe types shared between the pricing engine and the UI.

export type QuoteItemInput = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

export type DiscountKind = "auto" | "returning" | "campaign" | "coupon";

export type QuoteDiscount = {
  kind: DiscountKind;
  label: string;
  percent: number | null;
  amount_inr: number;
  code?: string;
  campaign_id?: string;
  coupon_id?: string;
};

export type QuoteLine = {
  productId: string;
  variantId: string | null;
  variantName: string | null;
  name: string;
  slug: string;
  price_inr: number;
  quantity: number;
  image: string | null;
  saree_type: string | null;
};

export type CouponState = {
  code: string;
  applied: boolean;
  message: string;
};

export type Quote = {
  lines: QuoteLine[];
  removed: string[];
  subtotal_inr: number;
  discounts: QuoteDiscount[];
  discount_total_inr: number;
  shipping_inr: number;
  total_inr: number;
  coupon: CouponState | null;
  isReturningCustomer: boolean;
  /** Friendly nudges e.g. "Add ₹150 more to unlock your 5% discount." */
  messages: string[];
};
