"use client";
import { useState, useEffect } from "react";
import { Bell, Search, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  user: User;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const initials = user.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <header className="h-14 border-b border-white/5 bg-[#0a0b0e]/50 backdrop-blur-sm flex items-center gap-4 px-4 md:px-6">
      {/* Search */}
      <div className={cn("flex-1 max-w-md relative", searchOpen && "flex-1")}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <Input
          placeholder="Buscar produtos, tendências..."
          className="pl-9 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm focus-visible:ring-blue-500/30"
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setSearchOpen(false)}
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 text-white/50 hover:text-white hover:bg-white/5"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {mounted && (theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 text-white/50 hover:text-white hover:bg-white/5 relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full" />
        </Button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <span className="text-sm text-white/70 hidden md:block max-w-[120px] truncate">
            {user.email}
          </span>
        </div>

        {/* Sign out */}
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 text-white/30 hover:text-white hover:bg-white/5"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
