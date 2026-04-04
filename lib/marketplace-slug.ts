/** URL-safe slug for marketplace truck rows (directory table requires unique slug). */
export function slugifyForTrucksTable(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "truck";
}
