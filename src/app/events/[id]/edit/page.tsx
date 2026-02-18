import { notFound } from "next/navigation";
import { getEventById } from "@/app/actions/events";
import EventEditForm from "@/components/events/EventEditForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventEditPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  return <EventEditForm event={event} />;
}
