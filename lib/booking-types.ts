export type EventType = 
  | 'corporate'
  | 'wedding'
  | 'birthday'
  | 'brewery'
  | 'neighborhood'
  | 'festival'
  | 'private'
  | 'other'

export type BudgetRange = 
  | 'under_500'
  | '500_1000'
  | '1000_2000'
  | '2000_5000'
  | '5000_plus'
  | 'flexible'

export type BookingStatus = 
  | 'new'
  | 'contacted'
  | 'in_progress'
  | 'quoted'
  | 'confirmed'
  | 'completed'
  | 'cancelled'

export interface BookingRequest {
  id: string
  created_at: string
  updated_at: string
  
  // Contact Information
  contact_name: string
  contact_email: string
  contact_phone?: string
  organization_name?: string
  
  // Event Details
  event_type: EventType
  event_date: string
  event_start_time?: string
  event_end_time?: string
  
  // Location
  venue_name?: string
  venue_address: string
  venue_city: string
  venue_state: string
  venue_zip?: string
  
  // Guest & Budget Info
  expected_guests: number
  budget_range?: BudgetRange
  
  // Preferences
  cuisine_preferences?: string[]
  specific_trucks?: string[]
  dietary_requirements?: string[]
  
  // Additional Info
  additional_notes?: string
  how_heard_about_us?: string
  
  // Status tracking
  status: BookingStatus
  admin_notes?: string
  assigned_to?: string
  truck_responses?: TruckResponse[]
}

export interface TruckResponse {
  truck_id: string
  truck_name: string
  responded_at: string
  status: 'interested' | 'declined' | 'quoted'
  quote_amount?: number
  message?: string
}

export interface BookingFormData {
  // Step 1: Event Details
  event_type: EventType
  event_date: string
  event_start_time: string
  event_end_time: string
  expected_guests: number
  
  // Step 2: Location
  venue_name: string
  venue_address: string
  venue_city: string
  venue_state: string
  venue_zip: string
  
  // Step 3: Preferences
  cuisine_preferences: string[]
  specific_trucks: string[]
  dietary_requirements: string[]
  budget_range: BudgetRange
  
  // Step 4: Contact Info
  contact_name: string
  contact_email: string
  contact_phone: string
  organization_name: string
  additional_notes: string
  how_heard_about_us: string
}

export const EVENT_TYPES: { value: EventType; label: string; description: string }[] = [
  { value: 'corporate', label: 'Corporate Event', description: 'Office parties, team lunches, company picnics' },
  { value: 'wedding', label: 'Wedding', description: 'Rehearsal dinners, receptions, after-parties' },
  { value: 'birthday', label: 'Birthday Party', description: 'Kids parties, milestone celebrations' },
  { value: 'brewery', label: 'Brewery/Taproom', description: 'Regular pop-ups at your venue' },
  { value: 'neighborhood', label: 'Neighborhood/HOA', description: 'Block parties, community events' },
  { value: 'festival', label: 'Festival/Fair', description: 'Large public events with multiple vendors' },
  { value: 'private', label: 'Private Party', description: 'Backyard gatherings, house parties' },
  { value: 'other', label: 'Other', description: 'Something else not listed' },
]

export const BUDGET_RANGES: { value: BudgetRange; label: string }[] = [
  { value: 'under_500', label: 'Under $500' },
  { value: '500_1000', label: '$500 - $1,000' },
  { value: '1000_2000', label: '$1,000 - $2,000' },
  { value: '2000_5000', label: '$2,000 - $5,000' },
  { value: '5000_plus', label: '$5,000+' },
  { value: 'flexible', label: 'Flexible / Not sure yet' },
]

export const CUISINE_OPTIONS = [
  'Mexican / Tacos',
  'BBQ / Smoked Meats',
  'Burgers',
  'Pizza',
  'Asian Fusion',
  'Southern / Soul Food',
  'Desserts / Ice Cream',
  'Coffee / Beverages',
  'Mediterranean',
  'Seafood',
  'Vegan / Vegetarian',
  'Wings / Chicken',
]

export const DIETARY_OPTIONS = [
  'Vegetarian options required',
  'Vegan options required',
  'Gluten-free options required',
  'Nut-free options required',
  'Halal options required',
  'Kosher options required',
]

export const HOW_HEARD_OPTIONS = [
  'Facebook Group',
  'Google Search',
  'Friend/Family Referral',
  'Saw a truck at an event',
  'Instagram',
  'Other',
]
