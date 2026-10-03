// Server-side price list. The browser never decides what a credit costs:
// create-order prices the order from this table and verify-payment re-checks
// the paid amount against it. Keep in sync with the packs shown in BuyCredits.vue.
export const CREDIT_PACKAGES = [
  { credits: 10, price: 10 },
  { credits: 50, price: 9 },
  { credits: 100, price: 8 },
  { credits: 500, price: 7 },
];

/** Amount in paise for a pack, or null if `credits` isn't a sold pack. */
export function amountPaiseFor(credits) {
  const pack = CREDIT_PACKAGES.find((p) => p.credits === Number(credits));
  return pack ? Math.round(pack.credits * pack.price * 100) : null;
}
