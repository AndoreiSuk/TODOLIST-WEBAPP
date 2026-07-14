import { redirect } from "next/navigation";

export default function RootPage() {
  // Triggers an immediate redirect to the /home route
  redirect("/home");
}