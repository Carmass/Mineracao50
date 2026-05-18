import { Metadata } from "next";
import { PromotionsPage } from "@/components/promotions/promotions-page";

export const metadata: Metadata = { title: "Promoções" };

export default function Page() {
  return <PromotionsPage />;
}
