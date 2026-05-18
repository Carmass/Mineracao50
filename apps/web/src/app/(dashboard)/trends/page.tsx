import { Metadata } from "next";
import { TrendsPage } from "@/components/trends/trends-page";

export const metadata: Metadata = { title: "Tendências" };

export default function Page() {
  return <TrendsPage />;
}
