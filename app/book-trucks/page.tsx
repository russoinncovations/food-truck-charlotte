import { redirect } from "next/navigation";

/** Legacy URL: always use `/book-a-truck`. */
export default async function BookTrucksRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const truck = sp.truck;
  const truckParam = typeof truck === "string" ? truck : undefined;
  const q = truckParam ? `?truck=${encodeURIComponent(truckParam)}` : "";
  redirect(`/book-a-truck${q}`);
}
