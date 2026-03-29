/** Parse the plain-text body stored in `inquiries.message` for `for_trucks` submissions. */
export type ParsedForTrucksInquiry = {
  whatYouServe: string;
  serviceAreas: string;
  instagram: string;
  websiteFromMessage: string;
  cateringYes: boolean;
};

function lineValue(message: string, prefix: string): string {
  const lines = message.split("\n");
  const line = lines.find((l) => l.startsWith(prefix));
  if (!line) return "";
  return line.slice(prefix.length).trim();
}

function cleanDisplay(value: string): string {
  const t = value.trim();
  if (!t || t === "—" || t === "-") return "";
  return t;
}

export function parseForTrucksInquiryMessage(message: string): ParsedForTrucksInquiry {
  const cateringLine = lineValue(message, "Catering:").toLowerCase();
  return {
    whatYouServe: cleanDisplay(lineValue(message, "What you serve:")),
    serviceAreas: cleanDisplay(lineValue(message, "Service areas:")),
    instagram: cleanDisplay(lineValue(message, "Instagram:")),
    websiteFromMessage: cleanDisplay(lineValue(message, "Website:")),
    cateringYes: cateringLine.startsWith("y"),
  };
}
