import { z } from "zod";

/** Empty or missing fields become `undefined` after trim. */
const optionalStr = z
  .string()
  .default("")
  .transform((s) => (s.trim() === "" ? undefined : s.trim()));

export const bookATruckSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: optionalStr,
  eventType: z.string().trim().min(1, "Event type is required."),
  date: optionalStr,
  location: optionalStr,
  attendance: optionalStr,
  notes: optionalStr,
});

const vendorTypeEnum = z.enum(["food_truck", "food_cart", "tent_pop_up"]);

export const forTrucksSchema = z.object({
  vendorTypes: z
    .array(vendorTypeEnum)
    .min(1, "Please select your vendor type."),
  truckName: z.string().trim().min(1, "Truck / vendor name is required."),
  email: z.string().trim().email("Please enter a valid email address."),
  whatYouServe: z
    .string()
    .trim()
    .min(1, "Please describe what you serve.")
    .max(160, "Please keep this to 160 characters or less."),
  serviceArea: z.string().trim().min(1, "Please list the neighborhoods or areas you serve."),
  catering: z
    .string()
    .refine((v) => v === "yes" || v === "no", {
      message: "Please choose whether you offer catering.",
    }),
  instagram: optionalStr,
  website: optionalStr,
});

export const forVenuesSchema = z.object({
  contactName: z.string().trim().min(1, "Contact name is required."),
  venueName: z.string().trim().min(1, "Venue or business name is required."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: optionalStr,
  eventType: optionalStr,
  eventDate: optionalStr,
  address: optionalStr,
  attendance: optionalStr,
  notes: optionalStr,
});

export type BookATruckInput = z.infer<typeof bookATruckSchema>;
export type ForTrucksInput = z.infer<typeof forTrucksSchema>;
export type ForVenuesInput = z.infer<typeof forVenuesSchema>;

export function firstZodError(error: z.ZodError): string {
  const first = error.issues[0];
  if (first?.message) return first.message;
  return "Please check your input and try again.";
}
