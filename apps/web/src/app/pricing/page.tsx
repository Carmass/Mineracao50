import { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { LandingPricing } from "@/components/landing/pricing";
import { LandingFooter } from "@/components/landing/footer";

export const metadata: Metadata = { title: "Preços" };

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#070809] text-white">
      <LandingNav />
      <div className="pt-24">
        <LandingPricing />
      </div>
      <LandingFooter />
    </div>
  );
}
