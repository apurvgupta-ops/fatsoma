"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createApiClient } from "@/lib/api";
import type { EventResponse } from "@/lib/shared";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { EditEventPanel } from "@/components/organiser/EditEventPanel";
import { organiserPaths } from "@/lib/organiserPaths";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const eventId = params.id as string;
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const client = createApiClient(token);
    client
      .getEvent(eventId)
      .then((res) => {
        if (res.ok && res.data) setEvent(res.data);
      })
      .finally(() => setLoading(false));
  }, [eventId, token]);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!event || !token) {
    return (
      <AuthenticatedLayout>
        <div className="px-10 py-9 font-sans text-[13px] text-[#555555]">
          Event not found.
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <EditEventPanel
        event={event}
        token={token}
        onCancel={() => router.push(organiserPaths.event(eventId))}
        onSaved={() => router.push(organiserPaths.event(eventId))}
      />
    </AuthenticatedLayout>
  );
}
