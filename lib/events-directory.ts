import { getSupabase } from "@/lib/supabase";
import type { EventListItem } from "@/lib/types";

type EventsRow = {
  id: string;
  title: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  address: string | null;
  description: string | null;
  featured: boolean | null;
  active: boolean | null;
};

function formatEventDate(isoDate: string): string {
  const parts = isoDate.split("-").map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return isoDate;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(dt);
}

function formatTime(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  const m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${ap}`;
}

function buildTimeRange(start: string | null, end: string | null): string | null {
  const a = formatTime(start);
  const b = formatTime(end);
  if (a && b) return `${a} – ${b}`;
  if (a) return a;
  if (b) return b;
  return null;
}

function mapRow(row: EventsRow): EventListItem {
  return {
    id: row.id,
    title: row.title,
    formattedDate: formatEventDate(row.date),
    timeRange: buildTimeRange(row.start_time, row.end_time),
    locationName: (row.location_name ?? "").trim(),
    address: (row.address ?? "").trim(),
    description: (row.description ?? "").trim(),
    featured: row.featured === true,
  };
}

export type FetchEventsOptions = {
  featuredOnly?: boolean;
  limit?: number;
};

/**
 * Active events from Supabase, soonest first.
 * Returns [] if Supabase is unavailable or the query fails.
 */
export async function fetchActiveEventsFromSupabase(
  options?: FetchEventsOptions,
): Promise<EventListItem[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return [];
  }

  let query = supabase.from("events").select("*").eq("active", true).order("date", { ascending: true });

  if (options?.featuredOnly) {
    query = query.eq("featured", true);
  }

  if (options?.limit != null && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[events] Supabase fetch failed:", error.message);
    return [];
  }

  if (!data?.length) {
    return [];
  }

  return (data as EventsRow[]).map(mapRow);
}
