import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
import Stripe from "stripe";

async function run() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  const pi = await stripe.paymentIntents.retrieve('pi_3TE6Y9Hth0s3aPt61V467UXb', { expand: ['latest_charge'] });
  console.log("Payment Intent:", JSON.stringify(pi, null, 2));
}

run();
