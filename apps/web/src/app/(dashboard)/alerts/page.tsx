import { Metadata } from "next";
import { AlertsPage } from "@/components/alerts/alerts-page";

export const metadata: Metadata = { title: "Alertas" };

export default function Page() {
  return <AlertsPage />;
}
