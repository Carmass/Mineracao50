import { LandingHero } from "@/components/landing/hero";
import { LandingFeatures } from "@/components/landing/features";
import { LandingMarketplaces } from "@/components/landing/marketplaces";
import { LandingPricing } from "@/components/landing/pricing";
import { LandingTestimonials } from "@/components/landing/testimonials";
import { LandingNav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/footer";
import { LandingStats } from "@/components/landing/stats";
import { LandingCTA } from "@/components/landing/cta";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070809] text-white overflow-x-hidden">
      <LandingNav />
      <LandingHero />
      <LandingStats />
      <LandingFeatures />
      <LandingMarketplaces />
      <LandingTestimonials />
      <LandingPricing />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
