import type { Category } from "@/types";

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

export const categories: Category[] = [
  { id: "all", name: "All", emoji: "🍽️" },
  { id: "local", name: "Local", emoji: "" },
  { id: "pizza", name: "Pizza", emoji: "" },
  { id: "burgers", name: "Burgers", emoji: "" },
  { id: "shawarma", name: "Shawarma", emoji: "" },
  { id: "cakes", name: "Cakes", emoji: "" },
  { id: "snacks", name: "Snacks", emoji: "" },
  { id: "smoothies", name: "Smoothies", emoji: "" },
  { id: "drinks", name: "Drinks", emoji: "" },
];

// Landmarks are now served by the backend — see lib/api/landmarks.ts.
