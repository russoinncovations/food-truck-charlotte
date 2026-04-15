// Mock data for the food truck platform
// In production, this would come from Supabase

export interface FoodTruck {
  id: string
  name: string
  slug: string
  cuisine: string[]
  description: string
  image: string
  rating: number
  reviewCount: number
  priceRange: "$" | "$$" | "$$$"
  isOpen: boolean
  isFeatured: boolean
  location?: {
    lat: number
    lng: number
    address: string
  }
  schedule: ScheduleItem[]
  menu: MenuItem[]
  socialLinks: {
    instagram?: string
    facebook?: string
    twitter?: string
    website?: string
  }
}

export interface ScheduleItem {
  id: string
  date: string
  startTime: string
  endTime: string
  location: string
  address: string
  lat: number
  lng: number
  eventName?: string
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image?: string
  isPopular?: boolean
}

export interface Event {
  id: string
  name: string
  slug: string
  description: string
  image: string
  date: string
  startTime: string
  endTime: string
  location: string
  address: string
  lat: number
  lng: number
  type: "market" | "brewery" | "festival" | "private" | "corporate"
  trucksAttending: string[]
  isFeatured: boolean
}

// Sample food trucks
export const foodTrucks: FoodTruck[] = [
  {
    id: "1",
    name: "Taco Loco",
    slug: "taco-loco",
    cuisine: ["Mexican", "Tacos"],
    description: "Authentic street tacos made with family recipes passed down through generations. Our handmade tortillas and slow-cooked meats bring the flavors of Mexico City to Charlotte.",
    image: "/images/truck-tacos.jpg",
    rating: 4.9,
    reviewCount: 342,
    priceRange: "$",
    isOpen: true,
    isFeatured: true,
    location: {
      lat: 35.2271,
      lng: -80.8431,
      address: "South End, Charlotte"
    },
    schedule: [
      { id: "s1", date: "2026-04-13", startTime: "11:00", endTime: "14:00", location: "South End", address: "2000 South Blvd, Charlotte, NC", lat: 35.2101, lng: -80.8571, eventName: "Lunch at South End" },
      { id: "s2", date: "2026-04-13", startTime: "17:00", endTime: "21:00", location: "NoDa Brewing", address: "2921 N Tryon St, Charlotte, NC", lat: 35.2527, lng: -80.8128 },
      { id: "s3", date: "2026-04-14", startTime: "11:00", endTime: "15:00", location: "Romare Bearden Park", address: "300 S Church St, Charlotte, NC", lat: 35.2219, lng: -80.8456 },
      { id: "s4", date: "2026-04-15", startTime: "11:00", endTime: "14:00", location: "Ballantyne", address: "15105 John J Delaney Dr, Charlotte, NC", lat: 35.0537, lng: -80.8518 },
    ],
    menu: [
      { id: "m1", name: "Street Tacos (3)", description: "Choice of carne asada, carnitas, or chicken with cilantro, onion, and salsa verde", price: 10, isPopular: true },
      { id: "m2", name: "Birria Tacos (3)", description: "Slow-braised beef in consomé with melted cheese", price: 14, isPopular: true },
      { id: "m3", name: "Quesadilla", description: "Large flour tortilla with cheese and choice of protein", price: 12 },
      { id: "m4", name: "Elote", description: "Mexican street corn with mayo, cotija, and tajin", price: 6 },
    ],
    socialLinks: {
      instagram: "tacolocoCLT",
      facebook: "tacolococharlotte"
    }
  },
  {
    id: "2",
    name: "Smoke & Fire BBQ",
    slug: "smoke-fire-bbq",
    cuisine: ["BBQ", "Southern"],
    description: "Low and slow Texas-style BBQ smoked for up to 16 hours. Our brisket, ribs, and pulled pork have won multiple awards at Charlotte BBQ competitions.",
    image: "/images/truck-bbq.jpg",
    rating: 4.8,
    reviewCount: 567,
    priceRange: "$$",
    isOpen: true,
    isFeatured: true,
    location: {
      lat: 35.2527,
      lng: -80.8128,
      address: "NoDa, Charlotte"
    },
    schedule: [
      { id: "s1", date: "2026-04-13", startTime: "11:00", endTime: "15:00", location: "Plaza Midwood", address: "1520 Central Ave, Charlotte, NC", lat: 35.2216, lng: -80.8134 },
      { id: "s2", date: "2026-04-14", startTime: "11:00", endTime: "20:00", location: "Olde Mecklenburg Brewery", address: "4150 Yancey Rd, Charlotte, NC", lat: 35.2002, lng: -80.8797 },
      { id: "s3", date: "2026-04-15", startTime: "11:00", endTime: "14:00", location: "Uptown", address: "201 S College St, Charlotte, NC", lat: 35.2258, lng: -80.8431 },
    ],
    menu: [
      { id: "m1", name: "Brisket Plate", description: "1/2 lb smoked brisket with two sides", price: 18, isPopular: true },
      { id: "m2", name: "Pulled Pork Sandwich", description: "Slow-smoked pork with tangy slaw on brioche", price: 12 },
      { id: "m3", name: "Rib Tips", description: "Tender rib tips with house-made sauce", price: 14, isPopular: true },
      { id: "m4", name: "Mac & Cheese", description: "Creamy smoked gouda mac", price: 5 },
    ],
    socialLinks: {
      instagram: "smokefirebbq",
      website: "https://smokefirebbq.com"
    }
  },
  {
    id: "3",
    name: "Sugar Rush",
    slug: "sugar-rush",
    cuisine: ["Desserts", "Sweets"],
    description: "Handcrafted mini donuts made fresh to order with creative toppings and glazes. Perfect for events, parties, or whenever you need something sweet.",
    image: "/images/truck-desserts.jpg",
    rating: 4.7,
    reviewCount: 289,
    priceRange: "$",
    isOpen: false,
    isFeatured: true,
    location: {
      lat: 35.2216,
      lng: -80.8134,
      address: "Plaza Midwood, Charlotte"
    },
    schedule: [
      { id: "s1", date: "2026-04-13", startTime: "14:00", endTime: "20:00", location: "Camp North End", address: "1824 Statesville Ave, Charlotte, NC", lat: 35.2485, lng: -80.8531 },
      { id: "s2", date: "2026-04-14", startTime: "10:00", endTime: "14:00", location: "Matthews Farmers Market", address: "188 N Trade St, Matthews, NC", lat: 35.1168, lng: -80.7237 },
    ],
    menu: [
      { id: "m1", name: "Classic Dozen", description: "12 mini donuts with cinnamon sugar", price: 8, isPopular: true },
      { id: "m2", name: "Glazed Dozen", description: "Choice of maple, chocolate, or strawberry glaze", price: 10 },
      { id: "m3", name: "Loaded Dozen", description: "Premium toppings: Oreo, s'mores, or fruity pebbles", price: 12, isPopular: true },
      { id: "m4", name: "Ice Cream Sandwich", description: "Mini donuts with vanilla ice cream", price: 7 },
    ],
    socialLinks: {
      instagram: "sugarrushclt"
    }
  },
  {
    id: "4",
    name: "Wing Dynasty",
    slug: "wing-dynasty",
    cuisine: ["Wings", "American"],
    description: "Crispy fried wings with 15 signature sauces from mild to extreme. Our dry rubs and wet sauces are made in-house daily.",
    image: "/images/truck-wings.jpg",
    rating: 4.6,
    reviewCount: 412,
    priceRange: "$$",
    isOpen: true,
    isFeatured: false,
    location: {
      lat: 35.2485,
      lng: -80.8531,
      address: "Camp North End, Charlotte"
    },
    schedule: [
      { id: "s1", date: "2026-04-13", startTime: "11:00", endTime: "21:00", location: "Sycamore Brewing", address: "2161 Hawkins St, Charlotte, NC", lat: 35.2089, lng: -80.8589 },
      { id: "s2", date: "2026-04-14", startTime: "16:00", endTime: "21:00", location: "Legion Brewing", address: "1906 Commonwealth Ave, Charlotte, NC", lat: 35.2216, lng: -80.8134 },
      { id: "s3", date: "2026-04-15", startTime: "11:00", endTime: "14:00", location: "Bank of America Stadium", address: "800 S Mint St, Charlotte, NC", lat: 35.2258, lng: -80.8528 },
    ],
    menu: [
      { id: "m1", name: "10 Wing Combo", description: "10 wings with choice of sauce and fries", price: 16, isPopular: true },
      { id: "m2", name: "6 Wing Basket", description: "6 wings with choice of sauce", price: 10 },
      { id: "m3", name: "Wing Platter (25)", description: "Party size with 3 sauces", price: 35, isPopular: true },
      { id: "m4", name: "Loaded Fries", description: "Fries topped with wing sauce and ranch", price: 8 },
    ],
    socialLinks: {
      instagram: "wingdynastyclt",
      facebook: "wingdynastycharlotte"
    }
  },
  {
    id: "5",
    name: "Pho on Wheels",
    slug: "pho-on-wheels",
    cuisine: ["Vietnamese", "Asian"],
    description: "Traditional Vietnamese pho with 12-hour bone broth, banh mi sandwiches, and fresh spring rolls. Bringing authentic flavors to the streets of Charlotte.",
    image: "/images/truck-tacos.jpg",
    rating: 4.8,
    reviewCount: 198,
    priceRange: "$$",
    isOpen: true,
    isFeatured: false,
    location: {
      lat: 35.2089,
      lng: -80.8589,
      address: "South End, Charlotte"
    },
    schedule: [
      { id: "s1", date: "2026-04-13", startTime: "11:00", endTime: "14:00", location: "South End", address: "2000 South Blvd, Charlotte, NC", lat: 35.2101, lng: -80.8571 },
      { id: "s2", date: "2026-04-14", startTime: "11:00", endTime: "14:00", location: "Uptown", address: "201 S College St, Charlotte, NC", lat: 35.2258, lng: -80.8431 },
    ],
    menu: [
      { id: "m1", name: "Pho Tai", description: "Rare beef pho with rice noodles in rich bone broth", price: 14, isPopular: true },
      { id: "m2", name: "Banh Mi", description: "Vietnamese sandwich with pickled veggies and cilantro", price: 10 },
      { id: "m3", name: "Spring Rolls (4)", description: "Fresh rolls with shrimp, herbs, and peanut sauce", price: 8 },
      { id: "m4", name: "Vermicelli Bowl", description: "Rice noodles with grilled meat and fresh herbs", price: 13, isPopular: true },
    ],
    socialLinks: {
      instagram: "phoonwheelsclt"
    }
  },
  {
    id: "6",
    name: "The Grilled Cheese Truck",
    slug: "grilled-cheese-truck",
    cuisine: ["American", "Comfort Food"],
    description: "Gourmet grilled cheese sandwiches with artisan breads and premium cheeses. Comfort food elevated to an art form.",
    image: "/images/truck-bbq.jpg",
    rating: 4.5,
    reviewCount: 276,
    priceRange: "$",
    isOpen: false,
    isFeatured: false,
    location: {
      lat: 35.2219,
      lng: -80.8456,
      address: "Uptown, Charlotte"
    },
    schedule: [
      { id: "s1", date: "2026-04-14", startTime: "11:00", endTime: "15:00", location: "First Ward Park", address: "301 E 7th St, Charlotte, NC", lat: 35.2295, lng: -80.8384 },
      { id: "s2", date: "2026-04-15", startTime: "11:00", endTime: "14:00", location: "Dilworth", address: "300 East Blvd, Charlotte, NC", lat: 35.2067, lng: -80.8554 },
    ],
    menu: [
      { id: "m1", name: "Classic Melt", description: "Sharp cheddar on sourdough with tomato soup", price: 9, isPopular: true },
      { id: "m2", name: "Mac Daddy", description: "Mac & cheese stuffed grilled cheese", price: 12, isPopular: true },
      { id: "m3", name: "Bacon Jam", description: "Gouda, bacon jam, and caramelized onions", price: 13 },
      { id: "m4", name: "Tomato Soup", description: "House-made creamy tomato basil", price: 5 },
    ],
    socialLinks: {
      instagram: "grilledcheesetruck",
      facebook: "thegrilledcheesetruck"
    }
  }
]

