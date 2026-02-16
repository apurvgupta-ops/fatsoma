import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/models/Event";

export async function GET() {
  try {
    await connectDB();

    const events = await Event.find({}).sort({ createdAt: -1 }).lean().exec();

    // Convert MongoDB documents to plain objects with string IDs
    const serializedEvents = events.map((event) => ({
      ...event,
      id: event._id.toString(),
      _id: undefined,
      eventDate: event.eventDate.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }));

    return NextResponse.json({ ok: true, events: serializedEvents });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { ok: false, message: "Unable to fetch events." },
      { status: 500 },
    );
  }
}
