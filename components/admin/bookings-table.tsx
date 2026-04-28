"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  MoreHorizontal,
  Eye,
  Mail,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  MapPin,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { BookingRequest, BookingStatus } from "@/lib/booking-types"
import { EVENT_TYPES } from "@/lib/booking-types"
import { deleteBookingRequest } from "@/lib/admin/booking-requests-queries"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface BookingsTableProps {
  bookings: BookingRequest[]
}

const REQUEST_TYPE_SHORT: Record<string, string> = {
  specific_vendor: "Specific vendor",
  cuisine_match: "Cuisine",
  open_request: "Open",
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "New", variant: "default" },
  contacted: { label: "Contacted", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "secondary" },
  quoted: { label: "Quoted", variant: "secondary" },
  confirmed: { label: "Confirmed", variant: "default" },
  completed: { label: "Completed", variant: "outline" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  const searchParams = useSearchParams()
  const adminKey = searchParams.get("key") ?? ""

  const [rows, setRows] = useState<BookingRequest[]>(bookings)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    setRows(bookings)
  }, [bookings])

  const filteredBookings = rows.filter((booking) => {
    const matchesSearch =
      (booking.contact_name?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
      (booking.contact_email?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
      booking.organization_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.venue_address?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
      (booking.request_type ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.preferred_trucks ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.cuisine_preferences ?? []).some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter

    return matchesSearch && matchesStatus
  })

  async function confirmDelete() {
    if (!deleteTargetId) return
    setDeleteLoading(true)
    try {
      const result = await deleteBookingRequest(deleteTargetId, adminKey)
      if (result.ok) {
        setRows((prev) => prev.filter((b) => b.id !== deleteTargetId))
        setDeleteTargetId(null)
      } else {
        window.alert(result.error ?? "Could not delete booking")
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="space-y-4">
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && !deleteLoading && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete booking request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteLoading}
              onClick={() => void confirmDelete()}
            >
              {deleteLoading ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Contact</TableHead>
              <TableHead>Event</TableHead>
              <TableHead className="hidden lg:table-cell min-w-[9rem]">Routing</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="hidden sm:table-cell">Guests</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Submitted</TableHead>
              <TableHead className="w-[100px]">Delete</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No bookings found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => {
                const eventType = EVENT_TYPES.find((t) => t.value === booking.event_type)
                const statusConfig = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] ?? { label: "Pending", variant: "secondary" as const }

                return (
                  <TableRow key={booking.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{booking.contact_name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                          {booking.contact_email}
                        </p>
                        {booking.organization_name && (
                          <p className="text-xs text-muted-foreground">{booking.organization_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground hidden sm:block" />
                        <div>
                          <p className="font-medium text-foreground">
                            {formatDate(booking.event_date)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {eventType?.label || booking.event_type}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell align-top">
                      <div className="space-y-1 max-w-[14rem]">
                        <Badge variant="outline" className="font-normal text-[10px]">
                          {REQUEST_TYPE_SHORT[booking.request_type ?? ""] ?? booking.request_type ?? "—"}
                        </Badge>
                        {booking.vendor_type ? (
                          <p className="text-xs text-muted-foreground">Format: {booking.vendor_type}</p>
                        ) : null}
                        {booking.preferred_trucks ? (
                          <p className="text-xs text-foreground line-clamp-2">{booking.preferred_trucks}</p>
                        ) : null}
                        {booking.cuisine_preferences && booking.cuisine_preferences.length > 0 ? (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {booking.cuisine_preferences.join(", ")}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {booking.venue_city}, {booking.venue_state}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{booking.expected_guests}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusConfig.variant}
                        className={cn(
                          booking.status === "new" && "bg-yellow-500 hover:bg-yellow-600",
                          booking.status === "confirmed" && "bg-green-500 hover:bg-green-600"
                        )}
                      >
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatCreatedAt(booking.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={deleteLoading}
                        onClick={() => setDeleteTargetId(booking.id)}
                      >
                        <Trash2 className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/bookings/${booking.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Request
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredBookings.length} of {rows.length} requests
      </p>
    </div>
  )
}
