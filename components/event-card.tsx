import Link from "next/link";
import type { EventListItem } from "@/lib/types";

type EventCardProps = {
  event: EventListItem;
};

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="rounded-2xl border border-[#1E1E1E]/10 bg-[#fffdfa] p-6 shadow-[0_8px_24px_rgba(30,30,30,0.04)]">
      {event.featured ? (
        <p className="mb-3 inline-flex rounded-full border border-[#D97A2B]/30 bg-[#fff4ea] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#8f4f1c]">
          Featured Local Event
        </p>
      ) : null}
      <h3 className="mb-3 text-[1.65rem] font-semibold leading-tight text-[#1E1E1E]">{event.title}</h3>
      <p className="mb-1 text-[15px] font-medium text-[#1E1E1E]/78">{event.formattedDate}</p>
      {event.timeRange ? (
        <p className="mb-1 text-[15px] text-[#1E1E1E]/72">{event.timeRange}</p>
      ) : null}
      {event.locationName ? (
        <p
          className={
            event.address
              ? "mb-1 text-[15px] font-medium text-[#1E1E1E]/78"
              : "mb-4 text-[15px] font-medium text-[#1E1E1E]/78"
          }
        >
          {event.locationName}
        </p>
      ) : null}
      {event.address ? (
        <p className="mb-4 text-[15px] text-[#1E1E1E]/72">{event.address}</p>
      ) : null}
      {!event.locationName && !event.address ? <div className="mb-4" aria-hidden /> : null}
      {event.description ? (
        <p className="mb-5 text-[15px] leading-7 text-[#1E1E1E]/80">{event.description}</p>
      ) : null}
      <Link
        href="/book-a-truck"
        className="text-[15px] font-semibold text-[#1E1E1E] underline decoration-[#D97A2B]/60 underline-offset-4"
      >
        Plan an Event Like This
      </Link>
    </article>
  );
}
