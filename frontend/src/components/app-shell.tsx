"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Car,
  LayoutDashboard,
  Menu,
  Moon,
  Sun,
  Users,
  Wrench,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useLive } from "@/components/live-provider";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: Activity },
  { href: "/bookings", label: "Bookings", icon: Car },
  { href: "/mechanics", label: "Mechanics", icon: Wrench },
  { href: "/customers", label: "Customers", icon: Users },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/15 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const { connected } = useLive();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r bg-sidebar p-4 md:flex md:flex-col">
        <div className="mb-6 flex items-center gap-2 px-1">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            IM
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Instant Mechanic</p>
            <p className="text-xs text-muted-foreground">Live operations</p>
          </div>
        </div>
        <NavLinks />
        <div className="mt-auto rounded-lg border bg-card p-3 text-xs text-muted-foreground">
          Ops console for dispatch, bookings, and mechanic utilization. Data
          refreshes live as jobs move through the field.
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="md:hidden" />}
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <NavLinks onClick={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">{title}</h1>
            {description ? (
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <span
              data-live-indicator
              data-connected={connected ? "true" : "false"}
              className={cn(
                "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs sm:inline-flex",
                "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
                "data-[connected=false]:border-border data-[connected=false]:text-muted-foreground"
              )}
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span data-live-label>Live</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
              aria-label="Toggle theme"
            >
              <Sun className="size-4 dark:hidden" />
              <Moon className="hidden size-4 dark:block" />
            </Button>
          </div>
        </header>
        <Separator className="md:hidden" />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
