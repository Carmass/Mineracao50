"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Search, TrendingUp, Tag, Heart,
  Megaphone, BarChart3, Bell, Settings, Zap, ChevronLeft, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/products", icon: Search, label: "Descoberta" },
  { href: "/trends", icon: TrendingUp, label: "Tendências" },
  { href: "/promotions", icon: Tag, label: "Promoções" },
  { href: "/ads", icon: Megaphone, label: "Anúncios" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/favorites", icon: Heart, label: "Favoritos" },
  { href: "/alerts", icon: Bell, label: "Alertas" },
];

const bottomItems = [
  { href: "/admin", icon: Shield, label: "Admin" },
  { href: "/settings", icon: Settings, label: "Configurações" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col bg-background border-r border-border h-full overflow-hidden"
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 p-4 border-b border-border", collapsed && "justify-center")}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold text-foreground text-sm"
          >
            MineraçãoPro
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                collapsed && "justify-center px-2",
                active
                  ? "bg-blue-500/15 text-blue-400"
                  : "text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", active && "text-blue-400")} />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
              {active && !collapsed && (
                <motion.div
                  layoutId="activeNav"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom items */}
      <div className="p-2 space-y-1 border-t border-border">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
                collapsed && "justify-center px-2",
                active ? "bg-foreground/10 text-foreground" : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-4 -right-3 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center text-foreground/40 hover:text-foreground/70 transition-colors z-10"
      >
        <ChevronLeft className={cn("w-3 h-3 transition-transform", collapsed && "rotate-180")} />
      </button>
    </motion.aside>
  );
}
