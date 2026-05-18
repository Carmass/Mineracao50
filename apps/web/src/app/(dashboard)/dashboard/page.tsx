import { Metadata } from "next";
import { DashboardKPICards } from "@/components/dashboard/kpi-cards";
import { DashboardViralProducts } from "@/components/dashboard/viral-products";
import { DashboardTopSelling } from "@/components/dashboard/top-selling";
import { DashboardTrendingCategories } from "@/components/dashboard/trending-categories";
import { DashboardFlashSales } from "@/components/dashboard/flash-sales";
import { DashboardMarketplaceChart } from "@/components/dashboard/marketplace-chart";
import { DashboardRecentAlerts } from "@/components/dashboard/recent-alerts";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">Visão geral do mercado em tempo real</p>
      </div>

      <DashboardKPICards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardViralProducts />
        </div>
        <DashboardTrendingCategories />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardTopSelling />
        <DashboardFlashSales />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardMarketplaceChart />
        <DashboardRecentAlerts />
      </div>
    </div>
  );
}
