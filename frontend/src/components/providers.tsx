"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { LiveProvider } from "@/components/live-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <LiveProvider>{children}</LiveProvider>
        <Toaster position="top-right" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
