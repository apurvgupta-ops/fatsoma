"use client";



import { useMemo, useState } from "react";

import type { EventResponse } from "@/lib/shared";

import { createApiClient } from "@/lib/api";

import { getEventImageUrl } from "@/components/organiser/OrganiserUi";

import {

  OtlBackIcon,

  OtlFlatInput,

  OtlFlatTextarea,

  OtlSectionHead,

} from "@/components/organiser/OtlFormPrimitives";

import { TicketGroupsPanel } from "@/components/organiser/tickets/TicketGroupsPanel";

import { useTicketGroups } from "@/components/organiser/tickets/useTicketGroups";

import { canEditEventCopy } from "@/lib/eventEditRules";

import {

  buildTicketGroupsForEditSave,

  eventToDraftGroups,

  snapshotOriginalBatches,

} from "@/lib/eventTicketGroups";



const card =

  "rounded-[10px] border border-[#222222] bg-[#141414] p-5";

const statLbl =

  "font-sans text-[10px] font-semibold tracking-[0.14em] text-[#888888] uppercase";



type Props = {

  event: EventResponse;

  token: string;

  onCancel: () => void;

  onSaved: () => void;

};



export function EditEventPanel({ event, token, onCancel, onSaved }: Props) {

  const [step, setStep] = useState(0);

  const [eventName, setEventName] = useState(event.eventName ?? "");

  const [description, setDescription] = useState(event.eventDescription ?? "");

  const [saveError, setSaveError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const [backHover, setBackHover] = useState(false);



  const canEditCopy = useMemo(() => canEditEventCopy(event), [event]);

  const imagePreview = getEventImageUrl(event);



  const initial = eventToDraftGroups(event);

  const [lockedTierIds] = useState(

    () =>

      new Set(initial.groups.flatMap((g) => g.tiers.map((t) => t.id))),

  );

  const [originalBatchByTierId] = useState(() =>

    snapshotOriginalBatches(initial.groups, event),

  );



  const {

    groups,

    activeGroupId,

    setActiveGroupId,

    addGroup,

    deleteGroup,

    addTier,

    deleteTier,

    updateTier,

    duplicateTier,

    moveTier,

  } = useTicketGroups(initial.groups);



  const handleSaveChanges = async () => {

    for (const group of groups) {

      for (const tier of group.tiers) {

        if (lockedTierIds.has(tier.id)) continue;

        if (!tier.name.trim()) {

          setSaveError("Every new tier needs a name.");

          return;

        }

        if ((Number(tier.price) || 0) <= 0) {

          setSaveError(`Price for "${tier.name}" must be greater than 0.`);

          return;

        }

      }

    }



    setSaveError(null);

    setSaving(true);



    try {

      const client = createApiClient(token);

      const ticketGroups = buildTicketGroupsForEditSave(

        groups,

        lockedTierIds,

        originalBatchByTierId,

      );

      const totalTickets = ticketGroups.reduce(

        (sum, g) =>

          sum +

          g.batches.reduce(

            (s: number, b) => s + Number(b.quantity || 0),

            0,

          ),

        0,

      );



      const res = await client.updateEvent(event.id, {

        eventDescription: canEditCopy

          ? description.trim()

          : (event.eventDescription ?? ""),

        eventImage: event.eventImage,

        totalTickets,

        ticketGroups,

        status: event.status,

        eventName: canEditCopy ? eventName.trim() : event.eventName,

        eventCategory: event.eventCategory,

        venueName: event.venueName,

        addressLine: event.addressLine,

        city: event.city,

        postcode: event.postcode,

        country: event.country,

        mapsLink: event.mapsLink,

        eventDate: event.eventDate,

        eventEndDate: event.eventEndDate,

        startTime: event.startTime,

        endTime: event.endTime,

        lastEntryTime: event.lastEntryTime,

        ageRestriction: event.ageRestriction,

        dynamicPricing: event.dynamicPricing,

        allowResale: event.allowResale,

        platformCommission: event.platformCommission,

      });



      if (res.ok) {

        onSaved();

      } else {

        setSaveError(res.message || "Failed to save changes");

      }

    } catch (err: unknown) {

      setSaveError(err instanceof Error ? err.message : "Failed to save changes");

    } finally {

      setSaving(false);

    }

  };



  const handleBack = () => {

    if (step === 1) setStep(0);

    else onCancel();

  };



  return (

    <div className="relative z-[1] flex min-h-full flex-1 flex-col px-10 pt-7 pb-0">

      <div className="mb-5">

        <button

          type="button"

          onClick={handleBack}

          onMouseEnter={() => setBackHover(true)}

          onMouseLeave={() => setBackHover(false)}

          className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 font-sans text-[13px] transition-colors duration-150"

          style={{ color: backHover ? "#F5F0E8" : "#888888" }}

        >

          <OtlBackIcon />

          {step === 1 ? "Back to Details" : "Back to Event"}

        </button>

      </div>



      <div className="mb-6">

        <h1 className="m-0 mb-1 font-sans text-[26px] font-bold text-cream">

          Edit Event

        </h1>

        <p className="m-0 font-sans text-[13px] text-[#888888]">

          {event.eventName}

        </p>

      </div>



      {step === 0 && (

        <div className="flex flex-1 flex-col gap-4 pb-20">

          <div className={card}>

            <OtlSectionHead>Event Details</OtlSectionHead>

            {!canEditCopy && (

              <p className="mb-4 rounded-md border border-[#222222] bg-[#0D0D0D] px-3.5 py-2.5 font-sans text-xs text-[#888888]">

                Name and description can only be edited more than 6 hours before

                the event starts.

              </p>

            )}

            <div className="mb-3">

              <label className="mb-1.5 block font-sans text-[11px] tracking-[0.08em] text-[#888888] uppercase">

                Event Name

              </label>

              {canEditCopy ? (

                <OtlFlatInput

                  value={eventName}

                  onChange={setEventName}

                  placeholder="Event name"

                />

              ) : (

                <div className="font-sans text-[13px] text-cream">

                  {event.eventName}

                </div>

              )}

            </div>

            <div className="mb-3">

              <label className="mb-1.5 block font-sans text-[11px] tracking-[0.08em] text-[#888888] uppercase">

                Event Description

              </label>

              {canEditCopy ? (

                <OtlFlatTextarea

                  value={description}

                  onChange={setDescription}

                />

              ) : (

                <div className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-cream">

                  {event.eventDescription || "—"}

                </div>

              )}

            </div>

            <div>

              <label className="mb-1.5 block font-sans text-[11px] tracking-[0.08em] text-[#888888] uppercase">

                Event Image

              </label>

              {imagePreview ? (

                <div className="overflow-hidden rounded-md border border-[#222222] bg-[#0D0D0D]">

                  {/* eslint-disable-next-line @next/next/no-img-element */}

                  <img

                    src={imagePreview}

                    alt="Event"

                    className="block h-40 w-full object-cover"

                  />

                </div>

              ) : (

                <div className="rounded-md border border-dashed border-[#333333] bg-[#0D0D0D] px-5 py-7 text-center font-sans text-[13px] text-[#555555]">

                  No image

                </div>

              )}

            </div>

          </div>



          <div className={card}>

            <OtlSectionHead>Venue</OtlSectionHead>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-8">

              <div>

                <div className={`${statLbl} mb-0.5`}>Venue Name</div>

                <div className="font-sans text-[13px] text-cream">

                  {event.venueName}

                </div>

              </div>

              <div>

                <div className={`${statLbl} mb-0.5`}>City</div>

                <div className="font-sans text-[13px] text-cream">{event.city}</div>

              </div>

              {event.addressLine && (

                <div>

                  <div className={`${statLbl} mb-0.5`}>Venue Address</div>

                  <div className="font-sans text-[13px] text-cream">

                    {event.addressLine}

                  </div>

                </div>

              )}

              {event.postcode && (

                <div>

                  <div className={`${statLbl} mb-0.5`}>Post Code</div>

                  <div className="font-sans text-[13px] text-cream">

                    {event.postcode}

                  </div>

                </div>

              )}

              {event.mapsLink && (

                <div className="sm:col-span-2">

                  <div className={`${statLbl} mb-0.5`}>Google Maps Link</div>

                  <div className="break-all font-sans text-[13px] text-gold">

                    {event.mapsLink}

                  </div>

                </div>

              )}

            </div>

            <p className="mt-4 border-t border-[#222222] pt-4 font-sans text-[11px] text-[#555555]">

              Venue details can&apos;t be changed after an event is created.

            </p>

          </div>

        </div>

      )}



      {step === 1 && (

        <div className="flex flex-1 flex-col gap-4 pb-20">

          <TicketGroupsPanel

            groups={groups}

            activeGroupId={activeGroupId}

            setActiveGroupId={setActiveGroupId}

            addGroup={addGroup}

            deleteGroup={deleteGroup}

            addTier={addTier}

            deleteTier={deleteTier}

            updateTier={updateTier}

            duplicateTier={duplicateTier}

            moveTier={moveTier}

            lockedTierIds={lockedTierIds}

            allowAddGroup={false}

            showPromoCodes={false}

          />

          {saveError && (

            <div className="rounded-md border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-3.5 py-2.5 font-sans text-xs text-[#F87171]">

              {saveError}

            </div>

          )}

        </div>

      )}



      <div className="sticky bottom-0 z-10 -mx-10 mt-auto flex justify-end gap-3 border-t border-[#1A1A1A] bg-void px-10 py-3.5">

        <button

          type="button"

          onClick={onCancel}

          className="cursor-pointer border-none bg-transparent px-[18px] py-2.5 font-sans text-[13px] text-[#888888] hover:text-cream"

        >

          Cancel

        </button>

        {step === 0 ? (

          <button

            type="button"

            onClick={() => setStep(1)}

            className="cursor-pointer border-none bg-gold px-[22px] py-2.5 font-sans text-[13px] font-semibold text-void hover:bg-[#D4B862]"

          >

            Continue →

          </button>

        ) : (

          <button

            type="button"

            disabled={saving}

            onClick={handleSaveChanges}

            className="cursor-pointer border-none bg-gold px-[22px] py-2.5 font-sans text-[13px] font-semibold text-void hover:bg-[#D4B862] disabled:opacity-50"

          >

            {saving ? "Saving…" : "Save Changes"}

          </button>

        )}

      </div>

    </div>

  );

}


