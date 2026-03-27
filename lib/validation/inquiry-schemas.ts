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
  cuisinePreference: optionalStr,
  notes: optionalStr,
});

const vendorTypeEnum = z.enum(["food_truck", "food_cart", "tent_pop_up"]);

export const forTrucksSchema = z.object({
  vendorTypes: z
    .array(vendorTypeEnum)
    .min(1, "Please select your vendor type."),
  truckName: z.string().trim().min(1, "Truck name is required."),
  contactName: z.string().trim().min(1, "Contact name is required."),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: optionalStr,
  cuisine: z.string().trim().min(1, "Cuisine is required."),
  serviceArea: z.string().trim().min(1, "Service area is required."),
  instagram: optionalStr,
  website: optionalStr,
  description: optionalStr,
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
