import { z } from "zod";

const optionalStr = z
  .string()
  .default("")
  .transform((s) => (s.trim() === "" ? undefined : s.trim()));

export const eventRequestSchema = z.object({
  hostName: z.string().trim().min(1, "Your name is required."),
  hostEmail: z.string().trim().email("Please enter a valid email."),
  hostPhone: z.string().trim().min(1, "Phone is required."),
  eventDate: z.string().trim().min(1, "Event date is required."),
  eventLocation: z.string().trim().min(1, "Event location is required."),
  guestCount: z.coerce.number().int().positive("Guest count must be a positive number."),
  indoorOutdoor: z.enum(["indoor", "outdoor", "both"], {
    message: "Please choose indoor or outdoor.",
  }),
  cuisinePreferences: z.string().trim().min(1, "Cuisine preferences are required."),
  budgetRange: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.enum(["under_500", "500_1000", "1000_2000", "2000_plus"]).optional(),
  ),
});

export const truckRegisterSchema = z.object({
  truckName: z.string().trim().min(1, "Truck name is required."),
  ownerName: z.string().trim().min(1, "Owner name is required."),
  email: z.string().trim().email("Please enter a valid email."),
  phone: z.string().trim().min(1, "Phone is required."),
  cuisineTypes: z.string().trim().min(1, "Add at least one cuisine type."),
  instagram: optionalStr,
  website: optionalStr,
});

export function firstZodError(error: z.ZodError): string {
  const first = error.issues[0];
  if (first?.message) return first.message;
  return "Please check your input and try again.";
}
