import { redirect } from "next/navigation";

// Help & support moved to the Support tab.
export default function HelpPage() {
  redirect("/support");
}
