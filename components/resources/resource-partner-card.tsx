import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ResourcePartnerListing } from "@/lib/resources/resource-guide-data"
import { ExternalLink, Mail, Phone } from "lucide-react"

type Props = {
  partner: ResourcePartnerListing
}

function badgeClass(badge: ResourcePartnerListing["badge"]): string {
  if (badge === "Founding Resource Partner") {
    return "border-primary/40 bg-primary/10 text-primary"
  }
  if (badge === "Featured Resource Partner") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100"
  }
  if (badge === "Category Sponsor") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
  }
  return ""
}

export function ResourcePartnerCard({ partner }: Props) {
  const imageUrl = partner.logoUrl?.trim() || partner.photoUrl?.trim() || null

  return (
    <Card className="h-full border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {partner.badge ? (
              <Badge variant="outline" className={`mb-2 text-[10px] font-medium ${badgeClass(partner.badge)}`}>
                {partner.badge}
              </Badge>
            ) : null}
            <CardTitle className="text-lg leading-snug">{partner.businessName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{partner.category}</p>
          </div>
          {imageUrl ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border bg-muted">
              <Image src={imageUrl} alt="" fill className="object-cover" sizes="48px" />
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground leading-relaxed">{partner.shortDescription}</p>
        {partner.serviceArea ? (
          <p>
            <span className="font-medium text-foreground">Service area:</span>{" "}
            <span className="text-muted-foreground">{partner.serviceArea}</span>
          </p>
        ) : null}
        {partner.bestFor ? (
          <p>
            <span className="font-medium text-foreground">Best for:</span>{" "}
            <span className="text-muted-foreground">{partner.bestFor}</span>
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          {partner.website ? (
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link href={partner.website} target="_blank" rel="noopener noreferrer">
                Website
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          ) : null}
          {partner.phone ? (
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link href={`tel:${partner.phone.replace(/\s/g, "")}`}>
                <Phone className="mr-1 h-3 w-3" />
                Call
              </Link>
            </Button>
          ) : null}
          {partner.email ? (
            <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
              <Link href={`mailto:${partner.email}`}>
                <Mail className="mr-1 h-3 w-3" />
                Email
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

/** Empty-state placeholder for founding partner slots (MVP). */
export function ResourcePartnerPlaceholderCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card className="h-full border-dashed bg-muted/20">
      <CardContent className="flex h-full min-h-[160px] flex-col items-center justify-center p-6 text-center">
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs">{description}</p>
      </CardContent>
    </Card>
  )
}
