# Checkout, orders and admin setup

Checkout is live against Razorpay with a PostgreSQL order store. Nothing is faked:
an order becomes `paid` only after the server verifies Razorpay's HMAC signature,
and every amount is recalculated server-side from the catalogue.

## 1. Environment

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string (Vercel Postgres / Neon) |
| `RAZORPAY_KEY_ID` | yes | Razorpay key id. **Test** mode while developing; `rzp_live_` takes real money |
| `RAZORPAY_KEY_SECRET` | yes | Server-only. Never prefix with `NEXT_PUBLIC_` |
| `ORDER_SIGNING_SECRET` | recommended | `openssl rand -hex 32`. Signs admin cookies and receipt links |
| `ADMIN_EMAIL` | yes | Admin login handle |
| `ADMIN_PASSWORD` | yes | Admin password, 8 characters or more |
| `DELHIVERY_API_KEY` | no | Delhivery API key, only if a delivery integration is wired up |

The Razorpay key id reaches the browser in the `create-order` response, so there is
no `NEXT_PUBLIC_RAZORPAY_KEY_ID` to set. Do not add one: a second copy of the key
can drift from `RAZORPAY_KEY_ID` and the checkout would then fail at payment time.

Admin session cookies and receipt links are both signed with `ORDER_SIGNING_SECRET`.
Rotating that secret invalidates every existing admin session and receipt link.

| `SHIPPING_FEE_INR` | optional | Delivery charge, defaults to `49` |
| `FREE_SHIPPING_THRESHOLD_INR` | optional | Waive delivery above this subtotal; blank always charges |

`signingSecret()` falls back to `AUTH_SECRET` and then `RAZORPAY_KEY_SECRET` so
signing never silently degrades, but set a dedicated secret.

## 2. Database

```bash
npm run db:generate   # regenerate client after schema edits
npm run db:migrate    # create/apply a migration in development
npm run db:deploy     # apply committed migrations (CI / production)
npm run db:studio     # inspect data
```

The committed migration is `prisma/migrations/20260101000000_init/migration.sql`.
Order IDs come from the `OrderSequence` table, so they stay sequential per day
(`NCJ-20261005-000123`) without relying on auto-increment gaps.

## 3. Run it

```bash
npm run dev
```

Checkout is at `/checkout`. Admin is at `/admin` and redirects to `/admin/login`
unless a valid signed cookie is present.

## 4. Tests

```bash
npm test          # validation, pricing, signatures, order ids, tokens, PDF
npm run typecheck # tsc --noEmit
npm run lint
npm run build
```

`npm test` runs without credentials or a database:

- `checkout.test.ts` — mobile/PIN rules, mandatory fields, server pricing, paise
  conversion, Razorpay signature verification, order id format, receipt tokens.
- `checkout-render.test.ts` — the checkout form's rendered markup: all six
  mandatory fields present and `required`, email optional, state is a 36-entry
  dropdown, and no price field the browser could tamper with is posted.
- `invoice-pdf.test.ts` — the receipt is a valid parseable PDF with an embedded
  logo, and renders for long addresses, many line items, and unpaid orders.

A sample invoice is written to `tmp/sample-invoice.pdf` for inspection.

## 5. Not covered by automated tests

These need real credentials or infrastructure, so verify them once after setup:

- Applying the migration to your actual PostgreSQL instance.
- Creating a real Razorpay order and completing a **Test mode** payment.
  Razorpay provides test cards, e.g. `4111 1111 1111 1111`, any future expiry and
  any CVV.
- That a successful payment flips the row to `paid` and clears the cart.
- That a repeated verification of the same payment is idempotent and does not
  duplicate the order.
- That a tampered signature is rejected.
- Admin login, order listing, and PDF download.
- That `DATABASE_URL` and `RAZORPAY_KEY_SECRET` are set in the Vercel project,
  since the app builds fine without them and fails only at request time.

## 6. Order of operations on the server

1. `POST /api/razorpay/create-order` validates fields, reprices the cart, inserts a
   `pending` order, then calls Razorpay and stores `razorpayOrderId`.
2. The browser opens Razorpay Checkout.
3. `POST /api/razorpay/verify` recomputes the HMAC over
   `razorpay_order_id|razorpay_payment_id` with `RAZORPAY_KEY_SECRET`. On a match
   the order becomes `paid` and stores `paymentId`.
4. The customer is redirected to `/order-success/<orderId>?token=<signed>`. The
   token is bound to that order id, so the details and PDF endpoints cannot be
   used to read somebody else's order.

Unique constraints on `razorpayOrderId` and `paymentId` make the confirm step
idempotent under retries or double-clicks.

## 7. Known limits

- Coupons and promotions are deferred; no discount code field exists yet.
- Orders can be abandoned in `pending` state if the customer never pays. There is
  no scheduled cleanup job or `expired` transition.
- Shipping is a flat server-side fee. It is not calculated from weight or pin code.
- Admin has read-only order and revenue views; there is no fulfilment status
  editing, export, or refunds.
- Razorpay webhooks are not handled. Verification is entirely customer-driven, so a
  customer who closes the tab after paying leaves the order `pending` until they
  retry. Add `POST /api/razorpay/webhook` with `RAZORPAY_WEBHOOK_SECRET` before
  relying on this for meaningful volume.
- The success page has no order-history view; the receipt link is the only record a
  customer keeps.