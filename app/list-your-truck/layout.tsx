import { Metadata } from "next"

export const metadata: Metadata = {
  title: "List Your Truck | Food Truck CLT",
  description:
    "Join Charlotte's largest food truck community. Reach 35,000+ local food lovers, manage your schedule, and grow your business.",
}

export default function ListYourTruckLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