// Sample events
export const events: Event[] = [
  {
    id: "1",
    name: "South End Food Truck Friday",
    slug: "south-end-food-truck-friday",
    description: "Every Friday, the best food trucks in Charlotte gather at South End for lunch. Live music, cold drinks, and amazing food.",
    image: "/images/event-festival.jpg",
    date: "2026-04-17",
    startTime: "11:00",
    endTime: "14:00",
    location: "South End",
    address: "2000 South Blvd, Charlotte, NC 28203",
    lat: 35.2101,
    lng: -80.8571,
    type: "market",
    trucksAttending: ["1", "2", "5"],
    isFeatured: true
  },
  {
    id: "2",
    name: "NoDa Brewing Food Truck Rally",
    slug: "noda-brewing-food-truck-rally",
    description: "Monthly food truck rally at NoDa Brewing with 8+ trucks, craft beer, and live entertainment. Family and dog friendly!",
    image: "/images/event-festival.jpg",
    date: "2026-04-18",
    startTime: "16:00",
    endTime: "21:00",
    location: "NoDa Brewing Company",
    address: "2921 N Tryon St, Charlotte, NC 28206",
    lat: 35.2527,
    lng: -80.8128,
    type: "brewery",
    trucksAttending: ["1", "3", "4", "6"],
    isFeatured: true
  },
  {
    id: "3",
    name: "Charlotte Food Truck Festival",
    slug: "charlotte-food-truck-festival",
    description: "The biggest food truck event of the year! 30+ trucks, live bands, craft vendors, and family activities at Romare Bearden Park.",
    image: "/images/event-festival.jpg",
    date: "2026-04-25",
    startTime: "11:00",
    endTime: "20:00",
    location: "Romare Bearden Park",
    address: "300 S Church St, Charlotte, NC 28202",
    lat: 35.2219,
    lng: -80.8456,
    type: "festival",
    trucksAttending: ["1", "2", "3", "4", "5", "6"],
    isFeatured: true
  },
  {
    id: "4",
    name: "Camp North End Night Market",
    slug: "camp-north-end-night-market",
    description: "Explore Camp North End after dark with food trucks, local artisans, and live music in Charlotte's coolest venue.",
    image: "/images/event-festival.jpg",
    date: "2026-04-19",
    startTime: "17:00",
    endTime: "22:00",
    location: "Camp North End",
    address: "1824 Statesville Ave, Charlotte, NC 28206",
    lat: 35.2485,
    lng: -80.8531,
    type: "market",
    trucksAttending: ["2", "3", "4"],
    isFeatured: false
  },
  {
    id: "5",
    name: "Olde Meck Sunday Funday",
    slug: "olde-meck-sunday-funday",
    description: "Sunday Funday at Olde Mecklenburg Brewery featuring rotating food trucks, $4 pints, and lawn games.",
    image: "/images/event-festival.jpg",
    date: "2026-04-19",
    startTime: "12:00",
    endTime: "18:00",
    location: "Olde Mecklenburg Brewery",
    address: "4150 Yancey Rd, Charlotte, NC 28217",
    lat: 35.2002,
    lng: -80.8797,
    type: "brewery",
    trucksAttending: ["2", "6"],
    isFeatured: false
  }
]

