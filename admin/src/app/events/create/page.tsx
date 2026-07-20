"use client";

import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { CreateEventPanel } from "@/components/organiser/CreateEventPanel";

export default function CreateEventPage() {
  return (
    <AuthenticatedLayout>
      <CreateEventPanel />
    </AuthenticatedLayout>
  );
}
