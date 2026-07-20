# OnTheList — Payment Module

> **Purpose:** End-to-end reference for how money moves through OnTheList — ticket sales, platform fees, organiser payouts, refunds, resale, and Stripe costs.  
> **Region:** UK (GBP)  
> **Last updated:** July 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Decision](#architecture-decision)
3. [Third-Party Services](#third-party-services)
4. [Fee Model](#fee-model)
5. [Stripe UK Fees](#stripe-uk-fees)
6. [Primary Ticket Sale Flow](#primary-ticket-sale-flow)
7. [Organiser Onboarding Flow](#organiser-onboarding-flow)
8. [Payout Flow (48-Hour Lock)](#payout-flow-48-hour-lock)
9. [Event Cancellation & Refund Flow](#event-cancellation--refund-flow)
10. [Resale Payment Flow](#resale-payment-flow)
11. [Chargebacks vs Refunds](#chargebacks-vs-refunds)
12. [Payout State Machine](#payout-state-machine)
13. [Order Status State Machine](#order-status-state-machine)
14. [Financial Examples](#financial-examples)
15. [Database Schema (Payment-Related)](#database-schema-payment-related)
16. [Stripe Webhooks](#stripe-webhooks)
17. [API Endpoints (Payment)](#api-endpoints-payment)
18. [Compliance & Risk](#compliance--risk)
19. [Current Implementation vs Target](#current-implementation-vs-target)
20. [Launch Checklist](#launch-checklist)

---

## Executive Summary

OnTheList is a UK event ticketing platform. The platform:

- Charges customers a **ticket price + 7% booking fee**
- Acts as **Merchant of Record (MoR)** — all card payments land in the platform Stripe account first
- Pays organisers **after the event**, with a **48-hour post-event lock** before withdrawal is allowed
- Uses **Stripe Connect Custom** accounts silently per organiser (white-label — organisers never see Stripe)
- Refunds **ticket price only** on cancellation — **booking fee is non-refundable**
- Handles peer-to-peer **resale** with a separate 7% fee

**Money path (target architecture):**

```
Customer card
  → Platform Stripe balance (MoR)
  → Stripe daily payout → Platform business bank / Wise balance
  → [48hr lock after event]
  → Organiser requests withdrawal
  → stripe.transfers.create() → Organiser silent Connect account
  → Stripe auto-pays organiser UK bank (Bacs / Faster Payments)
```

---

## Architecture Decision

### Why Stripe Connect Custom (not Express, not Wise)

| Approach | Organiser sees Stripe? | MoR control | 48hr lock | KYC |
|----------|------------------------|-------------|-----------|-----|
| Stripe Express | Yes (redirect) | Partial | Hard | Stripe |
| Stripe Custom | **No** | **Full** | **Yes** | Stripe (silent) |
| Wise Platform | No | Full | Yes | You (Sumsub) |
| Manual bank transfer | No | Full | Yes | You |

**Chosen:** Stripe Connect **Custom** — organisers fill your forms, you create silent Connect accounts via API, Stripe handles KYC and bank payouts behind the scenes.

### Merchant of Record (MoR)

- **You** (OnTheList) are the legal seller to the customer
- Customer's bank statement shows **OnTheList**
- You are liable for refunds, chargebacks, and tax reporting
- Organisers are paid as suppliers after the event

### 48-Hour Lock

Funds become available for organiser withdrawal **48 hours after event end time**.

This solves three problems at once:

1. **Chargeback window** — time to catch fraudulent purchases
2. **Stripe settlement** — Stripe daily payout to your bank completes before organisers can withdraw
3. **Event completion buffer** — organiser can't withdraw before the event happens

```
Day 0  — Event ends
Day 1  — Stripe daily payout runs → money in your bank
Day 2  — 48hr lock expires → organiser can request withdrawal
```

---

## Third-Party Services

### Required

| Service | Role |
|---------|------|
| **Stripe** | Collect payments, hold balance, KYC (Custom Connect), pay organisers |
| **Business bank account** | Receive Stripe daily payouts (can be Wise Business) |
| **Email (SMTP / Nodemailer)** | Payout notifications, refund confirmations |

### Not required (with Stripe Custom)

| Service | Why skipped |
|---------|-------------|
| Wise Platform | Stripe handles organiser bank payouts |
| Sumsub / Onfido | Stripe handles KYC silently |
| TrueLayer | Stripe verifies bank details |
| Starling / Revolut | Your business bank receives Stripe payouts |

### Optional (scale)

| Service | When to add |
|---------|-------------|
| Stripe Radar | Fraud prevention at volume |
| Sumsub | Enhanced KYC if Stripe flags accounts |
| UK payments lawyer | Before public launch |

---

## Fee Model

### Constants (codebase)

```ts
// shared/constants.ts (all three apps)
export const BOOKING_FEE_PERCENT = 7;
export const RESALE_FEE_PERCENT = 7;
```

### Primary ticket purchase

| Component | Formula | Example (£10 ticket) |
|-----------|---------|----------------------|
| Ticket price (organiser revenue) | `basePrice` | £10.00 |
| Booking fee (platform revenue) | `basePrice × 7%` | £0.70 |
| **Customer pays** | `basePrice + bookingFee` | **£10.70** |

### Resale purchase

| Component | Formula | Example |
|-----------|---------|---------|
| Resale asking price | Set by seller | £100.00 |
| Booking fee (platform) | `askingPrice × 7%` | £7.00 |
| **Buyer pays** | `askingPrice + fee` | **£107.00** |
| Seller receives | Original purchase price (refund) | £100.00 |
| Organiser receives | `askingPrice - originalPurchasePrice` | £0 (same price) or uplift |
| Platform receives | Booking fee | £7.00 |

### Refund policy (cancellation)

| Component | Refunded? |
|-----------|-----------|
| Ticket price (`basePrice`) | **Yes** |
| Booking fee (7%) | **No — platform keeps** |
| Stripe processing fee | **No — platform absorbs** |

---

## Stripe UK Fees

### Card processing (per transaction)

| Card type | Fee |
|-----------|-----|
| UK Visa / Mastercard | **1.5% + £0.20** |
| European (EEA) cards | 2.5% + £0.20 |
| International cards | 3.25% + £0.20 |
| UK Amex | 2.0% + £0.20 |

### Stripe Connect payout fee

| Fee | Rate |
|-----|------|
| Transfer to connected account | **0.25% + £0.10** per payout |

### Refunds

| Item | Cost |
|------|------|
| Extra fee to process refund | **£0** |
| Original processing fee returned? | **No** — you lose 1.5% + £0.20 |

### Chargebacks (disputes)

| Item | Cost |
|------|------|
| Dispute opened | **~£20** (non-refundable) |
| Dispute contested and lost | Additional **~£20** |

> Refunds and chargebacks are different. A voluntary refund (event cancelled) has no extra Stripe fee but you lose the original processing fee. A chargeback costs ~£20+ on top.

### Fee formula helpers

```ts
function stripeProcessingFeeGBP(amountGbp: number): number {
  return Math.round((amountGbp * 0.015 + 0.20) * 100) / 100;
}

function stripeConnectPayoutFeeGBP(payoutGbp: number): number {
  return Math.round((payoutGbp * 0.0025 + 0.10) * 100) / 100;
}

function bookingFeeGBP(ticketPriceGbp: number): number {
  return Math.round(ticketPriceGbp * 0.07 * 100) / 100;
}

function customerTotalGBP(ticketPriceGbp: number): number {
  return Math.round((ticketPriceGbp + bookingFeeGBP(ticketPriceGbp)) * 100) / 100;
}
```

---

## Primary Ticket Sale Flow

```
┌─────────────┐
│   Customer  │
└──────┬──────┘
       │ Selects tickets on web app
       ▼
┌─────────────────────────────────────┐
│  POST /api/checkout/create-session  │
│  - Validate event published         │
│  - Check organiser Connect ready    │
│  - Allocate resale listings (FIFO)  │
│  - Calculate fees                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Stripe Checkout Session            │
│  mode: payment                      │
│  line_items: ticket + booking fee   │
│  (MoR: no destination on checkout)  │
└──────┬──────────────────────────────┘
       │ Customer pays £10.70
       ▼
┌─────────────────────────────────────┐
│  Platform Stripe Balance            │
│  +£10.70 (minus Stripe fee ~£0.36)  │
└──────┬──────────────────────────────┘
       │
       ├── Webhook: checkout.session.completed
       │   → Create Order (status: paid)
       │   → Mint tickets + QR codes
       │   → Send confirmation email
       │
       └── Stripe daily payout → Platform bank
```

### Per-ticket ledger entry (on sale)

```ts
{
  eventId,
  organiserId,
  orderId,
  grossAmount: 10.70,        // what customer paid
  ticketPrice: 10.00,        // organiser's share
  bookingFee: 0.70,          // platform revenue
  stripeFee: 0.36,           // estimated, actual from Stripe
  organiserNet: 10.00,       // owed to organiser (after event)
  payoutStatus: 'PENDING',   // not yet available
}
```

---

## Organiser Onboarding Flow

Organisers never leave your platform. Stripe Custom account is created silently.

```
Step 1 — Sign up (your form)
  Name, email, password, DOB, address, business type
  → DB: kycStatus = PENDING
  → Backend: stripe.accounts.create({ type: 'custom', country: 'GB' })
  → Store stripeAccountId in DB

Step 2 — Add bank details (your form)
  Account holder name, sort code, account number
  → Format check (6-digit sort code, 8-digit account)
  → Modulus check (uk-modulus-checking npm package)
  → stripe.accounts.createExternalAccount(accountId, { bank_account })
  → Encrypt and store in DB

Step 3 — Stripe KYC (silent)
  → stripe.accounts.update(accountId, { individual: { ... } })
  → Stripe verifies in background
  → If requirements.currently_due → collect via YOUR UI, pass to Stripe
  → Webhook account.updated → kycStatus = VERIFIED

Step 4 — Ready
  → Can create and publish events
  → Can receive payouts after events
```

### Stripe Custom account creation (backend)

```ts
const account = await stripe.accounts.create({
  type: 'custom',
  country: 'GB',
  email: organiser.email,
  capabilities: {
    transfers: { requested: true },
  },
  tos_acceptance: {
    date: Math.floor(Date.now() / 1000),
    ip: req.ip,
  },
  metadata: { userId: organiser.id },
});
```

### Attach UK bank account

```ts
await stripe.accounts.createExternalAccount(account.id, {
  external_account: {
    object: 'bank_account',
    country: 'GB',
    currency: 'gbp',
    routing_number: sortCode.replace(/-/g, ''),  // 6 digits, no dashes
    account_number: accountNumber,
  },
});
```

---

## Payout Flow (48-Hour Lock)

```
Event ends (Day 0)
  ↓
Cron: mark event COMPLETED, set clearedAt = eventEnd + 48hrs
  ↓
Status: PENDING → CLEARED (Day 2)
  ↓
Organiser sees "£X available for withdrawal"
  ↓
Organiser clicks "Request Payout" (your UI)
  ↓
Backend pre-checks:
  ✅ kycStatus === VERIFIED
  ✅ Bank details on file
  ✅ Event status === CLEARED
  ✅ Balance >= minimum (£5)
  ✅ Sanctions re-check (if using Sumsub)
  ↓
Deduct platform fee (already deducted at sale — transfer ticket price only)
  ↓
stripe.transfers.create({
  amount: netPayoutPence,
  currency: 'gbp',
  destination: organiser.stripeAccountId,
  transfer_group: `EVENT_${eventId}`,
})
  ↓
Status: WITHDRAWAL_REQUESTED → PROCESSING
  ↓
Stripe auto-pays organiser bank (Faster Payments: minutes–2hrs, Bacs: up to 3 days)
  ↓
Webhook: transfer.paid → status: PAID
  ↓
Email: "£X sent to your bank account"
```

### What organiser sees

| Step | Organiser UI | Behind the scenes |
|------|--------------|-------------------|
| Add bank | Your form | Stripe Custom external account |
| Sell tickets | Your dashboard | Money in platform Stripe |
| Event ends | "Payout in 48hrs" | Cron sets clearedAt |
| Request payout | Your button | stripe.transfers.create |
| Receive money | Bank notification | Stripe Bacs/Faster Payments |

Organiser **never** sees Stripe branding or creates a Stripe login.

---

## Event Cancellation & Refund Flow

Triggered when an organiser or admin cancels an event **before** (or after) the event date.

```
Admin/Organiser cancels event
  ↓
For each paid order on this event:
  ↓
  Refund amount = ticketPrice ONLY (NOT booking fee)
  ↓
  stripe.refunds.create({
    payment_intent: order.stripePaymentIntentId,
    amount: ticketPricePence,   // partial refund
  })
  ↓
  Order status → partially_refunded
  Ticket status → cancelled
  ↓
  Email buyer: "£X refunded. Booking fee non-refundable."
  ↓
Organiser payout for this event = £0
Platform keeps booking fees from cancelled event
Platform absorbs Stripe processing fees (non-refundable)
```

### Refund rules

| Item | Action |
|------|--------|
| Ticket price | Refund to buyer |
| Booking fee (7%) | **Keep** — non-refundable |
| Stripe processing fee | **Absorb** — not returned by Stripe |
| Organiser transfer | **Block** — nothing to pay |
| Pending payout requests | **Cancel** |

### If organiser already paid out (edge case)

If payout happened before cancellation:

```
Refund buyers from platform balance
  +
Attempt to reverse transfer: stripe.transfers.createReversal()
  OR
Claw back from organiser's future earnings
  OR
Manual recovery
```

This is why the **48-hour lock before first payout** is critical.

---

## Resale Payment Flow

```
Original buyer lists ticket for resale
  ↓
New buyer purchases (checkout includes resale + booking fee)
  ↓
Payment lands in platform Stripe balance
  ↓
On payment success:
  1. Refund original seller at originalPurchasePrice
     (stripe.refunds.create on original PI)
  2. Transfer ticket ownership to new buyer
  3. Credit organiser uplift (if askingPrice > originalPrice)
  4. Platform keeps 7% booking fee
  ↓
Seller refund must succeed before ticket transfers
  (settlement_pending if refund fails — retryable)
```

### Resale money split (example: £100 ticket resold at £100)

| Party | Amount |
|-------|--------|
| New buyer pays | £107.00 |
| Seller refund | £100.00 |
| Platform fee | £7.00 |
| Organiser uplift | £0.00 (same price resale) |

### Resale with price uplift (£100 → £120)

| Party | Amount |
|-------|--------|
| New buyer pays | £128.40 (£120 + 7%) |
| Seller refund | £100.00 |
| Organiser uplift | £20.00 |
| Platform fee | £8.40 |

---

## Chargebacks vs Refunds

| | Refund (you initiate) | Chargeback (bank initiates) |
|---|---|---|
| Trigger | Event cancelled / customer request | Customer disputes with bank |
| Extra Stripe fee | **None** | **~£20 per dispute** |
| Processing fee returned | **No** | **No** |
| Customer gets money | Yes (ticket price) | Yes (if dispute wins) |
| Booking fee | You keep it | You may lose it |
| Prevention | 48hr lock, clear descriptor | 3DS, Stripe Radar |

---

## Payout State Machine

```
PENDING
  │  (tickets selling, event not ended)
  ▼
LOCKED
  │  (event ended, 48hr timer running)
  ▼
CLEARED
  │  (48hrs passed, available for withdrawal)
  ▼
WITHDRAWAL_REQUESTED
  │  (organiser clicked withdraw)
  ▼
PROCESSING
  │  (stripe.transfers.create sent)
  ├──► PAID        (transfer.paid webhook)
  └──► FAILED      (transfer.failed → retry or alert)
```

---

## Order Status State Machine

```
pending          → Checkout session created, not paid
paid             → Payment succeeded, tickets issued
settlement_pending → Resale seller refund in progress / failed (retry)
failed           → Payment failed
expired          → Checkout session expired
partially_refunded → Ticket price refunded, booking fee kept
refunded         → Full amount refunded (rare — only if policy changes)
```

---

## Financial Examples

### Example A — 5 events, 1 cancelled (your scenario)

**Setup:**

| Parameter | Value |
|-----------|-------|
| Events | 5 |
| Tickets per event | 100 |
| Ticket price | £10.00 |
| Booking fee | 7% = £0.70 |
| Customer pays | £10.70 |
| Cancelled events | 1 (before event date) |
| Refund policy | Ticket price only — booking fee NOT refunded |

**1. Total collected**

```
500 tickets × £10.70 = £5,350.00

  Ticket value:   500 × £10.00 = £5,000.00
  Booking fees:   500 × £0.70  = £350.00
```

**2. Cancelled event (100 tickets)**

```
Collected:          100 × £10.70 = £1,070.00
Refunded to buyers: 100 × £10.00 = £1,000.00  (ticket only)
Booking fee kept:   100 × £0.70  = £70.00
Organiser gets:     £0.00
```

**3. Stripe fees**

```
Per transaction (£10.70): (10.70 × 1.5%) + £0.20 = £0.3605

All 5 events (500 txns):     500 × £0.3605 = £180.25
Cancelled event (100 txns):  100 × £0.3605 = £36.05  ← lost, not refunded
Active events (400 txns):    400 × £0.3605 = £144.20
```

**4. Final position**

```
REVENUE
  Booking fees (all 500 tickets):           +£350.00

OUTFLOWS
  Refunds (cancelled event):                -£1,000.00
  Organiser payouts (4 events × 100 × £10): -£4,000.00
  Stripe processing (all 500 txns):         -£180.25
  Stripe Connect payouts (4 organisers):    -£99.46  (see below)

NET PROFIT:                                 ~£70.29
```

Connect payout fee per organiser: `(£1,000 × 0.25%) + £0.10 = £2.60` × 4 = `£10.40`

Adjusted net profit:

```
£350.00 - £180.25 - £10.40 = £159.35
(minus £1,000 refunds already excluded from cash; organisers got £4,000)
```

**Simpler profit view:**

| Line | Amount |
|------|--------|
| Booking fee revenue | £350.00 |
| Minus all Stripe fees | -£190.65 |
| **Platform net profit** | **£159.35** |

Cancelled event contribution: `£70.00 fee - £36.05 stripe = £33.95`

---

### Example B — 10 events × 100 tickets × £100 + 7% fee

| Metric | Amount |
|--------|--------|
| Customer pays per ticket | £107.00 |
| Total collected (1,000 tickets) | £107,000.00 |
| Platform fee (7% of £100) | £7,000.00 |
| Stripe processing | -£1,805.00 |
| To organisers | £98,195.00 |
| Stripe Connect fees | -£246.50 |
| **Platform net profit** | **£5,948.50** |

---

### Example C — 10% resale (100 tickets)

Additional resale revenue is lower margin because Stripe fees are paid twice (original + resale transaction) and original fee is not refunded.

| Metric | Amount |
|--------|--------|
| Initial profit | £5,948.50 |
| Resale profit (100 tickets) | +£339.00 |
| **Total profit** | **£6,287.50** |

---

## Database Schema (Payment-Related)

### Organiser

```ts
organisers: {
  id: string;
  email: string;
  fullName: string;
  dob: Date;                        // encrypted
  address: object;                  // encrypted
  businessType: 'individual' | 'sole_trader' | 'ltd_company';
  companyNumber?: string;

  // Stripe Connect Custom (silent)
  stripeAccountId: string;
  kycStatus: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
  kycVerifiedAt?: Date;

  // Bank details (encrypted at rest)
  bankDetails: {
    accountHolder: string;
    sortCode: string;               // encrypted
    accountNumber: string;          // encrypted
    copStatus?: 'full' | 'partial' | 'no' | 'unavailable';
  };

  balance: number;                  // available for withdrawal (GBP)
}
```

### Order

```ts
orders: {
  id: string;
  eventId: string;
  userId: string;
  ticketBatchName: string;
  quantity: number;
  basePrice: number;                // ticket price per unit
  bookingFee: number;               // platform fee per unit
  totalAmount: number;              // what customer paid
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  refundedAmount: number;           // cumulative refunds issued
  status: OrderStatus;
}
```

### Payout

```ts
payouts: {
  id: string;
  organiserId: string;
  eventId: string;
  grossAmount: number;              // total ticket sales for event
  platformFee: number;
  netAmount: number;                // sent to organiser
  status: PayoutStatus;
  stripeTransferId?: string;
  requestedAt?: Date;
  paidAt?: Date;
  failureReason?: string;
}
```

### Event (payment fields)

```ts
events: {
  bookingFee: number;               // % or fixed — default 7%
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  endDate: Date;
  clearedAt?: Date;                 // endDate + 48hrs
}
```

---

## Stripe Webhooks

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Fulfill order, mint tickets, send email |
| `payment_intent.succeeded` | Backup fulfillment trigger |
| `payment_intent.payment_failed` | Mark order failed |
| `charge.refunded` | Update order.refundedAmount + status |
| `account.updated` | Sync organiser KYC / capabilities |
| `transfer.created` | Log payout initiated |
| `transfer.paid` | Mark payout PAID, email organiser |
| `transfer.failed` | Mark payout FAILED, alert admin |
| `charge.dispute.created` | Alert admin, freeze organiser funds |

### Webhook handler pattern

```ts
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'checkout.session.completed':
      await fulfillCheckoutSession(event.data.object);
      break;
    case 'transfer.paid':
      await markPayoutPaid(event.data.object);
      break;
    case 'charge.dispute.created':
      await handleDispute(event.data.object);
      break;
  }

  res.json({ received: true });
});
```

---

## API Endpoints (Payment)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/checkout/create-session` | User | Primary ticket checkout |
| POST | `/api/checkout/confirm` | User | Confirm session after redirect |
| POST | `/api/resale/:id/buy` | User | Resale checkout |
| POST | `/api/connect/stripe/account` | Organiser | Create silent Custom account |
| POST | `/api/connect/stripe/bank-details` | Organiser | Attach UK bank account |
| GET | `/api/connect/stripe/status` | Organiser | Sync KYC status |
| POST | `/api/payouts/request` | Organiser | Request withdrawal |
| GET | `/api/payouts` | Organiser | List payout history |
| POST | `/api/events/:id/cancel` | Admin/Organiser | Cancel event + trigger refunds |
| POST | `/webhooks/stripe` | Stripe | Webhook receiver |

---

## Compliance & Risk

### UK regulation

Collecting money, holding it, and paying third parties may require **FCA registration** (Payment Institution or E-Money Institution) unless a licensed partner (Stripe) holds the funds.

**With Stripe Connect Custom:** Stripe is the licensed entity for connected accounts. You remain MoR for customer-facing sales. Get a UK payments lawyer to confirm structure before launch (~£500 consultation).

### Required regardless of architecture

- Verify organiser identity (KYC)
- Sanctions / PEP screening
- Keep transaction records 5+ years
- AML policy document
- Money Laundering Reporting Officer (MLRO)
- Clear refund policy published in Terms

### Risk mitigations

| Risk | Mitigation |
|------|------------|
| Chargebacks | 48hr lock, 3DS, Stripe Radar, clear statement descriptor |
| Fraudulent organiser | Stripe KYC + bank verification |
| Payout before settlement | 48hr lock ensures Stripe has paid out to your bank |
| Event cancellation after payout | Block payouts until event cleared; reversal API |
| Insufficient balance for refunds | Maintain float buffer in Stripe balance |

### Company registration (India vs UK)

FCA regulates by **where customers and money flow are**, not where the company is registered. Serving UK customers with UK bank payouts requires UK compliance regardless of Indian incorporation.

---

## Current Implementation vs Target

> The codebase today differs from the target MoR architecture documented above. This section tracks the gap.

| Area | Current (codebase) | Target (this doc) |
|------|-------------------|-------------------|
| Connect type | **Express** (Stripe-hosted onboarding) | **Custom** (silent, your UI) |
| Money on checkout | **Destination charge** — splits to organiser immediately via `transfer_data.destination` + `application_fee_amount` | **MoR** — all money to platform first |
| Payout timing | Stripe manages organiser payout schedule | **48hr lock** + manual withdrawal request |
| Organiser onboarding | Redirect to Stripe | Your forms only |
| Refund on cancel | Partial implementation via `sync-refunds.ts` | Full event cancellation flow |
| Payout request API | Not implemented | `POST /api/payouts/request` |

### Migration path (Express → Custom MoR)

1. Switch `stripe.accounts.create` from `express` to `custom`
2. Remove `transfer_data.destination` from checkout sessions
3. Collect bank details via your admin UI
4. Implement payout state machine + 48hr cron
5. Implement `stripe.transfers.create` on withdrawal request
6. Migrate existing Express accounts or re-onboard organisers

---

## Launch Checklist

### Stripe setup

- [ ] Stripe account verified (UK business)
- [ ] Connect enabled (Custom accounts)
- [ ] Webhook endpoint registered
- [ ] Statement descriptor set to "ONTHELIST" (recognisable on bank statements)
- [ ] 3D Secure enabled
- [ ] Daily payout schedule configured
- [ ] Payout bank account added (Wise Business or business bank)

### Backend

- [ ] Checkout creates sessions without destination charge (MoR mode)
- [ ] Custom Connect account creation on organiser signup
- [ ] Bank details form + modulus validation
- [ ] 48hr lock cron job
- [ ] Payout request + transfer API
- [ ] Event cancellation + partial refund (ticket only)
- [ ] All webhook handlers implemented
- [ ] Encrypted bank details at rest

### Frontend

- [ ] Organiser bank details form (admin)
- [ ] Payout dashboard (available balance + request button)
- [ ] Buyer refund policy visible at checkout
- [ ] "Booking fee non-refundable" in Terms

### Legal

- [ ] Refund policy published
- [ ] Terms of service updated
- [ ] UK payments lawyer review
- [ ] AML policy document
- [ ] MLRO appointed

### Testing

- [ ] Full primary purchase E2E (Stripe test mode)
- [ ] Resale purchase + seller refund E2E
- [ ] Event cancellation + partial refund E2E
- [ ] Payout request E2E (test connected account)
- [ ] Webhook replay tests
- [ ] Chargeback simulation

---

## Quick Reference Card

```
CUSTOMER PAYS:     ticketPrice + (ticketPrice × 7%)
PLATFORM KEEPS:    booking fee (always, even on refund)
ORGANISER GETS:    ticketPrice (after event + 48hr lock)
STRIPE TAKES:      1.5% + £0.20 per sale (not refunded on refund)
CONNECT TAKES:     0.25% + £0.10 per organiser payout
REFUND ON CANCEL:  ticketPrice only (booking fee kept)
CHARGEBACK COST:   ~£20 per dispute (on top of lost sale)
PAYOUT SPEED:      Faster Payments (minutes) or Bacs (3 days)
MIN WITHDRAWAL:    £5
LOCK PERIOD:       48 hours after event end
```

---

*For general project documentation see [DOCUMENTATION.md](./DOCUMENTATION.md). For high-level architecture see [ARCHITECTURE.md](./ARCHITECTURE.md).*