// Helper functions
export function getTruckById(id: string): FoodTruck | undefined {
  return foodTrucks.find(truck => truck.id === id)
}

export function getTruckBySlug(slug: string): FoodTruck | undefined {
  return foodTrucks.find(truck => truck.slug === slug)
}

export function getEventById(id: string): Event | undefined {
  return events.find(event => event.id === id)
}

export function getEventBySlug(slug: string): Event | undefined {
  return events.find(event => event.slug === slug)
}

export function getFeaturedTrucks(): FoodTruck[] {
  return foodTrucks.filter(truck => truck.isFeatured)
}

export function getFeaturedEvents(): Event[] {
  return events.filter(event => event.isFeatured)
}

export function getTrucksOpen(): FoodTruck[] {
  return foodTrucks.filter(truck => truck.isOpen)
}

export function getTrucksByCuisine(cuisine: string): FoodTruck[] {
  return foodTrucks.filter(truck => 
    truck.cuisine.some(c => c.toLowerCase() === cuisine.toLowerCase())
  )
}

export function getEventsToday(): Event[] {
  const today = new Date().toISOString().split('T')[0]
  return events.filter(event => event.date === today)
}

export function getEventsThisWeek(): Event[] {
  const today = new Date()
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  return events.filter(event => {
    const eventDate = new Date(event.date)
    return eventDate >= today && eventDate <= weekFromNow
  })
}

export function getTrucksForEvent(eventId: string): FoodTruck[] {
  const event = getEventById(eventId)
  if (!event) return []
  return event.trucksAttending
    .map(id => getTruckById(id))
    .filter((truck): truck is FoodTruck => truck !== undefined)
}

// Cuisine categories for filtering
export const cuisineCategories = [
  { id: "all", name: "All", icon: "utensils" },
  { id: "mexican", name: "Mexican", icon: "🌮" },
  { id: "bbq", name: "BBQ", icon: "🍖" },
  { id: "desserts", name: "Desserts", icon: "🍩" },
  { id: "wings", name: "Wings", icon: "🍗" },
  { id: "asian", name: "Asian", icon: "🍜" },
  { id: "american", name: "American", icon: "🍔" },
]
