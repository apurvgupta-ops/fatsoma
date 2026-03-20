import nodemailer from "nodemailer";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER || "localhost",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }
  return _transporter;
}

const FROM = process.env.SMTP_USER || "noreply@onthelist.com";
const APP_NAME = "On The List";

function baseHtml(body: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:24px;font-weight:700;color:#d4a843;font-style:italic;letter-spacing:0.05em;">${APP_NAME}</span>
    </div>
    <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:16px;padding:32px;">
      ${body}
    </div>
    <p style="text-align:center;margin-top:24px;font-size:11px;color:#666;">
      © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
    </p>
  </div>
</body>
</html>`;
}

/**
 * Fire-and-forget email sender. Logs errors but never throws,
 * so callers are not blocked by email failures.
 */
async function send(to: string, subject: string, html: string) {
  try {
    await getTransporter().sendMail({ from: `"${APP_NAME}" <${FROM}>`, to, subject, html });
    console.log(`[Email] Sent "${subject}" to ${to}`);
  } catch (err: any) {
    const code = err?.code || "";
    if (code === "ESOCKET" || code === "ECONNREFUSED" || code === "ETIMEDOUT") {
      console.warn(`[Email] SMTP unreachable (${code}) — skipped "${subject}" to ${to}`);
    } else {
      console.error(`[Email] Failed to send "${subject}" to ${to}: ${err.message || err}`);
    }
  }
}

export async function sendWelcomeEmail(name: string, email: string) {
  const html = baseHtml(`
    <h2 style="margin:0 0 8px;color:#f0e6d2;font-size:20px;">Welcome, ${name}!</h2>
    <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Your account has been created successfully. You're now on the list!
    </p>
    <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Browse events, grab tickets, and enjoy secure no-scalping resale — all in one place.
    </p>
    <div style="text-align:center;margin-top:24px;">
      <a href="${process.env.WEB_URL || "http://localhost:3001"}/events"
         style="display:inline-block;background:#d4a843;color:#0f0f0f;padding:12px 32px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;">
        Browse Events
      </a>
    </div>
  `);
  await send(email, `Welcome to ${APP_NAME}!`, html);
}

export async function sendBookingConfirmationEmail(data: {
  email: string;
  customerName: string;
  eventName: string;
  ticketBatchName: string;
  quantity: number;
  totalAmount: number;
  orderId: string;
}) {
  const html = baseHtml(`
    <h2 style="margin:0 0 8px;color:#f0e6d2;font-size:20px;">Booking Confirmed!</h2>
    <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hi ${data.customerName || "there"}, your tickets have been booked successfully.
    </p>
    <div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#888;">Event</td>
          <td style="padding:8px 0;color:#f0e6d2;text-align:right;font-weight:600;">${data.eventName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;">Ticket</td>
          <td style="padding:8px 0;color:#f0e6d2;text-align:right;">${data.ticketBatchName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;">Quantity</td>
          <td style="padding:8px 0;color:#f0e6d2;text-align:right;">${data.quantity}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;border-top:1px solid #2a2a2a;">Total Paid</td>
          <td style="padding:8px 0;color:#d4a843;text-align:right;font-weight:700;font-size:16px;border-top:1px solid #2a2a2a;">£${data.totalAmount.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    <p style="color:#666;font-size:12px;margin:0;">Order ID: ${data.orderId}</p>
    <div style="text-align:center;margin-top:24px;">
      <a href="${process.env.WEB_URL || "http://localhost:3001"}/tickets"
         style="display:inline-block;background:#d4a843;color:#0f0f0f;padding:12px 32px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;">
        View My Tickets
      </a>
    </div>
  `);
  await send(data.email, `Booking Confirmed — ${data.eventName}`, html);
}

export async function sendResaleBookingEmail(data: {
  email: string;
  customerName: string;
  eventName: string;
  ticketBatchName: string;
  totalAmount: number;
  orderId: string;
}) {
  const html = baseHtml(`
    <h2 style="margin:0 0 8px;color:#f0e6d2;font-size:20px;">Resale Ticket Purchased!</h2>
    <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hi ${data.customerName || "there"}, you've successfully purchased a resale ticket. A fresh QR code has been generated for you.
    </p>
    <div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#888;">Event</td>
          <td style="padding:8px 0;color:#f0e6d2;text-align:right;font-weight:600;">${data.eventName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;">Ticket</td>
          <td style="padding:8px 0;color:#f0e6d2;text-align:right;">${data.ticketBatchName} (Resale)</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;border-top:1px solid #2a2a2a;">Total Paid</td>
          <td style="padding:8px 0;color:#d4a843;text-align:right;font-weight:700;font-size:16px;border-top:1px solid #2a2a2a;">£${data.totalAmount.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    <p style="color:#666;font-size:12px;margin:0;">Order ID: ${data.orderId}</p>
    <div style="text-align:center;margin-top:24px;">
      <a href="${process.env.WEB_URL || "http://localhost:3001"}/tickets"
         style="display:inline-block;background:#d4a843;color:#0f0f0f;padding:12px 32px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;">
        View My Tickets
      </a>
    </div>
  `);
  await send(data.email, `Resale Ticket Confirmed — ${data.eventName}`, html);
}

export async function sendAccountDeletedEmail(name: string, email: string) {
  const html = baseHtml(`
    <h2 style="margin:0 0 8px;color:#f0e6d2;font-size:20px;">Account Deleted</h2>
    <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hi ${name}, your ${APP_NAME} account has been deleted by an administrator.
    </p>
    <p style="color:#999;font-size:14px;line-height:1.6;margin:0;">
      If you believe this was a mistake, please contact support.
    </p>
  `);
  await send(email, `Your ${APP_NAME} account has been deleted`, html);
}

export async function sendTicketSoldEmail(data: {
  email: string;
  sellerName: string;
  eventName: string;
  ticketBatchName: string;
  askingPrice: number;
  sellerPayout: number;
  buyerName: string;
}) {
  const html = baseHtml(`
    <h2 style="margin:0 0 8px;color:#f0e6d2;font-size:20px;">Your Ticket Has Been Sold!</h2>
    <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hi ${data.sellerName || "there"}, great news — your resale ticket has been purchased.
    </p>
    <div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:20px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:#888;">Event</td>
          <td style="padding:8px 0;color:#f0e6d2;text-align:right;font-weight:600;">${data.eventName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;">Ticket</td>
          <td style="padding:8px 0;color:#f0e6d2;text-align:right;">${data.ticketBatchName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;">Sale Price</td>
          <td style="padding:8px 0;color:#f0e6d2;text-align:right;">£${data.askingPrice.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#888;border-top:1px solid #2a2a2a;">Your Payout</td>
          <td style="padding:8px 0;color:#4ade80;text-align:right;font-weight:700;font-size:16px;border-top:1px solid #2a2a2a;">£${data.sellerPayout.toFixed(2)}</td>
        </tr>
      </table>
    </div>
    <p style="color:#999;font-size:13px;line-height:1.6;margin:0 0 8px;">
      The payout of <strong style="color:#4ade80;">£${data.sellerPayout.toFixed(2)}</strong> has been refunded to your original payment method. It may take 5–10 business days to appear on your statement.
    </p>
    <div style="text-align:center;margin-top:24px;">
      <a href="${process.env.WEB_URL || "http://localhost:3001"}/tickets"
         style="display:inline-block;background:#d4a843;color:#0f0f0f;padding:12px 32px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;">
        View My Tickets
      </a>
    </div>
  `);
  await send(data.email, `Ticket Sold — ${data.eventName}`, html);
}

export async function sendPasswordResetEmail(name: string, email: string, resetLink: string) {
  const html = baseHtml(`
    <h2 style="margin:0 0 8px;color:#f0e6d2;font-size:20px;">Password Reset</h2>
    <p style="color:#999;font-size:14px;line-height:1.6;margin:0 0 20px;">
      Hi ${name}, we received a request to reset your password. Click the button below to set a new one.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${resetLink}"
         style="display:inline-block;background:#d4a843;color:#0f0f0f;padding:12px 32px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;">
        Reset Password
      </a>
    </div>
    <p style="color:#666;font-size:12px;margin:0;">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
    </p>
  `);
  await send(email, `Reset your ${APP_NAME} password`, html);
}
