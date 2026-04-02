import dotenv from "dotenv";
import path from "path";

const nodeEnv = process.env.NODE_ENV === "production" ? "production" : "development";
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });

async function run() {
  console.log("Payment test script disabled. PayPal flow is now active.");
}

run();

