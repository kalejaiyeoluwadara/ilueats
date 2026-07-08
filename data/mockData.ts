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

/* -------------------------------------------------------------------------- */
/* Meet-at landmarks (Ilisan-Remo area) — static pickup config, no backend    */
/* model exists for these yet.                                               */
/* -------------------------------------------------------------------------- */

export type PickupLandmark = {
  id: string;
  label: string;
  detail: string;
};

export const pickupLandmarks: PickupLandmark[] = [
  {
    id: "lm_babcock_main",
    label: "Babcock University main gate",
    detail: "Main entrance roundabout — meet by the security booth.",
  },
  {
    id: "lm_ilisan_park",
    label: "Ilisan motor park",
    detail: "Central park area — look for the canopy rows.",
  },
  {
    id: "lm_oou_junction",
    label: "OOU mini campus junction",
    detail: "T-junction by the campus wall — opposite the kiosks.",
  },
  {
    id: "lm_ajadeh",
    label: "Ajadeh market square",
    detail: "Open square side — near the fruit sellers.",
  },
  {
    id: "lm_pharmacy_roundabout",
    label: "Tera Pharmacy roundabout",
    detail: "Small roundabout — meet on the pharmacy side.",
  },
];
