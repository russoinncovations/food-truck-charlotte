import type { FoodTruck } from "@/lib/types";

export const trucks: FoodTruck[] = [
  {
    slug: "queen-city-tacos",
    name: "Queen City Tacos",
    cuisine: "Tacos",
    description: "Street-style tacos with bold salsas and house-pickled toppings.",
    serviceArea: "Uptown, South End, NoDa",
    shortBio:
      "A Charlotte favorite for late-night bites and neighborhood festivals, known for fresh tortillas and local produce.",
    menuHighlights: ["Carne Asada Taco", "Birria Quesadilla", "Elote Cup"],
    eventTypesServed: ["Neighborhood events", "School nights", "Private parties"],
    featured: true,
  },
  {
    slug: "carolina-smash-co",
    name: "Carolina Smash Co.",
    cuisine: "Burgers",
    description: "Crispy-edge smash burgers, loaded fries, and classic shakes.",
    serviceArea: "Plaza Midwood, University City, Matthews",
    shortBio:
      "Built for game days and block parties, serving crowd-friendly burger combos with fast service.",
    menuHighlights: ["Double Smash", "Pimento Bacon Burger", "Garlic Parm Fries"],
    eventTypesServed: ["Office lunches", "Brewery pop-ups", "HOA socials"],
    featured: true,
  },
  {
    slug: "smoke-ring-charlotte",
    name: "Smoke Ring Charlotte",
    cuisine: "BBQ",
    description: "Slow-smoked brisket, pulled pork, and signature Carolina sides.",
    serviceArea: "South Charlotte, Ballantyne, Pineville",
    shortBio:
      "Family-run BBQ truck focused on authentic smoke and reliable catering for large gatherings.",
    menuHighlights: ["Brisket Plate", "Pulled Pork Sandwich", "Smoked Mac & Cheese"],
    eventTypesServed: ["Corporate events", "Church gatherings", "Wedding weekends"],
  },
  {
    slug: "sweet-route-desserts",
    name: "Sweet Route Desserts",
    cuisine: "Desserts",
    description: "Gourmet cookies, mini cheesecakes, and rotating seasonal sweets.",
    serviceArea: "Dilworth, Myers Park, SouthPark",
    shortBio:
      "A dessert-first truck bringing bakery quality treats to neighborhood events and markets.",
    menuHighlights: ["Salted Caramel Cookie", "Banana Pudding Cup", "Brownie Sundae"],
    eventTypesServed: ["Birthday parties", "Community markets", "School fundraisers"],
  },
  {
    slug: "clt-wing-lab",
    name: "CLT Wing Lab",
    cuisine: "Wings",
    description: "Crispy wings with house-made sauces from mild honey to blazing hot.",
    serviceArea: "NoDa, Camp North End, Concord",
    shortBio:
      "Known for flavor variety and quick setup, perfect for sports nights and late-evening events.",
    menuHighlights: ["Lemon Pepper Wings", "Hot Honey Wings", "Loaded Tots"],
    eventTypesServed: ["Sports events", "Brewery nights", "Concert parking lots"],
  },
  {
    slug: "island-lane-eats",
    name: "Island Lane Eats",
    cuisine: "Caribbean",
    description: "Jerk chicken, plantains, and island bowls with vibrant spices.",
    serviceArea: "East Charlotte, Mint Hill, Harrisburg",
    shortBio:
      "Bringing Caribbean comfort food to Charlotte with warm hospitality and family recipes.",
    menuHighlights: ["Jerk Chicken Plate", "Curry Goat Bowl", "Fried Plantains"],
    eventTypesServed: ["Church festivals", "Cultural events", "Neighborhood parties"],
  },
  {
    slug: "uptown-soul-kitchen",
    name: "Uptown Soul Kitchen",
    cuisine: "Soul Food",
    description: "Classic soul plates with modern portions and Southern hospitality.",
    serviceArea: "Uptown, West Charlotte, Huntersville",
    shortBio:
      "A trusted truck for comfort food fans, popular for office parks and family reunions.",
    menuHighlights: ["Fried Chicken Plate", "Candied Yams", "Collard Greens"],
    eventTypesServed: ["Office events", "Family reunions", "School celebrations"],
  },
  {
    slug: "morning-bell-coffee",
    name: "Morning Bell Coffee",
    cuisine: "Coffee",
    description: "Specialty coffee, cold brew, and pastry pairings for morning crowds.",
    serviceArea: "Uptown, South End, Fort Mill",
    shortBio:
      "Mobile coffee bar serving early events, community races, and business openings.",
    menuHighlights: ["Honey Cinnamon Latte", "Vanilla Cold Brew", "Local Pastry Box"],
    eventTypesServed: ["Office mornings", "Community races", "Grand openings"],
    featured: true,
  },
];
