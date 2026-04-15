import dotenv from "dotenv";
import path from "path";

const root = path.resolve(process.cwd(), "../..");
dotenv.config({ path: path.resolve(root, ".env.local") });
dotenv.config({ path: path.resolve(root, ".env") });

import mongoose from "mongoose";
import Stripe from "stripe";
import Order from "../models/Order";
import { connectDB } from "../lib/db";
import { logRefund } from "../lib/systemLogger";

async function run() {
  await connectDB();
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.error("No STRIPE_SECRET_KEY found.");
    process.exit(1);
  }
  
  const stripe = new Stripe(stripeSecret);
  
  const orders = await Order.find({ stripePaymentIntentId: { $exists: true, $ne: null } });
  console.log(`Found ${orders.length} orders with Payment Intents to check for refunds...`);
  
  let synced = 0;
  for (const order of orders) {
    if (!order.stripePaymentIntentId) continue;
    try {
      const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId, { expand: ['latest_charge'] });
      
      const charge = pi.latest_charge as Stripe.Charge | undefined;
      const amountRefunded = charge?.amount_refunded ? charge.amount_refunded / 100 : 0;
      
      let changed = false;
      if (order.refundedAmount !== amountRefunded) {
        order.refundedAmount = amountRefunded;
        changed = true;
      }
      
      if (amountRefunded > 0 && charge) {
        const isFullyRefunded = charge.amount_refunded >= charge.amount;
        const targetStatus = isFullyRefunded ? "refunded" : "partially_refunded";
        
        if (order.status !== targetStatus) {
          order.status = targetStatus;
          changed = true;
        }
      }
      
      if (changed) {
        await order.save();
        console.log(`[OK] Synced order ${(order as any)._id}: refunded £${amountRefunded}, status ${order.status}`);
        logRefund({
          event: "refund_sync_from_stripe",
          outcome: "success",
          orderId: String((order as any)._id),
          paymentIntentId: order.stripePaymentIntentId,
          amountGbp: amountRefunded,
          reason: `Order status synced to ${order.status}`,
        });
        synced++;
      }
    } catch (err: any) {
      console.error(`[ERROR] checking order ${(order as any)._id}:`, err.message);
      logRefund({
        event: "refund_sync_from_stripe_failed",
        outcome: "failure",
        orderId: String((order as any)._id),
        errorMessage: err.message,
      });
    }
  }
  
  console.log(`Sync complete! Updated ${synced} orders.`);
  process.exit(0);
}

run();
