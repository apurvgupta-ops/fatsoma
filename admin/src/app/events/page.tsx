import { redirect } from "next/navigation";

export default function LegacyEventsPage() {
  redirect("/organiser-dashboard/events");
}
