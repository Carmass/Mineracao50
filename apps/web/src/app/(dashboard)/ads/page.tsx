import { Metadata } from "next";
import { AdsTrackerPage } from "@/components/ads/ads-tracker-page";

export const metadata: Metadata = { title: "Rastreador de Anúncios" };

export default function Page() {
  return <AdsTrackerPage />;
}
