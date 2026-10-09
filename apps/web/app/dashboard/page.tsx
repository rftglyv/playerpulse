import { redirect } from "next/navigation";

// The auth gate in app/dashboard/layout.tsx may render the login card in place of this segment,
// so opt it out of instant-navigation validation (it would always be reported as "dropped").
export const instant = false;

export default function DashboardIndex() {
  redirect("/dashboard/overview");
}
