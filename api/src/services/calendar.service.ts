import crypto from "crypto";
import { google } from "googleapis";
import User from "../models/User";
import { AppError } from "../utils/AppError";
import dotenv from "dotenv";
import path from "path";
const nodeEnv =
  process.env.NODE_ENV === "production" ? "production" : "development";
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${nodeEnv}`),
});

const WEB_URL = process.env.WEB_URL || "http://localhost:3001";
const API_URL = process.env.API_URL || "http://localhost:3016";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_OAUTH_REDIRECT_URI =
  process.env.GOOGLE_OAUTH_REDIRECT_URI ||
  `${API_URL}/api/calendar/google/callback`;
const CALENDAR_STATE_SECRET =
  process.env.CALENDAR_STATE_SECRET ||
  process.env.JWT_SECRET ||
  "dev-calendar-state-secret-change-me";

interface CalendarStatePayload {
  userId: string;
  redirectPath: string;
  ts: number;
}

interface AddCalendarEventInput {
  eventName: string;
  eventDescription: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  city: string;
  mapsLink?: string;
}

function getOAuthClient() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new AppError("Google Calendar integration is not configured", 500);
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URI,
  );
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signState(payloadB64: string) {
  return crypto
    .createHmac("sha256", CALENDAR_STATE_SECRET)
    .update(payloadB64)
    .digest("base64url");
}

function encodeState(payload: CalendarStatePayload) {
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signState(payloadB64);
  return `${payloadB64}.${signature}`;
}

function decodeAndVerifyState(state: string): CalendarStatePayload {
  const [payloadB64, providedSig] = state.split(".");
  if (!payloadB64 || !providedSig) {
    throw AppError.badRequest("Invalid calendar callback state");
  }

  const expectedSig = signState(payloadB64);
  if (providedSig.length !== expectedSig.length) {
    throw AppError.badRequest("Invalid calendar callback signature");
  }
  const isValid = crypto.timingSafeEqual(
    Buffer.from(providedSig),
    Buffer.from(expectedSig),
  );

  if (!isValid) {
    throw AppError.badRequest("Invalid calendar callback signature");
  }

  const payload = JSON.parse(
    base64UrlDecode(payloadB64),
  ) as CalendarStatePayload;
  if (!payload.userId || !payload.redirectPath || !payload.ts) {
    throw AppError.badRequest("Invalid calendar callback payload");
  }

  if (Date.now() - payload.ts > 10 * 60 * 1000) {
    throw AppError.badRequest("Calendar connect link expired");
  }

  return payload;
}

function buildRedirectUrl(
  path: string,
  status: "connected" | "failed",
  message?: string,
) {
  const safePath = path.startsWith("/") ? path : "/events";
  const url = new URL(safePath, WEB_URL);
  url.searchParams.set("calendar", status);
  if (message) {
    url.searchParams.set("calendar_message", message);
  }
  return url.toString();
}

function buildLocalDateTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("T")[0].split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  return new Date(
    year,
    (month || 1) - 1,
    day || 1,
    hours || 0,
    minutes || 0,
    0,
    0,
  );
}

export async function getGoogleCalendarStatus(userId: string) {
  const user = (await User.findById(userId).lean()) as any;
  if (!user) throw AppError.notFound("User not found");

  const calendar = user.googleCalendar;
  return {
    connected: Boolean(
      calendar?.connected && (calendar?.refreshToken || calendar?.accessToken),
    ),
    email: calendar?.email ?? null,
  };
}

export async function createGoogleConnectUrl(
  userId: string,
  redirectPath?: string,
) {
  const safeRedirectPath =
    redirectPath && redirectPath.startsWith("/") ? redirectPath : "/events";

  const oauth2Client = getOAuthClient();
  const state = encodeState({
    userId,
    redirectPath: safeRedirectPath,
    ts: Date.now(),
  });

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
      "openid",
    ],
    state,
  });

  return { url };
}

export async function handleGoogleCallback(code: string, state: string) {
  const parsedState = decodeAndVerifyState(state);
  const oauth2Client = getOAuthClient();

  try {
    const tokenResponse = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokenResponse.tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    const user = await User.findById(parsedState.userId);
    if (!user) {
      return buildRedirectUrl(
        parsedState.redirectPath,
        "failed",
        "User not found",
      );
    }

    const existing = (user as any).googleCalendar || {};
    const tokens = tokenResponse.tokens;

    (user as any).googleCalendar = {
      connected: true,
      email: userInfo.data.email || existing.email || null,
      accessToken: tokens.access_token || existing.accessToken || undefined,
      refreshToken: tokens.refresh_token || existing.refreshToken || undefined,
      expiryDate: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : existing.expiryDate,
      scope: tokens.scope || existing.scope || undefined,
      connectedAt: existing.connectedAt || new Date(),
    };

    await user.save();
    return buildRedirectUrl(parsedState.redirectPath, "connected");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Google callback failed";
    return buildRedirectUrl(parsedState.redirectPath, "failed", msg);
  }
}

export async function disconnectGoogleCalendar(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound("User not found");

  (user as any).googleCalendar = {
    connected: false,
    email: null,
    accessToken: undefined,
    refreshToken: undefined,
    expiryDate: undefined,
    scope: undefined,
    connectedAt: undefined,
  };

  await user.save();
}

export async function addEventToGoogleCalendar(
  userId: string,
  input: AddCalendarEventInput,
) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound("User not found");

  const calendarCreds = (user as any).googleCalendar;
  if (
    !calendarCreds?.connected ||
    (!calendarCreds.refreshToken && !calendarCreds.accessToken)
  ) {
    throw AppError.badRequest("Google Calendar is not connected");
  }

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: calendarCreds.accessToken || undefined,
    refresh_token: calendarCreds.refreshToken || undefined,
    expiry_date: calendarCreds.expiryDate
      ? new Date(calendarCreds.expiryDate).getTime()
      : undefined,
  });

  const startDate = buildLocalDateTime(input.eventDate, input.startTime);
  let endDate = buildLocalDateTime(input.eventDate, input.endTime);
  if (endDate <= startDate) {
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  }

  const location = [input.venueName, input.city].filter(Boolean).join(", ");
  const description = [
    input.eventDescription,
    input.mapsLink ? `Map: ${input.mapsLink}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  let created: any;
  try {
    created = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: input.eventName,
        description,
        location,
        start: { dateTime: startDate.toISOString() },
        end: { dateTime: endDate.toISOString() },
      },
    });
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "status" in err
        ? Number((err as { status?: number }).status)
        : undefined;
    const msg =
      err && typeof err === "object" && "message" in err
        ? String((err as { message?: string }).message)
        : "Failed to add event to Google Calendar";

    const looksLikeAuthIssue =
      status === 401 ||
      status === 403 ||
      /invalid_grant|invalid credentials|unauthorized|No refresh token is set/i.test(
        msg,
      );

    if (looksLikeAuthIssue) {
      throw AppError.unauthorized(
        "Google Calendar authorization expired. Please reconnect Google Calendar.",
      );
    }

    throw new AppError(`Google Calendar error: ${msg}`, 502);
  }

  const creds = oauth2Client.credentials;
  (user as any).googleCalendar = {
    ...(calendarCreds || {}),
    connected: true,
    accessToken: creds.access_token || calendarCreds.accessToken || undefined,
    refreshToken:
      creds.refresh_token || calendarCreds.refreshToken || undefined,
    expiryDate: creds.expiry_date
      ? new Date(creds.expiry_date)
      : calendarCreds.expiryDate,
  };
  await user.save();

  return {
    eventId: created.data.id || null,
    htmlLink: created.data.htmlLink || null,
  };
}
