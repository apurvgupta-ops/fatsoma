"use client";

import { useParams } from "next/navigation";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { OrganiserEventDetail } from "@/components/organiser/event-detail/OrganiserEventDetail";

export default function OrganiserEventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  return (
    <AuthenticatedLayout>
      <OrganiserEventDetail eventId={eventId} />
    </AuthenticatedLayout>
  );
}
